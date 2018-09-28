(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.depp = factory();
  }
}(this, function() {
/**
 * Global dependencies.
 * @global {Object} document - DOM
 */

var depp = {},  // library singleton object
    _devnull = function() {},
    _bundleDefs = {},
    _callbackQueue = {},
    _resultCache = {},
    _fetchCache = {},
    _config = {};


/**
 * Throw error.
 * @param {string} error - Error string
 */
function throwError(error) {
  throw new Error('Depp Error: ' + error);
}


/**
 * De-reference bundles.
 * @param {string[]} bundleList - List of bundles
 * @param {object} ancestors - Set of previously processed bundles
 */
function dereferenceBundles(bundleList, ancestors) {
  ancestors = ancestors || [];
  
  var paths = [];

  bundleList.forEach(function(bundleName) {
    // check ancestors
    if (ancestors.indexOf(bundleName) >= 0) throwError("Circular reference");

    // add paths
    var x = _bundleDefs[bundleName],
        a;

    // throw error if bundle not defined
    if (!x) throwError("'" + bundleName + "' not defined");
    
    x.forEach(function(path) {
      if (path in _bundleDefs) {
        a = ancestors.slice();
        a.push(bundleName);
        paths = paths.concat(dereferenceBundles([path], a));
      } else {
        paths.push(path);
      }
    });
  });

  return paths;
}


/**
 * Subscribe to multi-event list.
 * @param {string[]} events - List of events
 * @param {Function} callbackFn - The callback function
 */
function subscribe(events, callbackFn) {
  var i = events.length,
      numWaiting = i,
      fn,
      event,
      x;

  // define callback function
  fn = function (event, exitEarly) {
    // execute error callback when first error is encountered
    if (exitEarly) return callbackFn(event);

    // execute success callback after all events have returned successfully
    numWaiting--;
    if (!numWaiting) callbackFn();
  };

  // register callback
  while (i--) {
    event = events[i];

    // execute callback if in result cache
    x = _resultCache[event];
    if (x) {
      fn(event, x);
      continue;
    }

    // add to callback queue
    x = _callbackQueue[event] = _callbackQueue[event] || [];
    x.push(fn);
  }
}


/**
 * Publish event.
 * @param {string} event - The event name
 * @param {string[]} result - The event result ('s' or 'e')
 */
function publish(event, result) {
  var q = _callbackQueue[event];

  // cache result
  _resultCache[event] = result;

  // exit if queue is empty
  if (!q) return;

  // empty callback queue
  while (q.length) {
    q[0](event, result);
    q.splice(0, 1);
  }
}


/**
 * Load individual file.
 * @param {string} path - The file path
 * @param {Function} callbackFn - The callback function
 */
function loadFile(path, callbackFn) {
  var doc = document,
      beforeCallbackFn = _config.before || _devnull,
      pathStripped = path.replace(/^(css|img)!/, ''),
      isCss,
      e;

  if (/(^css!|\.css$)/.test(path)) {
    isCss = true;

    // css
    e = doc.createElement('link');
    e.rel = 'stylesheet';
    e.href = pathStripped;
  } else if (/(^img!|\.(png|gif|jpg|svg)$)/.test(path)) {
    // image
    e = doc.createElement('img');
    e.src = pathStripped;    
  } else {
    // javascript
    e = doc.createElement('script');
    e.src = path;
    e.async = false;
  }

  e.onload = e.onerror = e.onbeforeload = function (ev) {
    var result = ev.type[0];

    // Note: The following code isolates IE using `hideFocus` and treats empty
    // stylesheets as failures to get around lack of onerror support
    if (isCss && 'hideFocus' in e) {
      try {
        if (!e.sheet.cssText.length) result = 'e';
      } catch (x) {
        // sheets objects created from load errors don't allow access to
        // `cssText`
        result = 'e';
      }
    }

    // handle beforeload. If defaultPrevented then that means the load will be
    // blocked (e.g. Ghostery/ABP on Safari)
    if (result == 'b') {
      if (ev.defaultPrevented) result = 'e';
      else return;
    }
    
    // execute callback
    callbackFn(path, result == 'e');
  };

  // execute before callback
  beforeCallbackFn(path, e);

  // add to document
  doc.head.appendChild(e);
}


/**
 * Define dependency bundles.
 * @param {Object} bundleDefs - Bundle definitions
 */
depp.define = function define(inputDefs) {
  var paths;

  // copy bundle defs
  for (var bundleName in inputDefs) {
    // throw error if bundle is already defined
    if (bundleName in _bundleDefs) throwError("Bundle already defined");

    paths = inputDefs[bundleName];

    // listify and add to cache
    _bundleDefs[bundleName] = paths.push ? paths : [paths];
  }
};


/**
 * Configure library.
 * @param {Object} newVals - New configuration values
 */
depp.config = function (newVals) {
  for (var k in newVals) _config[k] = newVals[k];
};


/**
 * Register callbacks and trigger onetime-only download (if necessary).
 * @param {string or string[]} bundleList - List of bundle names
 * @param {Function} successFn - Success callback
 * @param {Function} errorFn - Error callback
 */
depp.require = function require(bundleList, successFn, errorFn) {
  // listify and de-reference bundles
  var paths = dereferenceBundles(bundleList.push ? bundleList : [bundleList]);

  // subscribe to load events
  subscribe(paths, function(firstPathNotFound) {
    if (firstPathNotFound) (errorFn || _devnull)(firstPathNotFound);
    else (successFn || _devnull)();
  });

  // trigger file downloads
  paths.forEach(function(path) {
    // skip if file has already been fetched
    if (path in _fetchCache) return;

    // update fetch cache
    _fetchCache[path] = true;

    // load file and publish result
    loadFile(path, publish);
  });
};


/**
 * Check if bundle has already been defined
 * @param {string} bundleName - The bundle name
 */
depp.isDefined = function isDefined(bundleName) {
  return bundleName in _bundleDefs;
};


/**
 * Reset dependency trackers and bundle definitions
 */
depp.reset = function reset() {
  _bundleDefs = {};
  _callbackQueue = {};
  _resultCache = {};
  _fetchCache = {};
  _config = {};
};


// export
return depp;

}));

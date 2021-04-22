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
  
  var undefinedBundles = [], paths = [];

  bundleList.forEach(function(bundleName) {
    // check ancestors
    if (ancestors.indexOf(bundleName) >= 0) throwError("Circular reference");

    // update undefinedBundles list
    if (!(bundleName in _bundleDefs)) {
      return undefinedBundles.push('#' + bundleName);
    }
    
    // add paths
    _bundleDefs[bundleName].forEach(function(path) {
      if (path[0] == '#') {
        // dereference nested bundle
        var a = ancestors.slice();
        a.push(bundleName);
        a = dereferenceBundles([path.slice(1)], a);

        // update paths and undefinedBundles
        undefinedBundles = undefinedBundles.concat(a[0]);
        paths = paths.concat(a[1]);
      } else {
        // update paths
        paths.push(path);
      }
    });
  });

  return [undefinedBundles, paths];
}


/**
 * Execute callback function after bundles get defined.
 * @param {string[]} bundleList - List of bundle names
 * @param {Function} callbackFn - The callback function
 */
function onBundlesReady(bundleList, callbackFn) {
  var x = dereferenceBundles(bundleList);

  if (x[0].length) {
    subscribe(x[0], function() {onBundlesReady(bundleList, callbackFn);});
  } else {
    callbackFn(x[1]);
  }
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

  // execute callback and exit if event list is empty
  if (i == 0) return callbackFn();
  
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
    if (event in _resultCache) {
      fn(event, _resultCache[event]);
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
      pathStripped = path.replace(/^(css|img|module)!/, ''),
      isLegacyIECss,
      e;

  if (/(^css!|\.css$)/.test(path)) {
    // css
    e = doc.createElement('link');
    e.rel = 'stylesheet';
    e.href = pathStripped;

    // tag IE9+
    isLegacyIECss = 'hideFocus' in e;

    // use preload in IE Edge (to detect load errors)
    if (isLegacyIECss && e.relList) {
      isLegacyIECss = 0;
      e.rel = 'preload';
      e.as = 'style';
    }
  } else if (/(^img!|\.(png|gif|jpg|svg)$)/.test(path)) {
    // image
    e = doc.createElement('img');
    e.src = pathStripped;
  } else {
    // javascript
    e = doc.createElement('script');
    e.src = pathStripped;
    e.async = false;

    // module
    if (/^module!/.test(path)) e.type = "module";
  }

  e.onload = e.onerror = e.onbeforeload = function (ev) {
    var result = ev.type[0];

    // treat empty stylesheets as failures to get around lack of onerror
    // support in IE9-11
    if (isLegacyIECss) {
      try {
        if (!e.sheet.cssText.length) result = 'e';
      } catch (x) {
        // sheets objects created from load errors don't allow access to
        // `cssText` (unless error is Code:18 SecurityError)
	if (x.code != 18) result = 'e';
      }
    }

    // handle beforeload. If defaultPrevented then that means the load will be
    // blocked (e.g. Ghostery/ABP on Safari)
    if (result == 'b') {
      if (ev.defaultPrevented) result = 'e';
      else return;
    }

    // activate preloaded stylesheets
    if (result != 'e' && e.rel == 'preload' && e.as == 'style') {
      return e.rel = 'stylesheet'; // jshint ignore: line
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

    // publish bundle definition event
    publish('#' + bundleName);
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
  // listify
  bundleList = bundleList.push ? bundleList : [bundleList];

  // load files after bundles get defined
  onBundlesReady(bundleList, function(paths) {
    // subscribe to file load events
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
  });
};


/**
 * Manually register a bundle load
 * @param {string} bundleName - The bundle name
 */
depp.done = function done(bundleName) {
  // override bundle definition
  _bundleDefs[bundleName] = [];

  // publish definition event
  publish('#' + bundleName);
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

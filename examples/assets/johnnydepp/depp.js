if (!this.depp) (function(doc, ev) {
  // define global object
  depp = (function(){
    /**
 * Global dependencies.
 * @global {Object} document - DOM
 */

var depp = {},
    devnull = function() {},
    bundleDefs = {},  // maps bundleId : pathname[]
    fetchCache = {},  // maps pathname : true/false
    resultCache = {},  // maps pathname : 'e'|'s'
    callbackQueue = {},  // maps pathname : Function
    config = {};


/**
 * Throw error.
 * @param {string} error - Error string
 */
function throwError(error) {
  throw new Error('Depp Error ' + error);
}


/**
 * Check for circular references.
 * @param {string[]} paths - Bundle file paths
 */
function checkRefs(paths, bundleId) {
  // exit recursive loop
  if (!paths) return;
  
  var i = paths.length,
      path;
  
  while (i--) {
    path = paths[i];
    if (path === bundleId) throwError('2');
    checkRefs(bundleDefs[path], bundleId);
  }
}


/**
 * Subscribe to bundle load event.
 * @param {string[]} deps - List of dependencies
 * @param {Function} callbackFn - The callback function
 */
function subscribe(deps, callbackFn) {
  var depsNotFound = [],
      i = deps.length,
      numWaiting = i,
      fn,
      dep,
      r,
      q;

  // define callback function
  fn = function (dep, pathsNotFound) {
    if (pathsNotFound.length) depsNotFound.push(dep);

    numWaiting--;
    if (!numWaiting) callbackFn(depsNotFound);
  };

  // register callback
  while (i--) {
    dep = deps[i];

    // execute callback if in result cache
    r = resultCache[dep];
    if (r) {
      fn(dep, r);
      continue;
    }

    // add to callback queue
    q = callbackQueue[dep] = callbackQueue[dep] || [];
    q.push(fn);
  }
}


/**
 * Publish bundle load event.
 * @param {string} depId - Dependency id
 * @param {string[]} pathsNotFound - List of dependencies not found
 */
function publish(depId, pathsNotFound) {
  // exit if id isn't defined
  if (!depId) return;

  var q = callbackQueue[depId];

  // cache result
  resultCache[depId] = pathsNotFound;

  // exit if queue is empty
  if (!q) return;

  // empty callback queue
  while (q.length) {
    q[0](depId, pathsNotFound);
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
      beforeCallbackFn = config.before || devnull,
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
    callbackFn(path, result);
  };

  // execute before callback
  beforeCallbackFn(path, e);

  // add to document
  doc.head.appendChild(e);
}


/**
 * Load multiple files.
 * @param {string[]} paths - The file paths
 * @param {Function} callbackFn - The callback function
 */
function loadFiles(paths, callbackFn) {
  var numWaiting = paths.length,
      x = numWaiting,
      pathsNotFound = [],
      fn,
      i;

  // define callback function
  fn = function(path, result, defaultPrevented) {
    // handle error
    if (result == 'e') pathsNotFound.push(path);

    numWaiting--;
    if (!numWaiting) callbackFn(pathsNotFound);
  };

  // load scripts
  for (i=0; i < x; i++) loadFile(paths[i], fn);
}


/**
 * Execute callbacks.
 * @param {Function} successFn - Success callback
 * @param {Function} errorFn - Error callback
 * @param {string[]} depsNotFound - List of dependencies not found
 */
function executeCallbacks(successFn, errorFn, pathsNotFound) {
  if (pathsNotFound.length) (errorFn || devnull)(pathsNotFound);
  else (successFn || devnull)();
}


/**
 * Define dependency bundles.
 * @param {Object} bundleDefs - Bundle definitions
 */
depp.define = function define(inputDefs) {
  var bundleId,
      paths;
  
  // copy bundle defs
  for (bundleId in inputDefs) {
    // throw error if bundle is already defined
    if (bundleId in bundleDefs) throwError("1");

    paths = inputDefs[bundleId];

    // listify
    paths = paths.push ? paths : [paths];

    // check for circular references
    checkRefs(paths, bundleId);
    
    // add to cache
    bundleDefs[bundleId] = paths;
  }
};


/**
 * Configure library.
 * @param {Object} newVals - New configuration values
 */
depp.config = function (newVals) {
  for (var k in newVals) config[k] = newVals[k];
};


/**
 * Register callbacks and trigger onetime-only download (if necessary).
 * @param {string or string[]} bundleList - List of bundle ids
 * @param {Function} successFn - Success callback
 * @param {Function} errorFn - Error callback
 */
depp.require = function require(bundleList, successFn, errorFn) {
  // listify
  bundleList = bundleList.push ? bundleList : [bundleList];

  // subscribe to load event
  subscribe(bundleList, function(depsNotFound) {
    // execute callbacks
    executeCallbacks(successFn, errorFn, depsNotFound);
  });

  // trigger onetime-only downloads
  bundleList.forEach(function(bundleId) {
    // skip if dep in fetch cache or not in bundle definitions
    if (bundleId in fetchCache || !(bundleId in bundleDefs)) return;

    // update fetch cache
    fetchCache[bundleId] = true;
    
    // trigger download
    loadFiles(bundleDefs[bundleId], function(pathsNotFound) {
      publish(bundleId, pathsNotFound);
    });
  });
};


/**
 * Manually satisfy bundle dependencies.
 * @param {string} bundleId - The bundle id
 */
depp.done = function done(bundleId) {
  publish(bundleId, []);
};


/**
 * Check if bundle has already been defined
 * @param {string} bundleId - The bundle id
 */
depp.isDefined = function isDefined(bundleId) {
  return bundleId in bundleDefs;
};


/**
 * Reset dependency trackers and bundle definitions
 */
depp.reset = function reset() {
  bundleDefs = {};
  fetchCache = {};
  resultCache = {};
  callbackQueue = {};
  config = {};
};


// export
return depp;

  })();

  // dispatch load event
  ev = doc.createEvent('HTMLEvents');
  if (ev.initEvent) ev.initEvent('depp-load', false, false);
  else ev = new Event('depp-load');
  doc.dispatchEvent(ev);
})(document);

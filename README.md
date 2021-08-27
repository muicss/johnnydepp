# JohnnyDepp

<img src="https://www.muicss.com/static/images/johnnydepp.svg" width="250px">

JohnnyDepp is a tiny dependency manager for modern browsers (992 bytes).

[![Dependency Status](https://david-dm.org/muicss/johnnydepp.svg)](https://david-dm.org/muicss/johnnydepp)
[![devDependency Status](https://david-dm.org/muicss/johnnydepp/dev-status.svg)](https://david-dm.org/muicss/johnnydepp?type=dev)

## Introduction

JohnnyDepp is a tiny dependency manager for modern browsers (IE10+) that lets you fetch JavaScript, CSS and image files in parallel and execute code after your dependencies have been met. JohnnyDepp allows you to define code bundles and lazy-load the necessary files when you need them using the library's `require()` method. Each file will only be downloaded once so multiple calls to `require()` won't trigger duplicate downloads. The recommended way to use JohnnyDepp is to include the minified source of [depp.js](https://raw.githubusercontent.com/muicss/loadjs/master/dist/depp.min.js) in your &lt;html&gt; (possibly in the &lt;head&gt; tag) and then use the `depp` global to manage your dependencies after pageload.

JohnnyDepp is based on the [LoadJS](https://github.com/muicss/loadjs) library which powers the file fetching and error handling functionality behind the scenes. JohnnyDepp loads JavaScript files with `async: false` which means they will be downloaded in parallel and executed in series. If you're looking for a lower level async loading library you should check out LoadJS to see if that meets your needs.

Here's an example of what you can do with JohnnyDepp:

```javascript
// define dependencies
depp.define({
  'jquery': ['/path/to/jquery.js'],
  'plugin1': ['#jquery', '/path/to/plugin1.js', '/path/to/plugin1.css', '/path/to/plugin1.png'],
  'plugin2': ['#jquery', '/path/to/plugin2.js', '/path/to/plugin2.css', '/path/to/plugin2.png']
});

// load dependencies
depp.require(['plugin1', 'plugin2'], function() {
  /* plugin1 and plugin2 are ready to be used */
});
```

The latest version of JohnnyDepp can be found in the `dist/` directory in this repository:

  * [depp.js](https://cdn.rawgit.com/muicss/johnnydepp/0.1.4/dist/depp.js)
  * [depp.min.js](https://cdn.rawgit.com/muicss/johnnydepp/0.1.4/dist/depp.min.js)

You can also use it as a CJS or AMD module:

```
$ npm install --save johnnydepp
```

```javascript
var depp = require('johnnydepp');

depp.define({
  'jquery': ['/path/to/jquery.js'],
  'plugin1': ['#jquery', '/path/to/plugin1.js', '/path/to/plugin1.css', '/path/to/plugin1.png'],
  'plugin2': ['#jquery', '/path/to/plugin2.js', '/path/to/plugin2.css', '/path/to/plugin2.png']
});

depp.require(['plugin1', 'plugin2'], function() {
  /* plugin1 and plugin2 are ready to be used */
});
```

JohnnyDepp is 992 bytes (minified + gzipped).

## Browser Support

 * IE10+
 * Opera 12+
 * Safari 5+
 * Chrome
 * Firefox
 * iOS 6+
 * Android 4.4+

## Quickstart

```html
<!doctype html>
<html>
  <head>
    <script src="//cdn.rawgit.com/muicss/johnnydepp/0.1.4/dist/depp.min.js"></script>
    <script>
      // define dependencies
      depp.define({
        'jquery': [
          '//code.jquery.com/jquery-3.3.1.min.js'
        ],
        'jquery-ui': [
          '#jquery',
          '//code.jquery.com/ui/1.12.1/jquery-ui.min.js',
          '//code.jquery.com/ui/1.12.1/themes/cupertino/jquery-ui.css'
        ]
      });

      // load dependencies
      depp.require(['jquery-ui'], function() {
        $(function() {
          $("#datepicker").datepicker();
        });
      });
    </script>
  </head>
  <body>
    <p>Date: <input type="text" id="datepicker"></p>
  </body>
</html>
```

http://jsfiddle.net/muicss/ezubwon4/

## Examples

1. Fetch a file bundle and execute code after the dependencies have been met

   ```javascript
   depp.define({
     'mybundle': ['/path/to/file.js', '/path/to/file.css', '/path/to/file.png']
   });

   depp.require(['mybundle'], function() {
     /* file.js, file.css and file.png loaded successfully */
   });
   ```

1. Fetch multiple bundles

   ```javascript
   depp.define({
     'bundle1': ['/path/to/bundle1.js', '/path/to/bundle1.css', '/path/to/bundle1.png'],
     'bundle2': ['/path/to/bundle2.js', '/path/to/bundle2.css', '/path/to/bundle2.png']
   });

   depp.require(['bundle1', 'bundle2'], function() {
     /* files for bundle1 and bundle2 loaded successfully */
   });
   ```

1. Fetch bundles with nested dependencies

   ```javascript
   depp.define({
     'jquery': ['/path/to/jquery.js'],
     'bundle1': ['#jquery', '/path/to/bundle1.js', '/path/to/bundle1.css', '/path/to/bundle1.png'],
     'bundle2': ['#jquery', '/path/to/bundle2.js', '/path/to/bundle2.css', '/path/to/bundle2.png']
   });

   depp.require(['bundle1'], function() {
     /* jquery and bundle1 loaded successfully */
   });

   depp.require(['bundle2'], function() {
     /* jquery and bundle2 loaded successfully */
   });
   ```

1. Register bundle loads manually

   ```javascript
   if (window.jQuery) depp.done('jquery');
   else depp.define({'jquery': ['/path/to/jquery.js']});

   depp.require(['jquery'], function() {
     /* jquery has loaded */
   });
   ```

1. Register require callbacks before defining bundles

   ```javascript
   // register callback first
   depp.require(['bundle1', 'bundle2'], function() {
     /* jquery, bundle1 and bundle2 loaded successfully */
   });

   // define bundles later
   depp.define({
     'jquery': ['/path/to/jquery.js'],
     'bundle1': ['#jquery', '/path/to/bundle1.js', '/path/to/bundle1.css', '/path/to/bundle1.png'],
     'bundle2': ['#jquery', '/path/to/bundle2.js', '/path/to/bundle2.css', '/path/to/bundle2.png']
   });
   ```

1. Execute an error callback

   ```javascript
   depp.define({
     'bundle1': ['/path/to/bundle1.js', '/path/to/bundle1.css', '/path/to/bundle1.png'],
     'bundle2': ['/path/to/bundle2.js', '/path/to/bundle2.css', '/path/to/bundle2.png']
   });

   depp.require(
     ['bundle1', 'bundle2'],
     function() {
       /* bundle1 and bundle2 loaded successfully */
     },
     function(firstPathNotFound) {
       // log reason for failure
       console.log(firstPathNotFound + ' not found');
     }
   });
   ```

1. Implement SRI security checks

   ```javascript
   depp.define({
     'jquery': ['/path/to/jquery.js'],
     'plugin1': ['#jquery', '/path/to/jquery-plugin1.js'],
     'plugin2': ['#jquery', '/path/to/jquery-plugin2.js']
   });

   depp.config({
     before: function(path, scriptEl) {
       if (path === '/path/to/jquery.js') scriptEl.integrity = 'shaXXX-hashgoeshere';
       else if (path === '/path/to/jquery-plugin1.js') scriptEl.integrity = 'shaXXX-hashgoeshere';
       else if (path === '/path/to/jquery-plugin2.js') scriptEl.integrity = 'shaXXX-hashgoeshere';
       else return;

       scriptEl.crossOrigin = 'anonymous';
     }
   });

   depp.require(['plugin1', 'plugin2'], function() {
     /* plugin1 and plugin2 loaded successfully */
   });
   ```

## Documentation

### API

#### define() - Define file bundles

```
define(bundleDefs)

  * bundleDefs {Object} - A mapping between bundle names and file paths

Examples:

1. Define a file bundle containing JavaScript, CSS and image files:

   depp.define({
     'mybundle': ['/path/to/foo.js', '/path/to/bar.css', '/path/to/thunk.png']
   });

2. Define multiple bundles simultaneously:

   depp.define({
     'bundle1': ['/path/to/bundle1.js', '/path/to/bundle1.css', '/path/to/bundle1.png'],
     'bundle2': ['/path/to/bundle2.js', '/path/to/bundle2.css', '/path/to/bundle1.png']
   });

3. Define multiple bundles separately:

   // define first bundle
   depp.define({
     'bundle1': ['/path/to/bundle1.js', '/path/to/bundle1.css', '/path/to/bundle1.png']
   });

   // define second bundle
   depp.define({
     'bundle2': ['/path/to/bundle2.js', '/path/to/bundle2.css', '/path/to/bundle2.png']
   });

4. Define bundles with nested dependencies:

   depp.define({
     'bundle1': ['/path/to/bundle1.js', '/path/to/bundle1.css'],
     'bundle2': ['#bundle1', '/path/to/bundle2.js', '/path/to/bundle2.css']
   });

5. Force treat files as CSS stylesheets and images:

   depp.define({
     'mybundle': [
       'css!/path/to/cssfile.custom',
       'img!/path/to/image.custom'
     ]
   });

```

#### require() - Load file bundles and execute callback functions

```
require(bundleList[, successFn[, errorFn]])

  * bundleList {Array or String} - A single bundle name or an array of names
  * successFn {Function} - Callback function to execute when dependencies have been met (optional)
  * errorFn {Function} - Callback function to execute on first dependency failure (optional)

Examples:

1. Load a file bundle and execute code when the dependencies have been met:

   depp.define({'mybundle': ['/path/to/foo.js', '/path/to/bar.js']});

   depp.require(['mybundle'], function() {
     /* foo.js and bar.js loaded */
   });

2. Define bundles after registering require callback

   depp.require(['mybundle'], function() {
     /* foo.js and bar.js loaded */
   });

   depp.define({'mybundle': ['/path/to/foo.js', '/path/to/bar.js']});

3. Define an error callback:

   depp.define({
     'bundle1': ['/path/to/bundle1.js', '/path/to/bundle1.css'],
     'bundle2': ['/path/to/bundle2.js', '/path/to/bundle2.css']
   });

   depp.require(
     ['bundle1', 'bundle2'],
     function() {
       // file bundles loaded successfully
     },
     function(firstPathNotFound) {
       // log reason for failure
       console.log(firstPathNotFound + ' not found');
     }
   );

```

#### config() - Configure library

```
config(configObj)
   
  * configObj {Object}
    * before {Function} - Callback function to execute before every file load

Examples:

1. Load external JavaScript files using SRI security:

   depp.config({
     before: function(path, scriptEl) {
       /* called for each script node before being embedded */
       if (path === '/path/to/foo.js') {
         scriptEl.integrity = 'shaXXX-hashgoeshere';
         scriptEl.crossOrigin = true;
       }
     }
   });

```

#### isDefined() - Check if a bundle has already been defined

```
isDefined(bundleName)

  * bundleName {String} - The bundle name

Examples:

1. Check if a bundle has already been defined elsewhere:

   if (!depp.isDefined('mybundle')) {
     depp.define({'mybundle': ['/path/to/foo.js', '/path/to/bar.js']});
   }
   
```

#### done() - Register bundle load manually

```
done(bundleName)

* bundleName {String} - The bundle name

Examples:

1. Register bundle loads manually

   if (window.jQuery) depp.done('jquery');
   else depp.define({'jquery': ['/path/to/jquery.js']});

   depp.require(['jquery'], function() {
     /* jquery has loaded successfully */
   });

2. Register bundle loads after registering require callback

   depp.require(['jquery'], function() {
     /* jquery has loaded successfully */
   });

   if (window.jQuery) depp.done('jquery');
   else depp.define({'jquery': ['/path/to/jquery.js']});

```


#### reset() - Reset dependency trackers and bundle definitions

```
reset()

Examples:

1. Remove all dependency trackers and bundle definitions from the JohnnyDepp library:

   // define bundles
   depp.define({'mybundle': ['/path/to/foo.js', '/path/to/bar.js']});

   // remove all trackers and definitions
   depp.reset();

```

### Async Loading

To make it easy to use JohnnyDepp asynchronously, the library dispatches a 'depp-load' browser event that will notify you when the library is ready to be used:

```html
<!doctype html>
<html>
  <head>
    <script>
      // use the `depp-load` event to detect load time
      document.addEventListener('depp-load', function() {
        // now the `depp` global object is available
        depp.define({
          'jquery': [
            '//code.jquery.com/jquery-3.3.1.min.js'
          ],
          'jquery-ui': [
            '#jquery',
            '//code.jquery.com/ui/1.12.1/jquery-ui.min.js',
            '//code.jquery.com/ui/1.12.1/themes/cupertino/jquery-ui.css'
          ]
        });

        // load dependencies
        depp.require(['jquery-ui'], function() {
          $(function() {
            $("#datepicker").datepicker();
          });
        });
      });
    </script>
    <script src="//cdn.rawgit.com/muicss/johnnydepp/0.1.4/dist/depp.min.js" async></script>
  </head>
  <body>
    <p>Date: <input type="text" id="datepicker"></p>
  </body>
</html>
```

## Directory Structure

<pre>
loadjs/
├── dist
│   ├── depp.js
│   ├── depp.min.js
│   └── depp.umd.js
├── examples
├── gulpfile.js
├── LICENSE.txt
├── package.json
├── package-lock.json
├── README.md
├── src
│   └── depp.js
├── test
└── umd-templates
</pre>

## Development Quickstart

1. Install dependencies

    * [nodejs](http://nodejs.org/)
    * [npm](https://www.npmjs.org/)
    * http-server (via npm)

1. Clone repository

    ```bash
    $ git clone git@github.com:muicss/johnnydepp.git
    $ cd johnnydepp
    ```

1. Install node dependencies using npm

    ```bash
    $ npm install
    ```

1. Build examples

    ```bash
    $ npm run build-examples
    ```

    To view the examples you can use any static file server. To use the `nodejs` http-server module:

    ```bash
    $ npm install http-server
    $ npm run http-server -- -p 3000
    ```

    Then visit [http://localhost:3000/examples](http://localhost:3000/examples)

1. Build distribution files

    ```bash
    $ npm run build-dist
    ```

    The files will be located in the `dist` directory.

1. Run tests

     To run the browser tests first build the `loadjs` library:

     ```bash
     $ npm run build-tests
     ```

     Then visit [http://localhost:3000/test](http://localhost:3000/test)

1. Build all files

     ```bash
     $ npm run build-all
     ```

Icons made by [Freepik](http://www.freepik.com) from [www.flaticon.com](https://www.flaticon.com/) is licensed by [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)

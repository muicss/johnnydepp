/**
 * JohnnyDepp tests
 * @module test/tests.js
 */

var pathsLoaded = null,  // file register
    testEl = null,
    assert = chai.assert,
    expect = chai.expect;


describe('JohnnyDepp tests', function() {

  
  beforeEach(function() {
    // reset register
    pathsLoaded = {};

    // reset johnnydepp dependencies
    depp.reset();
  });


  // ========================================================================
  // File loading tests
  // ========================================================================

  describe('File loading tests', function() {

    
    function fetch(path, successFn, errorFn) {
      var bundleName = Math.random().toString(),
          defs = {};
      
      defs[bundleName] = path;
      
      // define
      depp.define(defs);
      
      // require
      depp.require(bundleName, successFn, errorFn);
    }
  

    // ========================================================================
    // JavaScript tests
    // ========================================================================
    
    describe('JavaScript tests', function() {
      
      it('downloads one file and calls success callback', function(done) {
        fetch('assets/file1.js', function() {
	  assert.equal(pathsLoaded['file1.js'], 1);
	  done();
        });
      });
      
      
      it('downloads two files and calls success callback', function(done) {
        fetch(['assets/file1.js', 'assets/file2.js'], function() {
	  assert.equal(pathsLoaded['file1.js'], 1);
	  assert.equal(pathsLoaded['file2.js'], 1);
	  done();
        });
      });
      
      
      it('calls error callback on invalid path', function(done) {
        var path = 'assets/file-doesntexist.js';

        fetch(path, 0, function(errorPath) {
          assert.equal(errorPath, path);
          done();
        });
      });
      
      
      it('calls error callback on one invalid path', function(done) {
        var paths = ['assets/file1.js', 'assets/file-doesntexist.js'];
        
        fetch(paths, null, function(errorPath) {
          assert.equal(errorPath, paths[1]);
          done();
        });
      });
      
      
      it('uses async false by default', function(done) {
        this.timeout(5000);
        
        var numCompleted = 0,
            numTests = 20,
            paths = ['assets/asyncfalse1.js', 'assets/asyncfalse2.js'];
        
        // run tests sequentially
        var testFn = function(paths) {
          // add cache busters
          var pathsUncached = paths.slice(0);
          pathsUncached[0] += '?_=' + Math.random();
          pathsUncached[1] += '?_=' + Math.random();
          
          // require
          fetch(pathsUncached, function() {
            var f1 = paths[0].replace('assets/', '');
            var f2 = paths[1].replace('assets/', '');
            
            // check load order
            assert.isTrue(pathsLoaded[f1]);
            assert.isFalse(pathsLoaded[f2]);
            
            // increment tests
            numCompleted += 1;
            
            if (numCompleted === numTests) {
              // exit
              done();
            } else {
              // reset register
              pathsLoaded = {};
              
              // run test again
              paths.reverse();
              testFn(paths);
            }
          });
        };
        
        // run tests
        testFn(paths);
      });

      
      it('supports forced "module!" files', function(done) {
        fetch('module!assets/module.js', function() {
	  assert.equal(pathsLoaded['module.js'], 1);

          // verify type attribute
          let el = document.querySelector('script[src="assets/module.js"]');
          assert.equal(el.type, "module");

	  done();
        });
      });
    });

    
    // ========================================================================
    // CSS file loading tests
    // ========================================================================

    describe('CSS tests', function() {
      var testEl;
      
      
      before(function() {
        // add test div to body for css tests
        testEl = document.createElement('div');
        testEl.className = 'test-div mui-container';
        testEl.style.display = 'inline-block';
        document.body.appendChild(testEl);
      });
      
      
      afterEach(function() {
        var els = document.getElementsByTagName('link'),
            i = els.length,
            el;
        
        // iteratete through stylesheets
        while (i--) {
          el = els[i];
          
	  // remove test stylesheets
	  if (el.href.indexOf('mocha.css') === -1) {
            el.parentNode.removeChild(el);
          }
        }
      });
      
      
      it('downloads one file and calls success callback', function(done) {
        fetch('assets/file1.css', function() {
          assert.equal(testEl.offsetWidth, 100);
          done();
        });
      });
      
      
      it('downloads two files and calls success callback', function(done) {
        fetch(['assets/file1.css', 'assets/file2.css'], function() {
          assert.equal(testEl.offsetWidth, 200);
          done();
        });
      });
      
      
      it('calls error callback on invalid path', function(done) {
        var paths = ['assets/file1.css', 'assets/file-doesntexist.css'];

        fetch(paths, null, function(errorPath) {
          assert.equal(errorPath, paths[1]);
          done();
        });
      });
      
      
      it('supports mix of css and js', function(done) {
        var paths = ['assets/file1.css', 'assets/file1.js'];

        fetch(paths, function() {
          assert.equal(pathsLoaded['file1.js'], 1);
          assert.equal(testEl.offsetWidth, 100);
          done();
        });
      });
      
      
      it('supports forced "css!" files', function(done) {
        fetch('css!assets/file1.css', function() {
          // loop through files
          var els = document.getElementsByTagName('link'),
              i = els.length,
              el;
          
          while (i--) {
            if (els[i].href.indexOf('file1.css') !== -1) done();
          }
        });
      });
      
      
      it('loads external css files', function(done) {
        this.timeout(0);

        var pathname = '//cdn.muicss.com/mui-0.6.8/css/mui.min.css';

        fetch(pathname, function() {
          var styleObj = getComputedStyle(testEl);
          
          assert.equal(styleObj.getPropertyValue('padding-left'), '15px');
          done();
        });
      });
      
      
      it('calls error on missing external file', function(done) {
        this.timeout(0);

        var pathname = '//cdn.muicss.com/mui-0.6.8/css/mui-dntexist.min.css';
        
        fetch(pathname, null, function(errorPath) {
          var styleObj = getComputedStyle(testEl);
          
          assert.equal(styleObj.getPropertyValue('padding-left'), '0px');
          assert.equal(errorPath, pathname);
          done();
        });
      });
      
      
      // teardown
      return after(function() {
        // remove test div
        testEl.parentNode.removeChild(testEl);
      });
    });

    
    // ========================================================================
    // Image file loading tests
    // ========================================================================
    
    describe('Image tests', function() {

      
      function assertLoaded(src) {
        // loop through images
        var imgs = document.getElementsByTagName('img');

        Array.prototype.slice.call(imgs).forEach(function(img) {
	  // verify image was loaded
	  if (img.src === src) assert.equal(img.naturalWidth > 0, true);
        });
      }
      
      
      function assertNotLoaded(src) {
        // loop through images
        var imgs = document.getElementsByTagName('img');

        Array.prototype.slice.call(imgs).forEach(function(img) {
	  // fail if image was loaded
          if (img.src === src) assert.equal(img.naturalWidth, 0);
        });
      }
      
      
      it('loads one file', function(done) {
        fetch('assets/flash.png', function() {
          assertLoaded('assets/flash.png');
          done();
        });
      });
      
      
      it('loads multiple files', function(done) {
        fetch(['assets/flash.png', 'assets/flash.jpg'], function() {
          assertLoaded('assets/flash.png');
          assertLoaded('assets/flash.jpg');
          done();
        });
      });
      
      
      it('supports forced "img!" files', function(done) {
        var src = 'assets/flash.png?' + Math.random();
        
        fetch('img!' + src, function() {
          assertLoaded(src);
          done();
        });
      });
      
      
      it('calls error callback on one invalid path', function(done) {
        var src1 = 'assets/flash.png?' + Math.random(),
            src2 = 'assets/flash-doesntexist.png?' + Math.random(),
            paths = ['img!' + src1, 'img!' + src2];
        
        fetch(paths, null, function(errorPath) {
          assert.equal(errorPath, paths[1]);
          assertNotLoaded(src2);
          done();
        });
      });

      
      it('supports mix of img and js', function(done) {
        var src = 'assets/flash.png?' + Math.random(),
            paths = ['img!' + src, 'assets/file1.js'];
        
        fetch(paths, function() {
          assert.equal(pathsLoaded['file1.js'], true);
          assertLoaded(src);
          done();
        });
      });
      
      
      it('loads external img files', function(done) {
        this.timeout(0);
        
        var src = 'https://www.muicss.com/static/images/mui-logo.png?';
        src += Math.random();
        
        fetch('img!' + src, function() {
          assertLoaded(src);
          done();
        });
      });
      
      
      it('calls error on missing external file', function(done) {
        this.timeout(0);
        
        var src = 'https://www.muicss.com/static/images/';
        src += 'mui-logo-doesntexist.png?' + Math.random();
        
        fetch('img!' + src, null, function(pathsNotFound) {
          assertNotLoaded(src);
          done();
        });
      });
    });
    
  });

  
  // ==========================================================================
  // API tests
  // ==========================================================================
  
  describe('API tests', function() {

    
    // ========================================================================
    // define() method
    // ========================================================================

    describe('define() method tests', function() {

      
      it('accepts single bundle definition', function() {
        // define
        depp.define({'mybundle': ['/file.js']});
        
        // check
        assert.equal(depp.isDefined('mybundle'), true);
      });
      
      
      it('accepts multiple bundle definitions simultaneously', function() {
        // define
        depp.define({
          'bundle1': ['/file.js'],
          'bundle2': ['/file.js']
        });
        
        // check
        assert.equal(depp.isDefined('bundle1'), true);
        assert.equal(depp.isDefined('bundle2'), true);
      });
      
      
      it('accepts multple bundles definitions separately', function() {
        // define
        depp.define({'bundle1': ['/file.js']});
        depp.define({'bundle2': ['/file.js']});

        // check
        assert.equal(depp.isDefined('bundle1'), true);
        assert.equal(depp.isDefined('bundle2'), true);
      });
      
      
      it('raises error if bundle is already defined', function() {
        // define bundle
        depp.define({'mybundle': ['/file.js']});
        
        // define again
        var fn = function() {
          depp.define({'mybundle': ['/file.js']});
        };
        
        expect(fn).to.throw("Depp Error: Bundle already defined");
      });
      
      
      it('accepts nested bundle definitions', function() {
        // define
        depp.define({
          'bundle1': ['/file.js'],
          'bundle2': ['#bundle1', '/file.js']
        });
        
        // check
        assert.equal(depp.isDefined('bundle1'), true);
        assert.equal(depp.isDefined('bundle2'), true);
      });
            
    });

    
    // ========================================================================
    // require() method
    // ========================================================================

    describe('require() method tests', function() {

      
      it('accepts single dependency as argument', function(done) {
        // define
        depp.define({'file1': ['assets/file1.js']});

        // fetch
        depp.require('file1', function() {
          assert.equal(pathsLoaded['file1.js'], 1);
          done();
        });
      });
      

      it('allows bundle definition after require', function(done) {
        // require
        depp.require('file1xx', function() {
          assert.equal(pathsLoaded['file1.js'], 1);
          done();
        });

        // define
        depp.define({'file1xx': ['assets/file1.js']});
      });

      
      it('raises error on L1 circular references', function() {
        // define
        depp.define({'mybundle': ['#mybundle']});

        // require
        var fn = function() {
          depp.require('mybundle');
        };
        
        // check
        expect(fn).to.throw('Depp Error: Circular reference');
      });
      
      
      it('raises error on L2 circular references', function() {
        // define
        depp.define({
          'bundle1': ['#bundle2', '/file.js'],
          'bundle2': ['#bundle1', '/file.js']
        });

        // require
        var fn = function() {
          depp.require('bundle1');
        };
        
        // check
        expect(fn).to.throw('Depp Error: Circular reference');
      });


      it('raises error on L2 circular reference after require', function(){
        // define 1
        depp.define({'bundle2': ['#bundle1', '/file.js']});

        // require
        depp.require('bundle2');

        // define 2
        var fn = function() {
          depp.define({'bundle1': ['#bundle2', '/file.js']});
        };

        // check
        expect(fn).to.throw('Depp Error: Circular reference');
      });
      
      
      it('multiple calls only loads files once', function(done) {
        var nCalls = 0;
        
        var fn = function() {
          // check number of times file was loaded
          assert.equal(pathsLoaded['file1.js'], 1);

          // increment callback counter
          nCalls += 1;
          if (nCalls == 2) done();
        }
        
        depp.define({'file1': ['assets/file1.js']});

        depp.require('file1', fn);
        depp.require('file1', fn);
      });


      it('executes callbacks in known order: 1', function(done) {
        var n = 0;

        depp.define({'file1': ['assets/file1.js']});
        
        // first
        depp.require('file1', function() {
          assert.equal(n, 0);
          n += 1;
        });

        // second
        depp.require('file1', function() {
          assert.equal(n, 1);
          done();
        });
      });


      it('executes callbacks in known order: 2', function(done) {
        var n = 0;

        depp.define({
          'file1': ['assets/file1.js'],
          'file2': ['assets/file2.js']
        });
        
        // first
        depp.require(['file1', 'file2'], function() {
          assert.equal(n, 0);
          n += 1;
        });

        // second
        depp.require('file2', function() {
          assert.equal(n, 1);
          done();
        });
      });


      it('executes callbacks in known order: 3', function(done) {
        var n = 0;

        depp.define({
          'file1': ['assets/file1.js'],
          'file2': ['assets/file2.js']
        });
        
        // second
        depp.require(['file1', 'file2'], function() {
          assert.equal(n, 1);
          done();
        });

        // first
        depp.require('file1', function() {
          assert.equal(n, 0);
          n += 1;
        });
      });

    });

    
    // ========================================================================
    // config() method
    // ========================================================================

    describe('config() method tests', function() {

      it('accepts before callbacks', function(done) {
        var executedCallback = false;
        
        // add callback
        depp.config({
          before: function() {executedCallback = true;}
        });
        
        // define
        depp.define({'mybundle': ['assets/file1.js']});

        // require
        depp.require('mybundle', function() {
          assert.equal(executedCallback, true);
          done();
        });
      });


      it('passes path and script element to before callback', function(done) {
        var executedCallback = false;
        
        // add callback
        depp.config({
          before: function(path, scriptEl) {
            assert.equal(path, 'assets/file1.js');
            assert.equal(scriptEl.tagName, 'SCRIPT');
            executedCallback = true;
          }
        });
        
        // define
        depp.define({'mybundle': ['assets/file1.js']});

        // require
        depp.require('mybundle', function() {
          assert.equal(executedCallback, true);
          done();
        });
      });
      
    });


    // ========================================================================
    // isDefined() method
    // ========================================================================

    describe('isDefined() method tests', function() {

      it('returns false if a bundle has not been defined', function() {
        // check
        assert.equal(depp.isDefined('mybundle'), false);
      });

      
      it('returns true if a bundle has already been defined', function() {
        // define
        depp.define({'mybundle': ['/file.js']});
        
        // check
        assert.equal(depp.isDefined('mybundle'), true);
      });
      
    });

    
    // ========================================================================
    // done() method
    // ========================================================================

    describe('done() method tests', function() {

      it('should execute callbacks created before .done()', function(done) {
        depp.require(['mybundle'], function() {
          assert.equal(depp.isDefined('mybundle'), true);
          done();
        });

        depp.done('mybundle');
      });


      it('should execute callbacks created after .done()', function(done) {
        depp.done('mybundle');

        depp.require(['mybundle'], function() {
          assert.equal(depp.isDefined('mybundle'), true);
          done();
        });        
      });

      
      it('should handle .done() on pre-defined bundles', function(done) {
        // define bundle
        depp.define({
          'mybundle': ['assets/file1.js']
        });

        // call .done() on bundle
        depp.done('mybundle');

        // check that files were not loaded
        depp.require(['mybundle'], function() {
          assert.equal(pathsLoaded['file1.js'], undefined);
          done();
        });        
      });

      
      it('handles .done() on bundles defined after require', function(done) {
        // define 1
        depp.define({'bundle2': ['#bundle1', 'assets/file2.js']});

        // require
        depp.require(['bundle2'], function() {
          assert.equal(pathsLoaded['file2.js'], 1);
          done();
        });

        // define 2
        depp.done('bundle1');
      });
    });
    
    
    // ========================================================================
    // reset() method
    // ========================================================================

    describe('reset() method tests', function() {

      it('removes dependency trackers when reset() is called', function() {
        // define
        depp.define({'mybundle': ['/file.js']});

        // check
        assert.equal(depp.isDefined('mybundle'), true);
        
        // reset
        depp.reset();
        
        // check
        assert.equal(depp.isDefined('mybundle'), false);
      });
      
    });

    
    // ========================================================================
    // Bundle loading tests
    // ========================================================================
    
    describe('Bundle loading tests', function() {

      it('handles L1 nested bundles', function(done) {
        // define
        depp.define({
          'bundle1': ['assets/file1.js'],
          'bundle2': ['#bundle1', 'assets/file2.js']
        });
        
        // require
        depp.require(['bundle2'], function() {
          assert.equal(pathsLoaded['file1.js'], 1);
          assert.equal(pathsLoaded['file2.js'], 1);
          done();
        });
      });
      

      it('handles L2 nested bundles', function(done) {
        // define
        depp.define({
          'bundle1': ['assets/file1.js'],
          'bundle2': ['#bundle1', 'assets/file2.js'],
          'bundle3': ['#bundle2', 'assets/file3.js']
        });
        
        // require
        depp.require(['bundle3'], function() {
          assert.equal(pathsLoaded['file1.js'], 1);
          assert.equal(pathsLoaded['file2.js'], 1);
          assert.equal(pathsLoaded['file3.js'], 1);
          done();
        });
      });


      it('handles nested bundles defined after require', function(done) {
        // define 1
        depp.define({'bundle2': ['#bundle1', 'assets/file2.js']});

        // require
        depp.require(['bundle2'], function() {
          assert.equal(pathsLoaded['file2.js'], 1);
          done();
        });

        // define 2
        depp.define({'bundle1': ['assets/file1.js']});
      });
      
      
      it('handles multiple nested bundles', function(done) {
        // define
        depp.define({
          'bundle1': ['assets/file1.js'],
          'bundle2': ['#bundle1', 'assets/file2.js'],
          'bundle3': ['assets/file3.js']
        });
        
        // require
        depp.require(['bundle2', 'bundle3'], function() {
          assert.equal(pathsLoaded['file1.js'], 1);
          assert.equal(pathsLoaded['file2.js'], 1);
          assert.equal(pathsLoaded['file3.js'], 1);
          done();
        });
      });
      

      it('handles overlapping bundles', function(done) {
        // define
        depp.define({
          'bundle1': ['assets/file1.js'],
          'bundle2': ['#bundle1', 'assets/file2.js'],
          'bundle3': ['#bundle1', 'assets/file3.js']
        });
        
        // require
        depp.require(['bundle2', 'bundle3'], function() {
          assert.equal(pathsLoaded['file1.js'], 1);
          assert.equal(pathsLoaded['file2.js'], 1);
          assert.equal(pathsLoaded['file3.js'], 1);
          done();
        });
      });
      
    });
    
  });
  
});

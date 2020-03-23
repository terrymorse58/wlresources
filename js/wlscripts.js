
// handle loading of scripts for waitlist client

let WLScripts = (function () {

  // change this to force a version change for scripts in 'additionalSrcs'
  let vers=63;

  let productionSrcs = [
    "https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js",
    "https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js",
    "https://cdn.jsdelivr.net/npm/vue@2.5.16/dist/vue.min.js"
  ];
  let localSrcs = [
    "https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js",
    "https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js",
    "https://cdn.jsdelivr.net/npm/vue@2.5.16/dist/vue.min.js"
  ];

  /**
   * load production or local scripts, with option to include additional scripts
   * @param {string []} [additionalSrcs]
   * @param {function} [next] - will be called after all scripts have loaded
   */
  function loadScripts(additionalSrcs, next) {
    //console.log('loadScripts()');
    let hostName = window.location.hostname;
    let isProduction = (hostName.indexOf('localhost') === -1);
    let scriptSrcs = (isProduction) ? productionSrcs : localSrcs;
    let scriptsLoaded = 0;

    // callback when a specific script has loaded
    function scriptHasLoaded() {
      let script = this;
      scriptsLoaded++;
      //console.log('loadScripts scriptHasLoaded - src="'+script.src+'", scriptsLoaded = '+scriptsLoaded);
      if (scriptsLoaded === scriptSrcs.length) {
        //console.log('scriptHasLoaded - all loaded, moving on')
        if (next) { next(); }
      }
    }

    // append srcs passed in (if any), with versioning
    if (additionalSrcs) {
      additionalSrcs.forEach( function (src, index, srcs) {
        srcs[index] += '?vers' + '=' + vers;
      });
      scriptSrcs = scriptSrcs.concat(additionalSrcs);
    }

    // load scripts sequentially
    scriptSrcs.forEach( function (src) {
      let script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = scriptHasLoaded;
      document.body.appendChild(script);
    });
  }

  return {
    loadScripts: loadScripts
  }

})();
if (0===1) {WLScripts.loadScripts();}

// REST services client

// send request with data to a service that replies with the following JSON:
//	resultData = {
//		error:		an error code,
//		message:	an error message,
//		data:		application specific data
//	}

/**
 *
 * @type {{get, head, post, put, del, patch}}
 */
const RestClient = (function () {
  'use strict';

  function get( url, success, error, basicAuth, timeout ) {
    makeHttpRequest('GET', null, url, success, error, basicAuth, timeout);
  }
  function head( url, data, success, error, basicAuth, timeout ) {
    makeHttpRequest('HEAD', data, url, success, error, basicAuth, timeout);
  }
  function post( url, data, success, error, basicAuth, timeout ) {
    makeHttpRequest('POST', data, url, success, error, basicAuth, timeout);
  }
  function put( url, data, success, error, basicAuth, timeout ) {
    makeHttpRequest('PUT', data, url, success, error, basicAuth, timeout);
  }
  function del( url, success, error, basicAuth, timeout ) {
    makeHttpRequest('DELETE', null, url, success, error, basicAuth, timeout);
  }
  function patch( url, data, success, error, basicAuth, timeout ) {
    makeHttpRequest('PATCH', data, url, success, error, basicAuth, timeout);
  }

  /**
   * GET request that returns a promise
   * @param url
   * @param [basicAuth]
   * @param [timeout]
   * @return {Promise<*>}
   */
  function getPromise( url, basicAuth, timeout) {
    console.log('restclient.js getPromise url:',url);
    return new Promise( function (resolve, reject) {
      get(url, function(resultSuccess) {
        // console.log('restclient.js getPromise.get success, resultSuccess:',resultSuccess);
        resolve(resultSuccess);
      }, function(resultErr) {
        console.log('restclient.js getPromise.get error, resultErr:',resultErr);
        resolve(resultErr);
      }, basicAuth, timeout);
    })
  }

  /**
   * POST request that returns a promise
   * @param url
   * @param data
   * @param [basicAuth]
   * @param [timeout]
   * @return {Promise<*>}
   */
  function postPromise( url, data, basicAuth, timeout) {
    console.log('restclient.js postPromise url:',url);
    return new Promise( function (resolve, reject) {
      post(url, data, resultSuccess => {
        // console.log('restclient.js getPromise.get success, resultSuccess:',resultSuccess);
        resolve(resultSuccess);
      }, err => {
        console.log('restclient.js postPromise.post err:', err);
        reject(err);
      }, basicAuth, timeout);
    })
  }

  /**
   *
   * @param {string} method - 'GET','HEAD','POST','PUT','DELETE','PATCH'
   * @param {object} data
   * @param {string} url
   * @param {function} successCallback
   * @param {function} errorCallback
   * @param {string} [basicAuth] - "username:password"
   * @param {number} [timeout] - timeout in milliseconds
   */
  function makeHttpRequest( method, data, url, successCallback, errorCallback, basicAuth, timeout ) {
    "use strict";
    var timeStart = Date.now();
    console.log('makeHttpRequest( method='+method+', url=' + url + ', basicAuth='+basicAuth+' )');
    var dataJSON = JSON.stringify(data);
    let origin = window.location.protocol + '//' + window.location.hostname;

    // construct an http request
    var xmlhttp = new XMLHttpRequest();
    var useAsync = true;
    xmlhttp.open(method, url, useAsync);
    xmlhttp.withCredentials = true; // needed for setting cookies in client
    xmlhttp.setRequestHeader('Content-Type', 'application/json');
    xmlhttp.setRequestHeader('Access-Control-Allow-Credentials', 'true');
    // set "authorization: Basic" if requested
    if (basicAuth && basicAuth.length) {
      xmlhttp.setRequestHeader('Authorization', 'Basic ' + btoa(basicAuth) );
    }
    xmlhttp.timeout = timeout || 5000; // 5 seconds default timeout

    // console.log('makeHttpRequest before send, xmlhttp:'); console.log(xmlhttp);

    // handler for timeout
    xmlhttp.ontimeout = function (e) {
      //console.log('makeHttpRequest timeout, e:',e);
      //console.log('makeHttpRequest timeout, xmlhttp:',xmlhttp);
    };

    // handler for error
    xmlhttp.onerror = function (e) {
      // console.log('makeHttpRequest error, e:',e);
      // console.log('makeHttpRequest error, xmlhttp:',xmlhttp);
    };

    // set up the onreadystatechange handler
    xmlhttp.onreadystatechange = function (e) {
      //console.log('makeHttpRequest() onreadystatechange, readyState = ' + xmlhttp.readyState +', status = ' + xmlhttp.status + ', xmlhttp:',xmlhttp);
      //console.log('onreadystatechange event: ',e);

      // ignore any readyStates that are not 4
      if (xmlhttp.readyState !== 4 ) { return; }

      if ( xmlhttp.status === 200 ) {

        if( isJsonString(xmlhttp.responseText) ) {
          var resultData = JSON.parse(xmlhttp.responseText);
          var timeElapsed = (Date.now() - timeStart) / 1000;
          //console.log('makeHttpRequest( method='+method+', url=' + url + ' ) completed, elapsed time = '+timeElapsed+' seconds');
          resultData.responseHeaders = xmlhttp.getAllResponseHeaders();
          if( !resultData.error ) {
            // call success callback if it exists
            if( successCallback ) { successCallback( resultData ); }
          }
          else {
            // call error callback if it exists
            if( errorCallback ) { errorCallback( resultData ); }
          }
        }

        else {
          // invalid JSON
          //console.log('makeHttpRequest() responded with invalid JSON, xmlhttp.responseText:',xmlhttp.responseText);
          var errorResponse = {
            error:	-100,
            message: 'invalid JSON, can\'t parse'
          };
          if( errorCallback ) { errorCallback( errorResponse ); }
        }
      }

      else if (xmlhttp.status === 204) {
        // valid request, no data to report
        if (successCallback) { successCallback( {error:null, message:"", data:null} ); }
      }

      else if (xmlhttp.status === 0) {
        //status 0 probaby means "can't connect to server"
        if (errorCallback) {
          errorCallback( {
            error: 599,  // 599: Network connect timeout error
            message: "Unable to connect to server"
          });
        }
      }

      else
      {
        //status !== 0 or 200 or 204, report error
        //console.log('makeHttpRequest() ERROR status = ['+xmlhttp.status+'], xmlhttp:'); console.log(xmlhttp);
        if ( errorCallback ) {
          var errorData = {
            error: xmlhttp.status,
            message: xmlhttp.statusText
          };
          // use error and message from response, if they exist
          if (isJsonString(xmlhttp.responseText)) {
            var response = JSON.parse(xmlhttp.responseText);
            errorData.error = response.error || xmlhttp.status;
            errorData.message = response.message || xmlhttp.statusText;
          }
          if (!errorData.message || errorData.message.length === 0) {
            errorData.message = 'an unknown error occurred';
          }
          errorCallback( errorData );
        }
      }
    };

    // send the collected data as JSON
    try {
      xmlhttp.send(dataJSON);
    }
    catch (e) {
      //console.log('makeHttpRequest.send caught ERROR e:',e);
    }
  }

  /**
   * @function isJsonString - determines if a string is valid json
   * @param {string} str - string to test
   * @returns {boolean} true if str is valid json
   */
  function isJsonString(str) {
    "use strict";
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  return {
    get,
    getPromise,
    head,
    post,
    postPromise,
    put,
    del,
    patch
  }

})();

// keep jslint happy
if (1===0) { RestClient.get('', {}, null, null);}

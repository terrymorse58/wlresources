// common code for waitlist clients

/* global RestClient, LocalDB, WLDefaults */

/**
 * return response from a function
 * @typedef {Object} ErrAndMsg
 * @property {number|null} error
 * @property {string} message
 */

const WlClient = (function () {

  let ssEvent = null;  // server sent events

  /**
   * check if server is alive
   * @param {function} onSuccess
   * @param {function} onError
   * @param {string} [serverUrl]
   */
  function serverAlive(onSuccess, onError, serverUrl) {
    console.log('WlClient.serverAlive()');
    let svUrl = serverUrl || WlDefaults.serverUrlDefault;
    RestClient.get(svUrl+'/status', function(success) {
      onSuccess(success);
    }, function(err) {
      onError(err);
    });
  }

  /**
   * check if server is alive with a Promise that resolves to true|false
   * @param {string} [serverUrl]
   * @return {Promise<boolean>}
   */
  function serverAlivePromise(serverUrl) {
    return new Promise((resolve, reject) => {
      serverAlive(success => {
        resolve(true);
      }, err => {
        resolve(false);
      }, serverUrl);
    })
  }

  /**
   * get current authorization status for this client - return promise
   * @param {string} [serverUrl]
   * @return {Promise <*>}
   */
  function getAuth( serverUrl ) {
    console.log('WlClient.getAuth()');
    let svUrl = serverUrl || WlDefaults.serverUrlDefault;
    return RestClient.getPromise(svUrl + '/auth')
      .then(gpResult => {
        return gpResult;
      });
  }

  /**
   * login
   * @param {string} username
   * @param {string} password
   * @param {function} success
   * @param {function} error
   * @param {string} [serverUrl]
   */
  function login(username, password, success, error,
                 serverUrl) {
    console.log('WlClient.login("' +username+ '","' +password+ '")');
    let svUrl = serverUrl || WlDefaults.serverUrlDefault;
    RestClient.post( svUrl+'/login', null,
      function (result) {
        if (success) { success(result); }
      },
      function (result) {
        console.error('wlclient.js login > RestClient.post ERROR, result:',result);
        if (error) { error(result); }
      },
      username+':'+password
    );
  }

  /**
   * logout
   * @param {function} success
   * @param {function} error
   * @param {string} [serverUrl]
   */
  function logout(success, error, serverUrl) {
    console.log('WlClient.logout()');
    let svUrl = serverUrl || WlDefaults.serverUrlDefault;
    RestClient.del(  svUrl+'/logout', function (result) {
        if (success) { success(result); }
      }, function (err) {
        console.error('wlclient.js logout > RestClient.del ERROR:',err);
        if (error) { error(err); }
      }
    );
  }

  /**
   * logout with a promise
   * @param {string} [serverUrl]
   * @return {Promise<*>}
   */
  function logoutPromise(serverUrl) {
    return new Promise( (resolve, reject) => {
      logout((result) => {
        resolve(result);
      }, (err) => {
        reject(err);
      }, serverUrl);
    });
  }

  /**
   * get restaurant using promise
   * @param {number} queueId
   * @param {string} [serverUrl]
   * @return {Promise<object | {error,message}>}
   */
  function getRestaurant(queueId, serverUrl) {
    console.log('WlClient.getRestaurant()');
    let svUrl = serverUrl || WlDefaults.serverUrlDefault;

    // first try to get restaurant from localDB
    return LocalDB.getRestPromise(queueId)

      // get restaurant from remote server
      .then(restLocal => {
        return RestClient.getPromise(svUrl + '/restaurant/' + queueId)
          .then(restServer => {
            return {restLocal, restServer};
          });
      })

      // store server restaurant locally
      .then( ({restLocal, restServer}) => {
        if (!restServer.error) {
          LocalDB.putRestPromise(restServer, false).then( () => {});
        }
        return {restLocal, restServer}
      })

      // return restaurant or {error,message}
      .then( ({restLocal, restServer}) => {
        return (!restServer.error) ? restServer : restLocal;
      });
  }

  /**
   * get restaurant from server using promise
   * @param {number} queueId
   * @param {string} serverUrl
   * @return {Promise<object|{error,message}>}
   */
  function getRestaurantFromServer(queueId, serverUrl) {
    let svUrl = serverUrl || WlDefaults.serverUrlDefault;
    return RestClient.getPromise(svUrl+'/restaurant/'+queueId)
      .then( result => {
        return result;
      });
  }


  /**
   * create a new blank entry object
   * @param {number} queueId
   * @param {string} [language]
   * @return {object} entry
   */
  function newEntry(queueId, language) {
    return {
      id: null,
      entry_queue_id: queueId,
      entry_name: '',
      entry_seats: null,
      entry_phone: '',
      entry_notes: '',
      entry_language: (language || WlDefaults.LANGUAGE_DEFAULT),
      entry_notify_sms: true,
      entry_status: 'ACTIVE',
      entry_messages: [],
      entry_message_status: '',
      entry_init_position: null,
      entry_completion_time: null,
      entry_client_listening: false,
      createdAt: null,
      updatedAt: null
    };
  }

  /**
   * update existing entry
   * @param {object} entry
   * @param {boolean} setLocal - store entry locally if true
   * @param {function} callback
   * @param {string} [serverUrl]
   */
  function updateEntry(entry, setLocal, callback,
                       serverUrl) {
    console.log('WlClient.updateEntry(entry.id='+entry.id+')');
    let svUrl = serverUrl || WlDefaults.serverUrlDefault;
    RestClient.put( svUrl+'/entry/' + entry.id, entry, 
      function(serverEntry) {
      if (!setLocal) { callback( serverEntry ); }
      // save entry to local store
      LocalDB.putEntryPromise( serverEntry, false ).then( () => {
        callback(serverEntry);
      });
    }, function (errResult) {
      console.error('WlClient.updateEntry RestClient.put ERROR, result:', errResult);
      if (!setLocal) { callback(errResult); }
      // even though save to server error, still save entry to local store
      LocalDB.putEntryPromise( entry, false ).then( () => {
        callback(errResult);
      });
    });
  }

  //
  /**
   * create new entry and store in database and local store
   * @param {object} entry
   * @param {boolean} storeLocal - store locally if true
   * @param {function} callback
   * @param {string} [serverUrl]
   */
  function createEntry(  entry, storeLocal, callback,
                         serverUrl ) {
    console.log('WlClient.createEntry()');
    let svUrl = serverUrl || WlDefaults.serverUrlDefault;

    // entry is new: create new record
    RestClient.post( svUrl+'/entry', entry, 
      function (serverEntry) {
      if (!storeLocal) {
        return callback( serverEntry );
      }
      // save server entry to local store
      LocalDB.putEntryPromise( serverEntry, false ).then( () => {
        callback( serverEntry );
      });
    },function (error) {
      console.error('WlClient.createEntry > RestClient.post ERROR:',error,
        ', storeLocal:',storeLocal);
      if (!storeLocal) {
        return callback(error);
      }
      // even though save to server error, still save entry to local store
      LocalDB.putEntryPromise( entry, false ).then( () => {
        callback( error );
      });
    });
  }

  /**
   * find matching entry on the server
   * @param {Object} entry
   * @param {function} callback - parameter is found entry or {error, message}
   * @param {string} [serverUrl]
   */
  function findEntryOnServer( entry, callback, serverUrl ) {
    console.log('WlClient.findEntryOnServer() entry:',entry);
    let svUrl = serverUrl || WlDefaults.serverUrlDefault;

    let entryTry = {
      entry_queue_id: entry.entry_queue_id,
      entry_name: entry.entry_name,
      entry_seats: entry.entry_seats,
      entry_phone: entry.entry_phone,
      entry_status: entry.entry_status
    };
    RestClient.post(svUrl+'/entrymatch', entryTry, function (entryFound) {
      callback(entryFound);
    }, function (entryError) {
      console.error('WlClient.findEntryOnServer RestClient.post ERROR,' +
        ' entryError',entryError);
      callback(entryError);
    });
  }

  /**
   * create or update entry in database
   * @param {Object} entry
   * @param {boolean} saveLocal
   * @param {function: {object}|{error,message}} callback
   */
  function saveEntry( entry, saveLocal,
                      callback ) {
    console.log('WlClient.saveEntry(), entry.id:',entry.id);

    if (!entry.id || entry.id < 1) {
      createEntry( entry, saveLocal, callback );
    } else {
      // existing entry: update
      updateEntry( entry, true, function (entry) {
          return callback(entry);
        }
      );
    }
  }

  /**
   * get a single entry
   * @param {number} entryId
   * @param {function} success
   * @param {function} onError
   * @param {string} [serverUrl]
   */
  function readEntry( entryId, success, onError, serverUrl ) {
    console.log('WlClient.readEntry(id=' +entryId+ ')');
    let svUrl = serverUrl || WlDefaults.serverUrlDefault;

    if (!entryId) {
      return success(null);
    }

    RestClient.get( svUrl+'/entry/'+entryId, function (serverEntry) {
      // save server entry to local store
      LocalDB.putEntryPromise( serverEntry, false ).then(() => {
        success(serverEntry);
      });
    }, function(error) {  // RestClient.get ERROR
      console.error('WlClient.readEntry > RestClient.get ERROR:',error);
      // server get error, so try to get entry from local store
      LocalDB.getEntryPromise( entryId ).then((localEntry) => {
        if (!localEntry || localEntry.error) {
          onError(localEntry);
        } else {
          success(localEntry);
        }
      });
    });
  }

  /**
   * read entry with a promise
   * @param {number} entryId
   * @param {string} [serverUrl]
   * @return {Promise<*>}
   */
  function readEntryPromise(entryId, serverUrl) {
    return new Promise( (resolve, reject) => {
      readEntry(entryId,(result) => {
        resolve(result);
      }, (err) => {
        reject(err);
      }, serverUrl);
    });
  }


  /**
   * validate entry_phone property of entry
   * @param {Object} entry
   * @param {function} success
   * @param {function} error
   * @param {string} [serverUrl]
   * @return {*}
   */
  function validateEntryPhone( entry, success, error, serverUrl ) {
    console.log('WlClient.validateEntryPhone() phone = ['+entry.entry_phone+']');
    let svUrl = serverUrl || WlDefaults.serverUrlDefault;
    let phone = entry.entry_phone;

    // skip test if phone is 'sim' (phone simulator)
    if (phone === 'sim') {
      return success(entry,{error:null,message:''});
    }

    // skip test if phone starts with a '+' (assume it's good)
    if ( phone && phone.indexOf('+') === 0 ) {
      return success(entry,{error:null,message:''});
    }

    // skip test if phone does not exist
    if (!phone || !phone.length) {
      return success(entry,{error:null,message:''});
    }

    // call service to get phone lookup info
    RestClient.get( svUrl+'/phone/'+phone, function (result) {
      if (result.phone_number) {
        entry.entry_phone = result.phone_number;
        return success(entry,{error:null,message:''});
      } else {
        return error(entry, result);
      }
    }, function (errResult) {
      console.error('validateEntryPhone RestClient.get("/phone") ERROR,' +
        ' errResult:', errResult);
      return error(entry, errResult);
    });
  }

  /**
   * append newMessage to entry's messages
   * @param {object} entry
   * @param {string} newMessage
   * @param {boolean} sendSMS
   * @param {string} userType - 'restaurant' or 'customer'
   * @param {object} entry - modified entry
   */
  function addMessageToEntry(entry, newMessage,
          sendSMS, userType) {
    console.log('WlClient.addMessageToEntry("'+newMessage+'")');
    // clear entry messages if they don't start with '<li>'
    if (typeof entry.entry_messages !== "string" ||
      entry.entry_messages.indexOf('<li>') !== 0) {
      entry.entry_messages = [];
    }

    // form the 3-letter fromName to begin the message
    let fromName;
    if (userType === 'restaurant') {
      fromName = 'Rst';
      entry.entry_message_status = 'new-msg-from-restaurant';
    } else {
      let name = entry.entry_name;
      fromName = name.slice(0, Math.min(3,name.length));
      entry.entry_message_status = 'new-msg-from-customer';
    }
    entry.entry_messages += '<li>' + fromName + ': ' +  newMessage + '</li>';

    // remove old messages when message list gets long
    let messages = entry.entry_messages.split('<li>');
    if (messages.length > WlDefaults.maxMessages) {
      messages.splice(0,
        messages.length - WlDefaults.maxMessages);
      let messageStr = '';
      messages.forEach( function (msg) { messageStr += '<li>' + msg; });
      entry.entry_messages = messageStr;
    }
    return entry;
  }

  /**
   * subscribe to server-sent events that will contain updates to entry
   * @param {number} queueId
   * @param {string} userType - 'restaurant' or 'customer'
   * @param {number} entryId
   * @param {function} onMessage - callback when event is received
   * @param {function} [onOpen] - callback when connection is first opened
   * @param {function} [onError] - callback on error, passes{error,message,event}
   * @param {string} [serverUrl]
   * @return {void}
   */
  function subscribeServerEvents( queueId, userType,
                                  entryId = 0, onMessage, onOpen,
                                  onError, serverUrl ) {
    console.log('WlClient.subscribeServerEvents()');
    let svUrl = serverUrl || WlDefaults.serverUrlDefault;

    // if ssEvent already exists, don't try to make another one
    if (ssEvent) {return;}

    // create ssEvent if necessary
    if ( !ssEvent || ssEvent.readyState !== EventSource.OPEN ) {
      let sessionId = getSessionID() || setSessionID();
      let eventUrl = svUrl+'/event/'+queueId+'/'+userType+'/'+entryId +
        '/'+sessionId;
      ssEvent = new EventSource( eventUrl,
        { withCredentials: false } );
      if (!ssEvent) {
        console.error('WlClient.subscribeServerEvents EventSource - ERROR' +
          ' ssEvent is falsey');
        onError({error: 503, message: "Unable to create EventSource."});
        return;
      }
    }

    if (onOpen) {
      ssEvent.addEventListener('open', function (evt) {
        onOpen({error: null, message: '', event: evt});
      });
    }
    if (onError) {
      ssEvent.addEventListener('error', function (evt) {
        console.error('ssEvent.onerror evt:',evt);
        onError({
          error: 503,
          message: 'Unable to connect to server.',
          event: evt});
      });
    }

    // add the listener (this should be safe to call multiple times
    // without duplication)
    ssEvent.addEventListener('message', onMessage);
  }

  /**
   * close server events
   */
  function closeServerSentEvents() {
    console.log('WlClient.closeServerSentEvents()');
    if (ssEvent) {
      ssEvent.close();
      ssEvent = null;
    }
  }

  /**
   * close the specified modal
   * @param {string} modalId
   */
  function modalClose(modalId) {
    let modal = document.getElementById(modalId);
    if (modal) {
      $('#'+modalId).modal('hide');
    }
  }

  /**
   * update the window's URL hash string "#<queueId>,<entryId>"
   * @param {number|null} [queueId]
   * @param {number|null} [entryId]
   */
  function updateWindowHash(queueId, entryId) {
    let hashString = (queueId || entryId) ? '#' : '';
    if (queueId) { hashString += '' + queueId; }
    if (entryId) { hashString += ',' + entryId; }
    if (history.replaceState) {
      history.replaceState(null, null, hashString);
    } else if (location) {
      location.hash = hashString;
    }
  }

  /**
   * set unique sitsooner session id in sessionStorage
   * @returns {string} sessionId
   */
  function setSessionID() {
    let nowDate = new Date();
    let nowSecs = Math.round( nowDate.getTime()/1000 );
    let rand = Math.floor( Math.random() * 1000000 );
    let sessionId = 'SSID-' + nowSecs + '-' + rand;

    // Save data to sessionStorage
    sessionStorage.setItem('ss-session', sessionId);
    return sessionId;
  }

  /**
   * get sitsooner session id from sessionStorage
   * @return {string}
   */
  function getSessionID() {
    return sessionStorage.getItem('ss-session');
  }

  /**
   * safely parses JSON string (without throwing an error)
   * returns 'undefined' if string is not valid JSON
   * @param {string} str
   * @return {object|undefined}
   */
  function safeJsonParse(str) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return undefined;
    }
  }

  return {
    serverAlive,
    serverAlivePromise,
    getAuth,
    login,
    logout,
    logoutPromise,
    getRestaurant,
    newEntry,
    createEntry,
    findEntryOnServer,
    readEntry,
    readEntryPromise,
    updateEntry,
    saveEntry,
    validateEntryPhone,
    addMessageToEntry,
    subscribeServerEvents,
    closeServerSentEvents,
    updateWindowHash,
    modalClose,
    safeJsonParse
  }
})();

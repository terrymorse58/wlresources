/**
 * localdb.js - local database storage for restaurant, entry
 * uses indexedDB database through the wrapper IDBStore
 *
 */

const LocalDB = (function () {

  let restStore = new IDBStore({
    dbVersion: 1,
    storeName: 'restaurant',
    keyPath: 'id',
    autoIncrement: false,
    onStoreReady: function () {
      //console.log('localdb.js - restStore onStoreReady()');
    }
  });

  let entryNextId = -1; // use negative ids for newly created entries
  let entryStore = new IDBStore({
    dbVersion: 1,
    storeName: 'entry',
    keyPath: 'id',
    autoIncrement: false,
    onStoreReady: function () {
      //console.log('localdb.js - entryStore onStoreReady()')
      // determine the next index id for new entries
      getAllEntries(
        function (entries) {
          entries.forEach(
            function (entry) {
              if (entry.id <= entryNextId) { entryNextId = entry.id - 1; }
            });
          //console.log('localdb.js - entryStore onStoreReady > getAllEntries entryNextId:',entryNextId);
        },
        function (err) {
          console.log('localdb.js - entryStore onStoreReady > getAllEntries ERROR:',err);
        }
      );
    }
  });

  /**
   * put restaurant to localDB with promise
   * @param {object} restaurant
   * @param {boolean} setDate - set 'updatedAtLocal' to now if true
   * @return {Promise<object|{error,message}>}
   */
  function putRestPromise( restaurant, setDate ) {
    return new Promise( function (resolve) {
      if (setDate) {
        let nowDate = new Date();
        restaurant.updatedAtLocal = nowDate.toISOString()
          .split('.')[0] + "Z";  // strip off milliseconds
      } else {
        restaurant.updatedAtLocal = restaurant.updatedAt;
      }
      restStore.put( restaurant, function (success) {
          resolve(success);
        }, function (err) {
          resolve(err);
        } );
    });
  }

  /**
   * get single restaurant with a promise
   * @param restId
   * @return {Promise<object|{error,message}>}
   */
  function getRestPromise(restId) {
    //console.log('localdb.js getRestPromise('+restId+')');
    return new Promise(function (resolve) {
      restStore.get(restId, function (restaurant) {
        //console.log('getRestPromise restStore.get onSuccess, restaurant:',restaurant);
        if (typeof restaurant === 'undefined') {
          restaurant = {
            error: 404,
            message: 'restaurant ' + restId + ' not found.'
          }
        }
        resolve(restaurant);
      }, function (restStoreErr) {
        resolve({
          error: 404,
          message: 'could not load restaurant ' + restId + ' from local database.'
        });
      });
    });
  }

  /**
   * destroy local restaurant with a promise
   * @param {number} id
   * @return {Promise <void>}
   */
  function removeRestPromise( id ) {
    //console.log('localdb.js removeRestPromise('+id+')');
    return new Promise( function (resolve) {
      restStore.remove( id, function () {
        //console.log('localdb.js removeRestPromise('+id+') success',);
        resolve();
      }, function (err) {
        console.log('localdb.js removeRestPromise('+id+') ERROR:',err);
        resolve();
      });
    })
  }

  /**
   * remove all restaurants
   * @param {function} onSuccess
   * @param {function: {object}} onError
   */
  function clearAllRestaurants( onSuccess, onError ) {
    restStore.clear(onSuccess, onError);
  }

  /**
   * remove all restaurants from localDB with promise
   * @return {Promise<undefined>}
   */
  function clearAllRestaurantsPromise() {
    return new Promise( function (resolve) {
      restStore.clear( function () {
        resolve();
      }, function () {
        resolve();
      });
    })
  }

  /**
   * put single entry (create or update)
   * @param {object} entry
   * @param {boolean} setDate - set 'updatedAtLocal' if true
   * @param {function: {number}} onSuccess - number is entry id number
   * @param {function: {object}} onError
   */
  function putEntry( entry, setDate, onSuccess, onError ) {
    // set negative id here if necessary (to indicate entry not yet stored in cloud)
    if (typeof entry.id === 'undefined' || entry.id === 0 || entry.id == null) {
      entry.id = entryNextId;
      entryNextId--;
      //console.log('localdb.js - putEntry entryNextId is now:',entryNextId);
    }
    if (setDate) {
      let nowDate = new Date();
      entry.updatedAtLocal = nowDate.toISOString().split('.')[0] + "Z";
    } else {
      entry.updatedAtLocal = entry.updatedAt;
    }
    entryStore.put( entry, onSuccess, onError );
  }

  /**
   *
   * @param {object} entry
   * @param {boolean} setDate - sets entry.updatedAtLocal if true
   * @return {Promise <number|object>}
   */
  function putEntryPromise(entry, setDate) {
    return new Promise( function (resolve) {
      putEntry(entry, setDate, function (entryId) {
        resolve(entryId);
      }, function (err) {
        resolve(err);
      });
    });
  }

  /**
   * get single entry
   * @param {number} id
   * @param {function: {object}} onSuccess
   * @param {function: {object}} onError
   */
  function getEntry( id, onSuccess, onError ) {
    entryStore.get( id, onSuccess, onError );
  }

  // get single entry with a promise
  /**
   *
   * @param {number} id
   * @return {Promise<object>}
   */
  function getEntryPromise( id ) {
    return new Promise( function (resolve) {
      entryStore.get( id, function (success) {
        resolve(success);
      }, function (err) {
        resolve(err);
      } );
    });
  }

  /**
   * get all entries
   * @param {function: {object}[]} onSuccess
   * @param {function: {object}} onError
   */
  function getAllEntries( onSuccess, onError ) {
    entryStore.getAll( onSuccess, onError );
  }

  /**
   * get entries with matching queueId and entryStatus
   * @param {number} queueId
   * @param {string|undefined} entryStatus
   * @param {function} onsuccess
   * @param {function} onError
   */
  function getEntries( queueId, entryStatus,
                       onsuccess, onError ) {
    getAllEntries(
      function (entries) {
        let entriesOut = [];
        // filter by restaurant ID and entry status
        entries.forEach( function (entry) {
          if (entry.entry_queue_id !== queueId) { return; }
          if (entryStatus && entry.entry_status !== entryStatus) { return; }
          entriesOut.push(entry);
        });
        onsuccess(entriesOut);
      },
      function (error) {
        onError(error);
      });
  }

  /**
   * get entries with a promise
   * @param {number} queueId
   * @param {string} [entryStatus]
   * @return {Promise <Entry[]>}
   */
  function getEntriesPromise( queueId, entryStatus ) {
    return new Promise( function (resolve) {
      getEntries( queueId, entryStatus, function (success) {
        //console.log('localdb.js getEntriesPromise getEntries success:',success);
        resolve(success);
      }, function (err) {
        console.log('localdb.js getEntriesPromise getEntries ERROR:',err);
        resolve(err);
      });
    });
  }

  /**
   * put multiple entries
   * @param {object []} entries
   * @param {boolean} setDate - set 'updatedAtLocal' if true
   * @param {function} onSuccess - no params
   * @param {function} onError - array of error objects
   */
  function putEntries( entries, setDate, onSuccess, onError ) {
    let errors = [],
      lastIndex = entries.length - 1;
    entries.forEach( function (entry, index) {
      putEntry( entry, setDate,
        function (id) {
          if (index === lastIndex) {
            onSuccess();
          }
        },
        function (error) {
          console.log('localdb.js putEntries > putEntry ERROR, index:',index,', error:',error);
          errors.push(error);
          if (index === lastIndex) {
            onError(errors);
          }
        });
    });
  }

  /**
   * put multiple entries with a promise
   * @param {object []} entries
   * @param {boolean} setDate - set 'updatedAtLocal' if true
   * @return {Promise<undefined|object []>} - undefined if success, object[] of errors if not
   */
  function putEntriesPromise(entries, setDate) {
    return new Promise( function (resolve) {
      putEntries( entries, setDate, function () {
        resolve("success");
      }, function (errors) {
        resolve(errors);
      });
    });
  }

  /**
   * destroy entry with a promise
   * @param {number} id
   * @return {Promise <undefined>}
   */
  function destroyEntryPromise( id ) {
    return new Promise( function (resolve) {
      entryStore.remove( id, function () {
        resolve();
      }, function () {
        resolve();
      });
    });
  }

  /**
   * clear all entries from local store
   * @return {Promise<undefined>}
   */
  function clearAllEntriesPromise() {
    return new Promise( function (resolve) {
      entryStore.clear( function () {
        resolve();
      }, function () {
        resolve();
      });
    })
  }


  return {
    getRestPromise: getRestPromise,
    putRestPromise: putRestPromise,
    destroyRestPromise: removeRestPromise,
    clearAllRestaurantsPromise: clearAllRestaurantsPromise,
    putEntryPromise: putEntryPromise,
    putEntriesPromise: putEntriesPromise,
    getEntryPromise: getEntryPromise,
    getEntriesPromise: getEntriesPromise,
    destroyEntryPromise: destroyEntryPromise,
    clearAllEntriesPromise: clearAllEntriesPromise
  }

})();

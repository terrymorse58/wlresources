// read and sync of entries

/* globals EntrySync */

/**
 * @typedef {Object} Entry
 * @property {number} id
 * @property {number} entry_queue_id
 * @property {string} updatedAt
 * @property {string} updatedAtLocal
 *
 */

const Entries = (function () {

  // items pending in the sync queue
  let itemsPending = 0;

  /**
   * get entries with a promise
   * @param {number} queueId
   * @param {string} serverUrl
   * @return {Promise<object|{error,message}>}
   *
   * @note never rejects, so check response for {error,message}
   */
  function entriesGetPromise(queueId, serverUrl) {
    //console.log('entries.js entriesGetPromise()');

    // first try to get entries from localDB
    return LocalDB.getEntriesPromise( queueId, 'ACTIVE' )

      // try to get from remote server
      .then( localEntries => {
        return RestClient.getPromise(serverUrl+'/entries/'+queueId)
          .then(serverEntries => {
            return {localEntries, serverEntries};
          });
      })

    // sync local and server and return entries
      .then( ({localEntries, serverEntries}) => {
        return EntrySync.sync(localEntries, serverEntries,
          ['entry_queue_id', 'entry_name', 'entry_seats',
            'entry_phone', 'entry_status']);
      })
      .then(() => {
        return LocalDB.getEntriesPromise(queueId);
      })
      .then(entries => {
        console.log('  entriesGetPromise complete entries:', entries);
        return entries;
      });
  }

  /**
   * sync local and server entries
   * @param {number} restId
   * @param {string} serverUrl
   * @return {Promise<Entry[]|*>}
   */
  function sync (restId, serverUrl) {
    console.log('Entries.sync()');

    // get local and server entries, then sync and return entries
    return LocalDB.getEntriesPromise(restId)
      .then(localEntries => {
        if (localEntries.error) {throw localEntries;}
        return RestClient.getPromise(serverUrl+'/entries/'+restId)
          .then(serverEntries => {
            if (serverEntries.error) {throw serverEntries.error;}
            return {localEntries, serverEntries};
          });
      })
      .then(({localEntries, serverEntries}) => {
        return EntrySync.sync(localEntries, serverEntries,
          ['entry_queue_id', 'entry_name', 'entry_seats',
          'entry_phone', 'entry_status'])
          .then(() => {
            return LocalDB.getEntriesPromise(restId);
          })
          .then(entries => {
            return entries;
          });
        }
      )

      .catch (err => {
        console.log('Entries.sync catch err:', err);
        throw err;
      });
  }


  return {
    readPromise: entriesGetPromise,
    sync
  };

})();

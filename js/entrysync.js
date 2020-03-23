// entrysync.js - sync of records

/**
 * record to be synced
 * @typedef {Object} Record
 * @property {number} id
 * @property {string} updatedAtLocal */

const EntrySync = (function () {

  // number of items pending in the sync queue
  let itemsPending = 0;

  /**
   * sync local and server records with a promise
   * @param {*[]} localRecs - records from server
   * @param {*[]} serverRecs - records from server
   * @param {string[]} propsToCompare - name of props to compare
   * @return {Promise<*>}
   */
  function syncEntriesPromise(localRecs,
            serverRecs, propsToCompare) {
    console.log('EntrySync.syncEntriesPromise()');
    return new Promise( resolve => {
      syncEntries(localRecs, serverRecs, propsToCompare,
        () => resolve());
    });
  }

  /**
   * sync local records with server records
   * @param {Record[]|Object[]} localRecs - records from server
   * @param {Record[]|Object[]} serverRecs - records from server
   * @param {string[]} propsToCompare - name of props to compare
   * @param {function <void>} callback
   */
  function syncEntries(localRecs, serverRecs,
                       propsToCompare, callback) {
    // console.log('  syncEntries()');

    let syncQueue = [];

    // create maps of records by id (for speed)
    const serverRecsMap = mapById(serverRecs);
    const localRecsMap = mapById(localRecs);

    localRecs.forEach( function(localRec){

      // if local record has id < 0, it has not yet been matched to server
      if (localRec.id < 0) {
        syncEvalNewLocalRecord(syncQueue, localRec, serverRecs, propsToCompare);
        return;
      }

      // select server record that matches local record
      const serverRec = serverRecsMap[localRec.id];
      // const serverRec = findRecordById(localRec.id, serverRecs);

      // no match found on server: destroy local record
      if (!serverRec) {
        addDestroyLocal(syncQueue, localRec);
        return;
      }

      // console.log('    syncEntries serverRec:', serverRec);

      // compare updated times
      let serverTime = new Date(serverRec.updatedAt).getTime();
      let localTime = new Date(localRec.updatedAtLocal).getTime();

      // console.log(`    syncEntries serverTime: ${serverTime}, localTime:, ${localTime}`);

      // if server record is newer, sync server-to-local
      if (serverTime > localTime + 999) {
        return addServerToLocal(syncQueue, serverRec);
      }

      // if local record is newer, sync local-to-server
      if (localTime > serverTime + 999) {
        return addLocalToServer(syncQueue, localRec);
      }
    });

    // search for server records that aren't in local
    serverRecs.forEach( function(serverRec) {
      const localRec = localRecsMap[serverRec.id];
      // const localRec = findRecordById(serverRec.id, localRecs);
      if (!localRec) {
        // no local record found to match server record, store serverRec to local
        addCreateOnLocal(syncQueue, serverRec);
      }
    });

    // console.log('    syncEntries syncQueue:', syncQueue);

    // if no sync items in the queue, we're done
    if (!syncQueue.length) {
      itemsPending = 1;
      return itemComplete( callback );
    }

    // process every item in the sync queue
    itemsPending = syncQueue.length;

    syncQueue.forEach( function(queueItem) {
      processQueueItem(queueItem, callback);
    });
  }

  /**
   * call this whenever a sync queue item has been completed
   * will call `done` after all items in queue have been completed
   * @param {function <void>} done
   */
  function itemComplete(done) {
    itemsPending--;
    //console.log('itemComplete(), itemsPending:',itemsPending);
    if (itemsPending) { return; }
    done();
  }

  /**
   * evaluate how to sync a new local record (with id < 0)
   * @param {Object[]} syncQueue
   * @param {Record} localRec
   * @param {Record[]} serverRecs
   * @param {string[]} propsToCompare - name of props to compare
   */
  function syncEvalNewLocalRecord(syncQueue, localRec,
                            serverRecs, propsToCompare) {
    console.log('  syncEvalNewLocalRecord() ID:', localRec.id);
    const serverRec = findMatch(localRec, serverRecs, propsToCompare);
    if (serverRec) {
      // exists on server: create on local
      addCreateOnLocal(syncQueue, serverRec);
    } else {
      // does not exist on server, create on server
      addCreateOnServer(syncQueue, localRec)
    }
    // destroy old local (since its id < 0)
    addDestroyLocal(syncQueue, localRec);
  }

  /**
   * find record match in records, evaluating only propNames
   * @param {Record} recTry
   * @param {Record[]} records
   * @param {string[]} propNames
   * @return {null|Record}
   */
  function findMatch(recTry, records, propNames) {
    console.log(`    findMatch()`);
    const propCount = propNames.length;
    for (const record of records) {
      let matched = true;
      for (const propName of propNames) {
        if (String(record[propName]) !== String(recTry[propName])) {
          matched = false;
          break;
        }
      }
      if (matched) {
        console.log(`    findMatch matched`);
        return record;
      }
    }
    console.log(`    findMatch NOT matched`);
    return null;
  }

  /**
   * add a 'destroy-local' to sync queue
   * @param {object[]} syncQueue
   * @param {Record} record
   */
  function addDestroyLocal(syncQueue, record) {
    // console.log('    addDestroyLocal id:', record.id);
    syncQueue.push({
      type: "destroy-local",
      id: record.id,
      record: record
    });
  }

  /**
   * add 'server-to-local' sync to queue
   * @param {object[]} syncQueue
   * @param {Record} record
   */
  function addServerToLocal(syncQueue, record) {
    // console.log('    addServerToLocal id:', record.id);
    syncQueue.push({
      type: "server-to-local",
      id: record.id,
      record: record
    });
  }

  /**
   * add 'local-to-server' task to sync queue
   * @param {object[]} syncQueue
   * @param {Record} record
   */
  function addLocalToServer(syncQueue, record) {
    // console.log('    addLocalToServer id:', record.id);
    syncQueue.push({
      type: 'local-to-server',
      id: record.id,
      record: record
    });
  }

  /**
   * add 'create-on-local' task to sync queue
   * @param {object[]} syncQueue
   * @param {Record} record
   */
  function addCreateOnLocal(syncQueue, record) {
    // console.log('    addCreateOnLocal id:', record.id);
    syncQueue.push({
      type: 'create-on-local',
      id: record.id,
      record: record
    });
  }

  /**
   * add 'create-on-server' task to sync queue
   * @param {object[]} syncQueue
   * @param {Record} record
   */
  function addCreateOnServer(syncQueue, record) {
    // console.log('    addCreateOnServer id:', record.id);
    syncQueue.push({
      type: 'create-on-server',
      id: record.id,
      record: record
    });
  }


  /**
   * process a single sync queue item
   * @param {object} queueItem
   * @param {function} callback
   * @return {void}
   */
  function processQueueItem(queueItem, callback) {
    if (queueItem.type === 'create-on-server') {
      WlClient.createEntry(queueItem.record, true,
        function () {
          itemComplete(callback);
        });
      return;
    }

    if (queueItem.type === 'server-to-local') {
      LocalDB.putEntryPromise(queueItem.record, false)
        .then(() => {
          itemComplete(callback);
        });
      return;
    }

    if (queueItem.type === 'local-to-server') {
      WlClient.updateEntry(queueItem.record, false,
        function () {
          itemComplete(callback);
        });
      return;
    }

    if (queueItem.type === 'create-on-local') {
      LocalDB.putEntryPromise(queueItem.record, false)
        .then(() => {
          itemComplete(callback);
        });
      return;
    }

    if (queueItem.type === 'destroy-local') {
      LocalDB.destroyEntryPromise(queueItem.id)
        .then(() => {
          itemComplete(callback);
        });
    }
  }

  /**
   * map records by id
   * @param {Record[]} records
   * @return {{}} - records with key == id
   */
  function mapById(records) {
    const map = {};
    if (!records) {return map;}
    for (const record of records) {
      map[record.id] = record;
    }
    return map;
  }

  return {
    sync: syncEntriesPromise
  }

})();

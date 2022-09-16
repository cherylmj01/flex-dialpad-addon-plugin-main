import { Actions } from '@twilio/flex-ui';
import { v4 as uuidv4 } from 'uuid';

class SyncIPCClient {
  #cache;

  constructor() {
    this.#cache = {};
    
    Actions.addListener("afterSyncDocIPC", async (payload) => {
      switch (payload.mode) {
        case 'GET':
        case 'UPDATE':
          this.#cache[payload.docName] = {
            data: payload.data
          }
          break;
        case 'CLOSE':
          break;
      }
    });
  }

  /**
   * Returns the Sync Document instance
   * @param docName the Sync Document to return
   */
  getSyncDoc = async (docName) => {
    await Actions.invokeAction("SyncDocIPC", { mode: 'GET', docName, requestId: uuidv4() });
    return this.#cache[docName];
  };

  /**
   * This is where we update the Sync Document
   * @param docName the doc name to update
   * @param data the object to update the doc with
   */
  updateSyncDoc = async (docName, data) => {
    await Actions.invokeAction("SyncDocIPC", { mode: 'UPDATE', docName, data, requestId: uuidv4() });
    return this.#cache[docName];
  };

  /**
   * Called when we wish to close/unsubscribe from a specific sync document
   * @param docName the doc name to close
   */
  closeSyncDoc = async (docName) => {
    await Actions.invokeAction("SyncDocIPC", { mode: 'CLOSE', docName, requestId: uuidv4() });
  };
}

const syncIpcClient = new SyncIPCClient();

export default syncIpcClient;

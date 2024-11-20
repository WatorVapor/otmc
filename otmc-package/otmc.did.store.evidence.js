import Dexie from 'dexie';
import { StoreKey } from './otmc.const.js';
/**
*
*/
export class DidStoreEvidence {
  constructor() {
    this.version = '1.0';
    this.trace0 = true;
    this.trace1 = false;
    this.trace2 = false;
    this.trace = true;;
    this.debug = true;
    this.db = new Dexie(StoreKey.open.did.chain.dbName);
    this.db.version(this.version).stores({
      chain: '++autoId,didId,keyAddress,authedAddress,seed'
    });
  }
}
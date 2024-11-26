import Dexie from 'dexie';
import { StoreKey } from './otmc.const.js';
/**
*
*/
export class DidStoreEvidence {
  constructor() {
    this.version = '1.0';
    this.trace0 = true;
    this.trace1 = true;
    this.trace2 = true;
    this.trace = true;;
    this.debug = true;
    this.db = new Dexie(StoreKey.open.did.chain.dbName);
    this.db.version(this.version).stores({
      chain: '++autoId,didId,proofAddress,authedAddress,root,endEntity,seed,leaf'
    });
  }
  async getAllStable() {
    const stable = {};
    return stable;
  }
  async putStable(chainId,proofKeyId,authedKeyId,authedKeyState) {
    if(this.trace2) {
      console.log('DidStoreEvidence::putStable::chainId=<',chainId,'>');
      console.log('DidStoreEvidence::putStable::proofKeyId=<',proofKeyId,'>');
      console.log('DidStoreEvidence::putStable::authedKeyId=<',authedKeyId,'>');
      console.log('DidStoreEvidence::putStable::authedKeyState=<',authedKeyState,'>');
    }
  }
}
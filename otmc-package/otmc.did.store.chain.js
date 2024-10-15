import Dexie from 'dexie';
import { StoreKey } from './otmc.const.js';
/**
*
*/
export class DidStoreChain {
  constructor(dbName) {
    this.version = '1.0';
    this.trace0 = true;
    this.trace1 = false;
    this.trace2 = false;
    this.trace = true;;
    this.debug = true;
    this.db = new Dexie(StoreKey.open.did.chain.dbName);
    this.db.version(this.version).stores({
      chain: '++autoId,keyAddress,authedList'
    });
  }
  async addAuthed(keyAddress,authedKeyAddress) {
    if(this.trace) {
      console.log('DidStoreChain::addAuth::keyAddress=:<',keyAddress,'>');
      console.log('DidStoreChain::addAuth::authedKeyAddress=:<',authedKeyAddress,'>');
    }
    await this.db.chain.add(didStore);
  }
  async isAuthed(didAddress,keyAddress) {
    if(this.trace) {
      console.log('DidStoreChain::isAuthed::didAddress=:<',didAddress,'>');
    }
  }
  async getAll(address) {
    const didAddress = `did:otmc:${address}`;
    if(this.trace) {
      console.log('DidStoreChain::getAll::didAddress=:<',didAddress,'>');
    }
    const storeObjects = await this.db.didDoc.where('id').equals(didAddress).toArray();
    if(this.trace) {
      console.log('DidStoreChain::getAll::storeObjects=:<',storeObjects,'>');
    }
    const storeValuesJson = [];
    for(const storeValue of storeObjects) {
      const storeDid = JSON.parse(storeValue.origDid);
      storeValuesJson.push(storeDid);
    }
    if(this.trace) {
      console.log('DidStoreChain::getAll::storeValuesJson=:<',storeValuesJson,'>');
    }
    return storeValuesJson;
  }
}
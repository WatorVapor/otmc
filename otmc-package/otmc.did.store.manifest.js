import Dexie from 'dexie';
import { StoreKey } from './otmc.const.js';
/**
*
*/
export class DidStoreManifest {
  constructor(dbName) {
    this.version = '1.0';
    this.trace0 = true;
    this.trace1 = false;
    this.trace2 = false;
    this.trace = true;;
    this.debug = true;
    this.db = new Dexie(StoreKey.open.did.manifest.dbName);
    this.db.version(this.version).stores({
      manifest: '++autoId,did,hash,origManifest'
    });
  }
  put(key,value,option,cb) {
    this.store.put(key,value,option,cb);
  }
  async putManifest(didManifest) {
    if(this.trace) {
      console.log('DidStoreManifest::putManifest::didManifest=:<',didManifest,'>');
    }
    await this.db.manifest.put(didManifest);
  }
  async getTop(didAddress) {
    const manifestValuesJson = await this.getAll(didAddress);
    if(this.trace) {
      console.log('DidStoreManifest::getTop::manifestValuesJson=:<',manifestValuesJson,'>');
    }
    
    const sorted = manifestValuesJson.sort( this.compare_ );
    if(this.trace) {
      console.log('DidStoreManifest::getTop::sorted=:<',sorted,'>');
    }
    if(sorted.length > 0) {
      return sorted[0];
    } else {
      return null;
    }
  }
  async getAll(didAddress) {
    const storeObjects = await this.db.manifest.where('did').equals(didAddress).toArray();
    if(this.trace) {
      console.log('DidStoreManifest::getAll::storeObjects=:<',storeObjects,'>');
    }
    const storeValuesJson = [];
    for(const storeValue of storeObjects) {
      const storeManifest = JSON.parse(storeValue.origManifest);
      storeValuesJson.push(storeManifest);
    }
    if(this.trace) {
      console.log('DidStoreManifest::getAll::storeValuesJson=:<',storeValuesJson,'>');
    }
    return storeValuesJson;
  }
  
  compare_(a,b) {
    if ( a.updated < b.updated ){
      return -1;
    }
    if ( a.updated > b.updated ){
      return 1;
    }
    return 0;
  }
  
}

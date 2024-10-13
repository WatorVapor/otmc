import Dexie from 'dexie';
import { StoreKey } from './otmc.const.js';
/**
*
*/
export class DidStoreDocument {
  constructor(dbName) {
    this.version = '1.0';
    this.trace0 = true;
    this.trace1 = false;
    this.trace2 = false;
    this.trace = true;;
    this.debug = true;
    this.db = new Dexie(StoreKey.open.did.document.dbName);
    this.db.version(this.version).stores({
      didDoc: '++autoId,id,hashDid,origDid'
    });
  }
  async putDid(didStore) {
    if(this.trace) {
      console.log('DidStoreDocument::putDid::didStore=:<',didStore,'>');
    }
    await this.db.didDoc.put(didStore);
  }
  async getTop(address) {
    const didValuesJson = await this.getAll(address);
    if(this.trace) {
      console.log('DidStoreDocument::getTop::didValuesJson=:<',didValuesJson,'>');
    }
    
    const sorted = didValuesJson.sort( this.compare_ );
    if(this.trace) {
      console.log('DidStoreDocument::getTop::sorted=:<',sorted,'>');
    }
    if(sorted.length > 0) {
      return sorted[0];
    } else {
      return null;
    }
  }
  async getAll(address) {
    const didAddress = `did:otmc:${address}`;
    if(this.trace) {
      console.log('DidStoreDocument::getAll::didAddress=:<',didAddress,'>');
    }
    const storeObjects = await this.db.didDoc.where('id').equals(didAddress).toArray();
    if(this.trace) {
      console.log('DidStoreDocument::getAll::storeObjects=:<',storeObjects,'>');
    }
    const storeValuesJson = [];
    for(const storeValue of storeObjects) {
      const storeDid = JSON.parse(storeValue.origDid);
      storeValuesJson.push(storeDid);
    }
    if(this.trace) {
      console.log('DidStoreDocument::getAll::storeValuesJson=:<',storeValuesJson,'>');
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
  
  isAddressUsedDid_(didDoc,address) {
    if(this.trace) {
      console.log('DidStoreDocument::isAddressUsedDid_::didDoc=:<',didDoc,'>');
      console.log('DidStoreDocument::isAddressUsedDid_::address=:<',address,'>');
    }
    const addressSuffix = `#${address}`;
    if(this.trace) {
      console.log('DidStoreDocument::isAddressUsedDid_::addressSuffix=:<',addressSuffix,'>');
    }
    for(const auth of didDoc.authentication) {
      if(this.trace) {
        console.log('DidStoreDocument::isAddressUsedDid_::auth=:<',auth,'>');
      }
      if(auth.endsWith(addressSuffix)) {
        return true;
      }
    }
    return false;
  }
}
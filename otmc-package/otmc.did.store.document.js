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
      stable: '++autoId,id,updated,hashDid,origDid'
    });
    this.db.version(this.version).stores({
      fickle: '++autoId,id,updated,hashDid,origDid'
    });
  }
  async putStable(didStore) {
    if(this.trace) {
      console.log('DidStoreDocument::putStable::didStore=:<',didStore,'>');
    }
    await this.db.stable.put(didStore);
  }
  async putFickle(didStore) {
    if(this.trace) {
      console.log('DidStoreDocument::fickle::didStore=:<',didStore,'>');
    }
    await this.db.fickle.put(didStore);
  }
  async getTop(address) {
    const didAddress = `did:otmc:${address}`;
    if(this.trace) {
      console.log('DidStoreDocument::getTop::didAddress=:<',didAddress,'>');
    }
    const didValuesJson = await this.getAllByDidAddress_(didAddress);
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
  
  async getAllStable(address) {
    const didAddress = `did:otmc:${address}`;
    if(this.trace) {
      console.log('DidStoreDocument::getAllStable::didAddress=:<',didAddress,'>');
    }
    const storeValuesJson = await this.getAllByDidAddress_(didAddress,this.db.stable);
    if(this.trace) {
      console.log('DidStoreDocument::getAllStable::storeValuesJson=:<',storeValuesJson,'>');
    }
    return storeValuesJson;
  }
  async getAllFickle(address) {
    const didAddress = `did:otmc:${address}`;
    if(this.trace) {
      console.log('DidStoreDocument::getAllFickle::didAddress=:<',didAddress,'>');
    }
    const storeValuesJson = await this.getAllByDidAddress_(didAddress,this.db.fickle);
    if(this.trace) {
      console.log('DidStoreDocument::getAllFickle::storeValuesJson=:<',storeValuesJson,'>');
    }
    return storeValuesJson;
  }
  async getMemberAllStable(address) {
    const storeValuesJson = await this.getAllAuthMember_(address,this.db.stable);
    if(this.trace) {
      console.log('DidStoreDocument::getMemberAllStable::storeValuesJson=:<',storeValuesJson,'>');
    }
    return storeValuesJson;
  }
  async getMemberAllFickle(address) {
    const storeValuesJson = await this.getAllAuthMember_(address,this.db.fickle);
    if(this.trace) {
      console.log('DidStoreDocument::getMemberAllFickle::storeValuesJson=:<',storeValuesJson,'>');
    }
    return storeValuesJson;
  }
  
  async getControll(did) {
    if(this.trace) {
      console.log('DidStoreDocument::getControll::did=:<',did,'>');
    }
    const didJson = await this.getAllByDidAddress_(did,this.db.stable);
    if(this.trace) {
      console.log('DidStoreDocument::getControll::didJson=:<',didJson,'>');
    }
  }

  async getAllByDidAddress_(didAddress,storeObject) {
    if(this.trace) {
      console.log('DidStoreDocument::getAllByDidAddress_::didAddress=:<',didAddress,'>');
    }
    const storeObjects = await storeObject.where('id').equals(didAddress).toArray();
    if(this.trace) {
      console.log('DidStoreDocument::getAllByDidAddress_::storeObjects=:<',storeObjects,'>');
    }
    const storeValuesJson = [];
    for(const storeValue of storeObjects) {
      const storeDid = JSON.parse(storeValue.origDid);
      storeValuesJson.push(storeDid);
    }
    if(this.trace) {
      console.log('DidStoreDocument::getAllByDidAddress_::storeValuesJson=:<',storeValuesJson,'>');
    }
    return storeValuesJson;
  }

  async getAllAuthMember_(authAddress,storeObject) {
    const storeObjects = await storeObject.toArray();
    if(this.trace) {
      console.log('DidStoreDocument::getAllAuthMember_::storeObjects=:<',storeObjects,'>');
    }
    const storeValuesJson = [];
    for(const storeValue of storeObjects) {
      const storeDid = JSON.parse(storeValue.origDid);
      if(this.trace) {
        console.log('DidStoreDocument::getAllAuthMember_::storeDid=:<',storeDid,'>');
      }
      if(this.isAuthMember_(storeDid,authAddress)){
        storeValuesJson.push(storeDid);
      }
    }
    if(this.trace) {
      console.log('DidStoreDocument::getAllAuthMember_::storeValuesJson=:<',storeValuesJson,'>');
    }
    return storeValuesJson;
  }
  isAuthMember_(didJson,address) {
    if(this.trace) {
      console.log('DidStoreDocument::isAuthMember_::didJson=:<',didJson,'>');
      console.log('DidStoreDocument::isAuthMember_::address=:<',address,'>');
    }
    try {
      for(const auth of didJson.authentication) {
        if(this.trace) {
          console.log('DidStoreDocument::isAuthMember_::auth=:<',auth,'>');
        }
        if(auth.endsWith(`#${address}`)) {
          return true;
        }
      }
    } catch (err) {
      console.error('DidStoreDocument::isAuthMember_::err=:<',err,'>');
    }
    return false;
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
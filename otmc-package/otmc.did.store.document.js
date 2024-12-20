import Dexie from 'dexie';
import { StoreKey } from './otmc.const.js';
/**
*
*/
export class DidStoreDocument {
  constructor() {
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
    this.db.version(this.version).stores({
      tentative: '++autoId,id,updated,hashDid,origDid'
    });
  }
  async putStable(didStore) {
    if(this.trace) {
      console.log('DidStoreDocument::putStable::didStore=:<',didStore,'>');
    }
    const filter = {
      id: didStore.id,
      hashDid: didStore.hashDid
    };
    const storeObject = await this.db.stable.where(filter).first();
    if(this.trace) {
      console.log('DidStoreDocument::putStable::storeObject=:<',storeObject,'>');
    }
    if(!storeObject) {
      await this.db.stable.put(didStore);
    }
  }
  async putFickle(didStore) {
    if(this.trace) {
      console.log('DidStoreDocument::putFickle::didStore=:<',didStore,'>');
    }
    const filter = {
      id: didStore.id,
      hashDid: didStore.hashDid
    };
    const storeObject = await this.db.fickle.where(filter).first();
    if(this.trace) {
      console.log('DidStoreDocument::putFickle::storeObject=:<',storeObject,'>');
    }
    if(!storeObject) {  
      await this.db.fickle.put(didStore);
    }
  }
  async putTentative(didStore) {
    if(this.trace) {
      console.log('DidStoreDocument::putTentative::didStore=:<',didStore,'>');
    }
    const filter = {
      id: didStore.id,
      hashDid: didStore.hashDid
    };
    const storeObject = await this.db.tentative.where(filter).first();
    if(this.trace) {
      console.log('DidStoreDocument::putTentative::storeObject=:<',storeObject,'>');
    }
    if(!storeObject) { 
      await this.db.tentative.put(didStore);
    }
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

  async getAllTentative(address) {
    const didAddress = `did:otmc:${address}`;
    if(this.trace) {
      console.log('DidStoreDocument::getAllTentative::didAddress=:<',didAddress,'>');
    }
    const storeValuesJson = await this.getAllByDidAddress_(didAddress,this.db.tentative);
    if(this.trace) {
      console.log('DidStoreDocument::getAllTentative::storeValuesJson=:<',storeValuesJson,'>');
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
    const didAllJson = await this.getAllByDidAddress_(did,this.db.stable);
    if(this.trace) {
      console.log('DidStoreDocument::getControll::didAllJson=:<',didAllJson,'>');
    }
    const didControls = [];
    for(const didJson of didAllJson) {
      if(this.trace) {
        console.log('DidStoreDocument::getControll::didJson=:<',didJson,'>');
      }
      didControls.push(didJson.controller);
    }
    if(this.trace) {
      console.log('DidStoreDocument::getControll::didControls=:<',didControls,'>');
    }
    const flatControls = didControls.flat();
    if(this.trace) {
      console.log('DidStoreDocument::getControll::flatControls=:<',flatControls,'>');
    }
    const uniqueControls = [...new Set(flatControls)];
    if(this.trace) {
      console.log('DidStoreDocument::getControll::uniqueControls=:<',uniqueControls,'>');
    }
    return uniqueControls;
  }
  async getConcernDidAddress() {
    const storeValuesJson = [];
    const storeObjects = await this.db.stable.toArray();
    if(this.trace) {
      console.log('DidStoreDocument::getConcernDidAddress::storeObjects=:<',storeObjects,'>');
    }
    for(const storeValue of storeObjects) {
      const storeDid = JSON.parse(storeValue.origDid);
      storeValuesJson.push(storeDid);
    }
    const storeObjects2 = await this.db.fickle.toArray();
    if(this.trace) {
      console.log('DidStoreDocument::getConcernDidAddress::storeObjects2=:<',storeObjects2,'>');
    }
    for(const storeValue of storeObjects2) {
      const storeDid = JSON.parse(storeValue.origDid);
      storeValuesJson.push(storeDid);
    }
    if(this.trace) {
      console.log('DidStoreDocument::getConcernDidAddress::storeValuesJson=:<',storeValuesJson,'>');
    }
    const didAdresses = [];
    for(const didJson of storeValuesJson) {
      didAdresses.push(didJson.controller);
      didAdresses.push(didJson.id);
    }
    if(this.trace) {
      console.log('DidStoreDocument::getConcernDidAddress::didAdresses=:<',didAdresses,'>');
    }
    const uniquedDidAdresses = [...new Set(didAdresses.flat())];
    if(this.trace) {
      console.log('DidStoreDocument::getConcernDidAddress::uniquedDidAdresses=:<',uniquedDidAdresses,'>');
    }
    return uniquedDidAdresses;
  }
  async getHashListOfStable(didAddress) {
    if(this.trace) {
      console.log('DidStoreDocument::getHashListOfStable::did=:<',didAddress,'>');
    }
    const storeObjects = await this.db.stable.where('id').equals(didAddress).toArray();
    if(this.trace) {
      console.log('DidStoreDocument::getAllByDidAddress_::storeObjects=:<',storeObjects,'>');
    }
    const hashList = [];
    for(const storeValue of storeObjects) {
      if(this.trace) {
        console.log('DidStoreDocument::getHashListOfStable::storeValue=:<',storeValue,'>');
      }
      hashList.push(storeValue.hashDid);
    }
    if(this.trace) {
      console.log('DidStoreDocument::getHashListOfStable::hashList=:<',hashList,'>');
    }
    return hashList;
  }
  async getStableDidDocument (didUL,hashUL) {
    if(this.trace) {
      console.log('DidStoreDocument::getStableDidDocument::didUL=:<',didUL,'>');
      console.log('DidStoreDocument::getStableDidDocument::hashUL=:<',hashUL,'>');
    }
    const filter = {
      id: didUL,
      hashDid: hashUL
    };
    const storeObject = await this.db.stable.where(filter).first();
    if(this.trace) {
      console.log('DidStoreDocument::getStableDidDocument::storeObject=:<',storeObject,'>');
    }
    if(storeObject) {
      const storeDid = JSON.parse(storeObject.origDid);
      if(this.trace) {
        console.log('DidStoreDocument::getStableDidDocument::storeDid=:<',storeDid,'>');
      }
      return storeDid;
    } else {
      return null;
    }
  }
  async getTentativeAll () {
    const storeValuesJson = [];
    const storeObject = await this.db.tentative.toArray();
    if(this.trace) {
      console.log('DidStoreDocument::getTentativeDidDocument::storeObject=:<',storeObject,'>');
    }
    for(const storeValue of storeObject) {
      const storeDid = JSON.parse(storeValue.origDid);
      storeValuesJson.push(storeDid);
    }
    return storeValuesJson;
  }
  async moveTentative2Stable (moveDid) {
    if(this.trace) {
      console.log('DidStoreDocument::moveTentative2Stable::moveDid=:<',moveDid,'>');
    }
    const filter = {
      id: moveDid.id,
      hashDid: moveDid.hashDid
    };
    const storeObject1 = await this.db.stable.where(filter).first();
    if(!storeObject1) {
      await this.db.stable.put(moveDid);
    }
    await this.db.tentative.where('hashDid').equals(moveDid.hashDid).delete(); 
  }

  async getAnyDidDocument () {
    const storeValuesJson = [];
    const storeObject1 = await this.db.stable.toArray();
    if(this.trace) {
      console.log('DidStoreDocument::getAnyDidDocument::storeObject1=:<',storeObject1,'>');
    }
    for(const storeValue of storeObject1) {
      const storeDid = JSON.parse(storeValue.origDid);
      storeValuesJson.push(storeDid);
    }
    const storeObject2 = await this.db.fickle.toArray();
    if(this.trace) {
      console.log('DidStoreDocument::getAnyDidDocument::storeObject2=:<',storeObject2,'>');
    }
    for(const storeValue of storeObject2) {
      const storeDid = JSON.parse(storeValue.origDid);
      storeValuesJson.push(storeDid);
    }
    const storeObject3 = await this.db.tentative.toArray();
    if(this.trace) {
      console.log('DidStoreDocument::getAnyDidDocument::storeObject3=:<',storeObject3,'>');
    }
    for(const storeValue of storeObject3) {
      const storeDid = JSON.parse(storeValue.origDid);
      storeValuesJson.push(storeDid);
    }
    if(this.trace) {
      console.log('DidStoreDocument::getAnyDidDocument::storeValuesJson=:<',storeValuesJson,'>');
    }
    return storeValuesJson;
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
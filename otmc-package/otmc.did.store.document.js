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
      stable: '++autoId,did,controller,authentication,updated,hashDid,hashCore,b64Did'
    });
    this.db.version(this.version).stores({
      fickle: '++autoId,did,controller,authentication,updated,hashDid,hashCore,b64Did'
    });
    this.db.version(this.version).stores({
      tentative: '++autoId,did,controller,authentication,updated,hashDid,hashCore,b64Did'
    });
  }
  async putStable(didStore) {
    if(this.trace) {
      console.log('DidStoreDocument::putStable::didStore=:<',didStore,'>');
    }
    const filter = {
      did: didStore.did,
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
      did: didStore.did,
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
      did: didStore.did,
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
    storeValuesJson.push(await this.db.stable.toArray());
    storeValuesJson.push(await this.db.fickle.toArray());
    if(this.trace) {
      console.log('DidStoreDocument::getConcernDidAddress::storeValuesJson=:<',storeValuesJson,'>');
    }
    const storeValuesJsonFlat = storeValuesJson.flat();
    if(this.trace) {
      console.log('DidStoreDocument::getConcernDidAddress::storeValuesJsonFlat=:<',storeValuesJsonFlat,'>');
    }
    const didAdresses = [];
    for(const didJson of storeValuesJsonFlat) {
      didAdresses.push(didJson.controller);
      didAdresses.push(didJson.did);
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
      console.log('DidStoreDocument::getHashListOfStable::didAddress=:<',didAddress,'>');
    }
    const storeObjects = await this.db.stable.where('did').equals(didAddress).toArray();
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
      did: didUL,
      hashDid: hashUL
    };
    const storeObject = await this.db.stable.where(filter).first();
    if(this.trace) {
      console.log('DidStoreDocument::getStableDidDocument::storeObject=:<',storeObject,'>');
    }
    return storeObject;
  }
  async getTentativeAll () {
    const storeObjects = await this.db.tentative.toArray();
    if(this.trace) {
      console.log('DidStoreDocument::getTentativeDidDocument::storeObjects=:<',storeObjects,'>');
    }
    return storeObjects;
  }
  async moveTentative2Stable (moveDid) {
    if(this.trace) {
      console.log('DidStoreDocument::moveTentative2Stable::moveDid=:<',moveDid,'>');
    }
    const filter = {
      did: moveDid.did,
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
     storeValuesJson.push(await this.db.stable.toArray());
    storeValuesJson.push(await this.db.fickle.toArray());
    storeValuesJson.push(await this.db.tentative.toArray());
    if(this.trace) {
      console.log('DidStoreDocument::getAnyDidDocument::storeValuesJson=:<',storeValuesJson,'>');
    }
    const flatStoreValuesJson = storeValuesJson.flat();
    if(this.trace) {
      console.log('DidStoreDocument::getAnyDidDocument::flatStoreValuesJson=:<',flatStoreValuesJson,'>');
    }
    return flatStoreValuesJson;
  }  

  async getAllByDidAddress_(didAddress,storeCollection) {
    if(this.trace) {
      console.log('DidStoreDocument::getAllByDidAddress_::didAddress=:<',didAddress,'>');
    }
    const storeObjects = await storeCollection.where('did').equals(didAddress).toArray();
    if(this.trace) {
      console.log('DidStoreDocument::getAllByDidAddress_::storeObjects=:<',storeObjects,'>');
    }
    return storeObjects;
  }

  async getAllAuthMember_(authAddress,storeCollection) {
    const storeObjects = await storeCollection.toArray();
    if(this.trace) {
      console.log('DidStoreDocument::getAllAuthMember_::storeObjects=:<',storeObjects,'>');
    }
    const storeValuesJson = [];
    for(const storeValue of storeObjects) {
      if(this.isAuthMember_(storeValue,authAddress)){
        storeValuesJson.push(storeValue);
      }
    }
    if(this.trace) {
      console.log('DidStoreDocument::getAllAuthMember_::storeValuesJson=:<',storeValuesJson,'>');
    }
    return storeValuesJson;
  }
  isAuthMember_(storeValue,address) {
    if(this.trace) {
      console.log('DidStoreDocument::isAuthMember_::storeValue=:<',storeValue,'>');
      console.log('DidStoreDocument::isAuthMember_::address=:<',address,'>');
    }
    try {
      for(const auth of storeValue.authentication) {
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
}
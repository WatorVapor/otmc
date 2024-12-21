import Dexie from 'dexie';
import { StoreKey } from './otmc.const.js';
/**
*
*/
export class DidStoreTeamJoin {
  constructor() {
    this.version = '1.0';
    this.trace0 = true;
    this.trace1 = false;
    this.trace2 = false;
    this.trace = true;;
    this.debug = true;
    if(this.trace) {
      console.log('DidStoreTeamJoin::constructor::Dexie=:<',Dexie,'>');
    }
    this.db = new Dexie(StoreKey.open.did.join.dbName);
    this.db.version(this.version).stores({
      inProgress: '++autoId,did,control,hashCR,origCredReq'
    });
    this.db.version(this.version).stores({
      done: '++autoId,did,control,hashCR,origCredReq'
    });
    this.db.version(this.version).stores({
      tentative: '++autoId,did,control,hashCR,origCredReq'
    });
    this.db.version(this.version).stores({
      verified: '++autoId,did,control,hashCR,hashVC,origVC'
    });
    if(this.trace) {
      console.log('DidStoreTeamJoin::constructor::this.db=:<',this.db,'>');
    }
    if(this.trace) {
      console.log('DidStoreTeamJoin::constructor::this.db.inProgress=:<',this.db.inProgress,'>');
    }
    if(this.trace) {
      console.log('DidStoreTeamJoin::constructor::this.db.done=:<',this.db.done,'>');
    }
    if(this.trace) {
      console.log('DidStoreTeamJoin::constructor::this.db.verified=:<',this.db.verified,'>');
    }
  }

  async putCredReq(credReqStore) {
    if(this.trace) {
      console.log('DidStoreTeamJoin::putCredReq::credReqStore=:<',credReqStore,'>');
    }
    await this.db.inProgress.put(credReqStore);
  }

  async putTentativeCredReq(credReqStore) {
    if(this.trace) {
      console.log('DidStoreTeamJoin::putTentativeCredReq::credReqStore=:<',credReqStore,'>');
    }
    await this.db.tentative.put(credReqStore);
  }

  async getRequestTop(didAddress) {
    const didValuesJson = await this.getAll(didAddress);
    if(this.trace) {
      console.log('DidStoreTeamJoin::getRequestTop::didValuesJson=:<',didValuesJson,'>');
    }
    
    const sorted = didValuesJson.sort( this.compare_ );
    if(this.trace) {
      console.log('DidStoreTeamJoin::getRequestTop::sorted=:<',sorted,'>');
    }
    if(sorted.length > 0) {
      return sorted[0];
    } else {
      return null;
    }
  }
  async getInProgressOfAddress(didAddress) {
    const asign2Me = await this.db.inProgress.where('control').equals(didAddress).toArray();
    if(this.trace) {
      console.log('DidStoreTeamJoin::getInProgressOfAddress::asign2Me=:<',asign2Me,'>');
    }
    const storeValuesJson = {};
    for(const storeReq of asign2Me) {
      if(this.trace) {
        console.log('DidStoreTeamJoin::getInProgressOfAddress::storeReq=:<',storeReq,'>');
      }
      const storeKey = storeReq.hashCR;
      const storeValueStr = storeReq.origCredReq;
      const storeValue = JSON.parse(storeValueStr);
      if(this.trace) {
        console.log('DidStoreTeamJoin::getInProgressOfAddress::storeValue=:<',storeValue,'>');
      }
      storeValuesJson[storeKey] = storeValue;
    }
    if(this.trace) {
      console.log('DidStoreTeamJoin::getInProgressOfAddress::storeValuesJson=:<',storeValuesJson,'>');
    }
    return storeValuesJson;
  }

  async getInProgressAny() {
    const asign2Any = await this.db.inProgress.toArray();
    if(this.trace) {
      console.log('DidStoreTeamJoin::getInProgressAny::asign2Any=:<',asign2Any,'>');
    }
    const storeValuesJson = {};
    for(const storeReq of asign2Any) {
      if(this.trace) {
        console.log('DidStoreTeamJoin::getInProgressAny::storeReq=:<',storeReq,'>');
      }
      const storeKey = storeReq.hashCR;
      const storeValueStr = storeReq.origCredReq;
      const storeValue = JSON.parse(storeValueStr);
      if(this.trace) {
        console.log('DidStoreTeamJoin::getInProgressAny::storeValue=:<',storeValue,'>');
      }
      storeValuesJson[storeKey] = storeValue;
    }
    if(this.trace) {
      console.log('DidStoreTeamJoin::getInProgressAny::storeValuesJson=:<',storeValuesJson,'>');
    }
    return storeValuesJson;
  }
  
  async getJoinCredRequest(storeHash) {
    const storeRequest = await this.db.inProgress.where('hashCR').equals(storeHash).first();
    if(this.trace) {
      console.log('DidStoreTeamJoin::getJoinCredRequest::storeRequest=:<',storeRequest,'>');
    }
    const storeValueStr = storeRequest.origCredReq;
    const storeValue = JSON.parse(storeValueStr);
    return storeValue;
  }
  async putVerifiableCredential(vcStore) {
    if(this.trace) {
      console.log('DidStoreTeamJoin::putVerifiableCredential::vcStore=:<',vcStore,'>');
    }
    const result = await this.db.verified.put(vcStore);
    if(this.trace) {
      console.log('DidStoreTeamJoin::putVerifiableCredential::result=:<',result,'>');
    }
    return result;
  }
  async moveJoinCredRequest2Done(storeHash) {
    const storeRequest = await this.db.inProgress.where('hashCR').equals(storeHash).first();
    if(this.trace) {
      console.log('DidStoreTeamJoin::moveJoinCredRequest2Done::storeRequest=:<',storeRequest,'>');
    }
    await this.db.done.put(storeRequest);
    await this.db.inProgress.where('hashCR').equals(storeHash).delete();
  }
  async getHashListOfJoin(didAddress) {
    if(this.trace) {
      console.log('DidStoreTeamJoin::getHashListOfJoin::didAddress=:<',didAddress,'>');
    }
    const hashList = [];
    const store1Objects = await this.db.inProgress.where('did').equals(didAddress).toArray();
    if(this.trace) {
      console.log('DidStoreTeamJoin::getHashListOfJoin::store1Objects=:<',store1Objects,'>');
    }
    for(const storeObject of store1Objects) {
      if(this.trace) { 
        console.log('DidStoreTeamJoin::getHashListOfJoin::storeObject=:<',storeObject,'>');
      }
      hashList.push(storeObject.hashCR);
    }
    const store2Objects = await this.db.done.where('did').equals(didAddress).toArray();
    if(this.trace) {
      console.log('DidStoreTeamJoin::getHashListOfJoin::store2Objects=:<',store2Objects,'>');
    }
    for(const storeObject of store2Objects) {
      if(this.trace) { 
        console.log('DidStoreTeamJoin::getHashListOfJoin::storeObject=:<',storeObject,'>');
      }
      hashList.push(storeObject.hashCR);
    }
    const store3Objects = await this.db.verified.where('did').equals(didAddress).toArray();
    if(this.trace) {
      console.log('DidStoreTeamJoin::getHashListOfJoin::store3Objects=:<',store3Objects,'>');
    }
    for(const storeObject of store3Objects) {
      if(this.trace) { 
        console.log('DidStoreTeamJoin::getHashListOfJoin::storeObject=:<',storeObject,'>');
      }
      hashList.push(storeObject.hashCR);
    }
    const store4Objects = await this.db.tentative.where('did').equals(didAddress).toArray();
    if(this.trace) {
      console.log('DidStoreTeamJoin::getHashListOfJoin::store3Objects=:<',store3Objects,'>');
    }
    for(const storeObject of store4Objects) {
      if(this.trace) { 
        console.log('DidStoreTeamJoin::getHashListOfJoin::storeObject=:<',storeObject,'>');
      }
      hashList.push(storeObject.hashCR);
    }
    if(this.trace) {
      console.log('DidStoreTeamJoin::getHashListOfJoin::hashList=:<',hashList,'>');
    }
    return hashList;
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

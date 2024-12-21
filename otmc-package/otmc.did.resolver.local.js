import { DidStoreDocument } from './otmc.did.store.document.js';
import { DidStoreTeamJoin } from './otmc.did.store.team.join.js';
import { StoreKey } from './otmc.const.js';

export class DidResolverLocalStore {
  constructor(wrapper) {
    this.trace = true;;
    this.debug = true;
    this.auth = wrapper.auth;
    this.otmc = wrapper.otmc;
    this.base32 = wrapper.base32;
    this.util = wrapper.util;

    this.didDocLS = new DidStoreDocument(StoreKey.open.did.document);
    this.joinStoreLS = new DidStoreTeamJoin();
  }

  async resolver(keyAddress){
    if(this.trace) {
      console.log('DidResolverLocalStore::resolver::keyAddress=:<',keyAddress,'>');
    }
    const didValuesJson = await this.didDocLS.getAllStable(keyAddress);
    if(this.trace) {
      console.log('DidResolverLocalStore::resolver::didValuesJson=:<',didValuesJson,'>');
    }
    const didValuesSorted = didValuesJson.sort((a,b) => new Date(b.updated) - new Date(a.updated));
    if(this.trace) {
      console.log('DidResolverLocalStore::resolver::didValuesSorted=:<',didValuesSorted,'>');
    }
    if(didValuesSorted.length > 0) {
      return didValuesSorted[0];
    }
    const didMemberValuesJson = await this.didDocLS.getMemberAllStable(keyAddress);
    if(this.trace) {
      console.log('DidResolverLocalStore::resolver::didMemberValuesJson=:<',didMemberValuesJson,'>');
    }
    const didMemberValuesSorted = didMemberValuesJson.sort((a,b) => new Date(b.updated) - new Date(a.updated));
    if(this.trace) {
      console.log('DidResolverLocalStore::resolver::didMemberValuesSorted=:<',didMemberValuesSorted,'>');
    }
    if(didMemberValuesSorted.length > 0) {
      return didMemberValuesSorted[0];
    }

    const didValuesJsonFickle = await this.didDocLS.getAllFickle(keyAddress);
    if(this.trace) {
      console.log('DidResolverLocalStore::resolver::didValuesJsonFickle=:<',didValuesJsonFickle,'>');
    }
    const didValuesFickleSorted = didValuesJsonFickle.sort((a,b) => new Date(b.updated) - new Date(a.updated));
    if(this.trace) {
      console.log('DidResolverLocalStore::resolver::didValuesFickleSorted=:<',didValuesFickleSorted,'>');
    }
    if(didValuesFickleSorted.length > 0) {
      return didValuesFickleSorted[0];
    }

    const didMemberValuesJsonFickle = await this.didDocLS.getMemberAllFickle(keyAddress);
    if(this.trace) {
      console.log('DidResolverLocalStore::resolver::didMemberValuesJsonFickle=:<',didMemberValuesJsonFickle,'>');
    }
    const didMemberValuesFickleSorted = didMemberValuesJsonFickle.sort((a,b) => new Date(b.updated) - new Date(a.updated));
    if(this.trace) {
      console.log('DidResolverLocalStore::resolver::didMemberValuesFickleSorted=:<',didMemberValuesFickleSorted,'>');
    }
    if(didMemberValuesFickleSorted.length > 0) {
      return didMemberValuesFickleSorted[0];
    }

    return null;
  }
  async getDidDocumentAll(keyAddress){
    if(this.trace) {
      console.log('DidResolverLocalStore::resolver::keyAddress=:<',keyAddress,'>');
    }
    const didValuesJson = await this.didDocLS.getAllStable(keyAddress);
    if(this.trace) {
      console.log('DidResolverLocalStore::resolver::didValuesJson=:<',didValuesJson,'>');
    }
    return didValuesJson;
  }
  async storeStableDid(storeDid){
    this.didDocLS.putStable(storeDid);
  }
  async storeFickleDid(storeDid){
    this.didDocLS.putFickle(storeDid);
  }
  async storeCredentialRequest(did,credReq){
    if(this.trace) {
      console.log('DidResolverLocalStore::storeCredentialRequest::credReq=:<',credReq,'>');
    }
    const credReqStr = JSON.stringify(credReq);
    const credReqStore = {
      did:did,
      hashCR:this.util.calcAddress(credReqStr),
      origCredReq:credReqStr
    }
    let holders = []
    if(credReq.holder.length < 1){
      holders = await this.didDocLS.getControll(did);
      if(this.trace) {
        console.log('DidResolverLocalStore::storeCredentialRequest::holders=:<',holders,'>');
      }
    } else {
      holders = credReq.holder;
    }
    if(this.trace) {
      console.log('DidResolverLocalStore::storeCredentialRequest::holders=:<',holders,'>');
    }
    for(const holder of holders) {
      credReqStore.control = holder;
      await this.joinStoreLS.putCredReq(credReqStore);
    }
  }
  async getJoinInProgress(didAddress){
    if(this.trace) {
      console.log('DidResolverLocalStore::getJoinInProgress::didAddress=:<',didAddress,'>');
    }
    const joinList = await this.joinStoreLS.getInProgressOfAddress(didAddress);
    if(this.trace) {
      console.log('DidResolverLocalStore::getJoinInProgress::joinList=:<',joinList,'>');
    }
    return joinList;
  }
  async getJoinCredRequest(storeHash){
    if(this.trace) {
      console.log('DidResolverLocalStore::getJoinCredRequest::storeHash=:<',storeHash,'>');
    }
    const credReq = await this.joinStoreLS.getJoinCredRequest(storeHash);
    if(this.trace) {
      console.log('DidResolverLocalStore::getJoinCredRequest::credReq=:<',credReq,'>');
    }
    return credReq;
  }
  async markDoneJoinCredRequest(storeHash){
    if(this.trace) {
      console.log('DidResolverLocalStore::markDoneJoinCredRequest::storeHash=:<',storeHash,'>');
    }
    const markResult = await this.joinStoreLS.moveJoinCredRequest2Done(storeHash);
    if(this.trace) {
      console.log('DidResolverLocalStore::markDoneJoinCredRequest::markResult=:<',markResult,'>');
    }
    return markResult;
  }  
  
  async storeJoinVerifiableCredential(didVC) {
    if(this.trace) {
      console.log('DidResolverLocalStore::storeJoinVerifiableCredential::didVC=:<',didVC,'>');
    }
    const didVCStr = JSON.stringify(didVC);
    const vcStore = {
      did:didVC.credentialSubject.did.id,
      control:didVC.credentialSubject.did.controller,
      hashCR:didVC.id,
      hashVC:this.util.calcAddress(didVCStr),
      origVC:didVCStr
    }
    if(this.trace) {
      console.log('DidResolverLocalStore::storeJoinVerifiableCredential::vcStore=:<',vcStore,'>');
    }
    const resultStore = await this.joinStoreLS.putVerifiableCredential(vcStore);
    if(this.trace) {
      console.log('DidResolverLocalStore::storeJoinVerifiableCredential::resultStore=:<',resultStore,'>');
    }
    return resultStore;
  }
}

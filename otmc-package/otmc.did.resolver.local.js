import { DidStoreDocument } from './otmc.did.store.document.js';
import { DidStoreManifest } from './otmc.did.store.manifest.js';
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
    this.manifestLS = new DidStoreManifest(StoreKey.open.did.manifest);
    this.joinStoreLS = new DidStoreTeamJoin();
  }

  async resolver(keyAddress){
    if(this.trace) {
      console.log('DidResolverLocalStore::resolver::keyAddress=:<',keyAddress,'>');
    }
    const didValuesJson = await this.didDocLS.getAll(keyAddress);
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
    return null;
  }
  async getDidDocumentAll(keyAddress){
    if(this.trace) {
      console.log('DidResolverLocalStore::resolver::keyAddress=:<',keyAddress,'>');
    }
    const didValuesJson = await this.didDocLS.getAll(keyAddress);
    if(this.trace) {
      console.log('DidResolverLocalStore::resolver::didValuesJson=:<',didValuesJson,'>');
    }
    return didValuesJson;
  }
  async storeDid(storeDid){
    this.didDocLS.putDid(storeDid);
  }
  async manifest(didAddress){
    if(this.trace) {
      console.log('DidResolverLocalStore::manifest::didAddress=:<',didAddress,'>');
    }
    const manifestValuesJson = await this.manifestLS.getAll(didAddress);
    if(this.trace) {
      console.log('DidResolverLocalStore::manifest::manifestValuesJson=:<',manifestValuesJson,'>');
    }
    if(manifestValuesJson.length > 0) {
      return manifestValuesJson[0];
    }
    return null;
  }
  async storeManifest(storeManifest){
    this.manifestLS.putManifest(storeManifest);
  }
  async manifestAll(didAddress){
    if(this.trace) {
      console.log('DidResolverLocalStore::manifestAll::didAddress=:<',didAddress,'>');
    }
    const manifestValuesJson = await this.manifestLS.getAll(didAddress);
    if(this.trace) {
      console.log('DidResolverLocalStore::manifest::manifestValuesJson=:<',manifestValuesJson,'>');
    }
    return manifestValuesJson;
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
    for(const holder of credReq.holder) {
      credReqStore.control = holder;
      await this.joinStoreLS.putCredReq(credReqStore);
    }
  }
  async getJoinInProgress(didAddress){
    if(this.trace) {
      console.log('DidResolverLocalStore::getJoinInProgress::didAddress=:<',didAddress,'>');
    }
    const joinList = await this.joinStoreLS.getInProgressAll(didAddress);
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

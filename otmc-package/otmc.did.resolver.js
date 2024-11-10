import { DidResolverLocalStore } from './otmc.did.resolver.local.js';
import { DidResolverSyncWebStore } from './otmc.did.resolver.web.js';

import { StoreKey } from './otmc.const.js';

const LEVEL_OPT = {
  keyEncoding: 'utf8',
  valueEncoding: 'utf8',
};

/**
*
*/
export class DidResolver {
  constructor(eeInternal) {
    this.trace = true;;
    this.debug = true;
    this.eeInternal = eeInternal;
    this.ListenEventEmitter_();
  }
  ListenEventEmitter_() {
    if(this.trace) {
      console.log('DidResolver::ListenEventEmitter_::this.eeInternal=:<',this.eeInternal,'>');
    }
    const self = this;
    this.eeInternal.on('sys.authKey.ready',(evt)=>{
      if(self.trace) {
        console.log('DidResolver::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.auth = evt.auth;
      self.otmc = evt.otmc;
      self.base32 = evt.base32;
      self.util = evt.util;
      self.localStore = new DidResolverLocalStore(evt);
    });
    this.eeInternal.on('webwoker.resolver.worker',(evt)=>{
      if(self.trace) {
        console.log('DidResolver::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.worker = evt.worker;
      self.webStore = new DidResolverSyncWebStore(self.eeInternal,self.worker);
    });
  }

  async resolver(keyAddress){
    if(this.trace) {
      console.log('DidResolver::resolver::keyAddress=:<',keyAddress,'>');
    }
    const localDidDoc = await this.localStore.resolver(keyAddress);
    if(this.trace) {
      console.log('DidResolver::resolver::localDidDoc=:<',localDidDoc,'>');
    }
    const didAddress = `did:otmc:${keyAddress}`;
    if(this.trace) {
      console.log('DidResolver::resolver::didAddress=:<',didAddress,'>');
    }
    return localDidDoc;
  }

  async getDidDocumentAll(keyAddress){
    if(this.trace) {
      console.log('DidResolver::getDidDocumentAll::keyAddress=:<',keyAddress,'>');
    }
    const localDidDoc = await this.localStore.getDidDocumentAll(keyAddress);
    if(this.trace) {
      console.log('DidResolver::getDidDocumentAll::localDidDoc=:<',localDidDoc,'>');
    }
    const didAddress = `did:otmc:${keyAddress}`;
    if(this.trace) {
      console.log('DidResolver::getDidDocumentAll::didAddress=:<',didAddress,'>');
    }
    return localDidDoc;
  }

  async storeStableDid(documentObj){
    const documentStr = JSON.stringify(documentObj);
    const storeDoc = {
      id:documentObj.id,
      updated:documentObj.updated,
      hashDid:this.util.calcAddress(documentStr),
      origDid:documentStr
    }
    this.localStore.storeStableDid(storeDoc);
  }
  async storeFickleDid(documentObj){
    const documentStr = JSON.stringify(documentObj);
    const storeDoc = {
      id:documentObj.id,
      updated:documentObj.updated,
      hashDid:this.util.calcAddress(documentStr),
      origDid:documentStr
    }
    this.localStore.storeFickleDid(storeDoc);
  }

  async manifest(didAddress){
    if(this.trace) {
      console.log('DidResolver::manifest::didAddress=:<',didAddress,'>');
    }
    const localManifest = await this.localStore.manifest(didAddress);
    if(this.trace) {
      console.log('DidResolver::manifest::localManifest=:<',localManifest,'>');
    }
    if(this.trace) {
      console.log('DidResolver::manifest::didAddress=:<',didAddress,'>');
    }
    return localManifest;
  }
  async storeManifest(manifestObj,did){
    if(this.trace) {
      console.log('DidResolver::storeManifest::did=:<',did,'>');
    }
    const manifestStr = JSON.stringify(manifestObj);
    const manifestStore = {
      did:did,
      hash:this.util.calcAddress(manifestStr),
      origManifest:manifestStr
    }
    this.localStore.storeManifest(manifestStore);
  }
  async manifestAll(didAddress){
    if(this.trace) {
      console.log('DidResolver::manifestAll::didAddress=:<',didAddress,'>');
    }
    const localManifest = await this.localStore.manifestAll(didAddress);
    if(this.trace) {
      console.log('DidResolver::manifestAll::localManifest=:<',localManifest,'>');
    }
    if(this.trace) {
      console.log('DidResolver::manifestAll::didAddress=:<',didAddress,'>');
    }
    return localManifest;
  }

  async storeCredentialRequest(credReqObj,reqDid){
    if(this.trace) {
      console.log('DidResolver::storeCredentialRequest::reqDid=:<',reqDid,'>');
    }
    if(this.trace) {
      console.log('DidResolver::storeCredentialRequest::credReqObj=:<',credReqObj,'>');
    }
    this.localStore.storeCredentialRequest(reqDid,credReqObj);
  }

  async getJoinInProgress(didAddress){
    if(this.trace) {
      console.log('DidResolver::getJoinInProgress::didAddress=:<',didAddress,'>');
    }
    const jointList = await this.localStore.getJoinInProgress(didAddress);
    if(this.trace) {
      console.log('DidResolver::getJoinInProgress::jointList=:<',jointList,'>');
    }
    return jointList;
  }
  async getJoinCredRequest(storeHash){
    if(this.trace) {
      console.log('DidResolver::getJoinCredRequest::storeHash=:<',storeHash,'>');
    }
    const credReq = await this.localStore.getJoinCredRequest(storeHash);
    if(this.trace) {
      console.log('DidResolver::getJoinCredRequest::credReq=:<',credReq,'>');
    }
    return credReq;
  }
  async markDoneJoinCredRequest(storeHash){
    if(this.trace) {
      console.log('DidResolver::markDoneJoinCredRequest::storeHash=:<',storeHash,'>');
    }
    const markResult = await this.localStore.markDoneJoinCredRequest(storeHash);
    if(this.trace) {
      console.log('DidResolver::markDoneJoinCredRequest::markResult=:<',markResult,'>');
    }
    return markResult;
  }  
  
  async storeJoinVerifiableCredential(didVC) {
    if(this.trace) {
      console.log('DidResolver::storeJoinVerifiableCredential::didVC=:<',didVC,'>');
    }
    const resultStore = await this.localStore.storeJoinVerifiableCredential(didVC);
    if(this.trace) {
      console.log('DidResolver::storeJoinVerifiableCredential::resultStore=:<',resultStore,'>');
    }
    return resultStore;
  }
}

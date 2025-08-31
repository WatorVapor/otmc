import { DidResolverLocalStore } from './otmc.did.resolver.local.js';
import { DidResolverSyncWebStore } from './otmc.did.resolver.web.js';

const LEVEL_OPT = {
  keyEncoding: 'utf8',
  valueEncoding: 'utf8',
};

/**
*
*/
export class DidResolver {
  constructor(eeInternal) {
    this.trace = true;
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
    const coreDocObj = JSON.parse(documentStr);
    delete coreDocObj.proof;
    const coreDocStr = JSON.stringify(coreDocObj);
    const storeDoc = {
      did:documentObj.id,
      controller:documentObj.controller,
      authentication:documentObj.authentication,
      updated:documentObj.updated,
      hashDid:this.util.calcAddress(documentStr),
      hashCore:this.util.calcAddress(coreDocStr),
      b64Did:this.util.encodeBase64Str(documentStr),
      didDocument:documentObj
    }
    this.localStore.storeStableDid(storeDoc);
  }
  async storeFickleDid(documentObj){
    const documentStr = JSON.stringify(documentObj);
    const coreDocObj = JSON.parse(documentStr);
    delete coreDocObj.proof;
    const coreDocStr = JSON.stringify(coreDocObj);
    const storeDoc = {
      did:documentObj.id,
      controller:documentObj.controller,
      authentication:documentObj.authentication,
      updated:documentObj.updated,
      hashDid:this.util.calcAddress(documentStr),
      hashCore:this.util.calcAddress(coreDocStr),
      b64Did:this.util.encodeBase64Str(documentStr),
      didDocument:documentObj
    }
    this.localStore.storeFickleDid(storeDoc);
  }

  async storeBuzzerDid(documentObj){
    const documentStr = JSON.stringify(documentObj);
    const coreDocObj = JSON.parse(documentStr);
    delete coreDocObj.proof;
    const coreDocStr = JSON.stringify(coreDocObj);
    const storeDoc = {
      did:documentObj.id,
      controller:documentObj.controller,
      authentication:documentObj.authentication,
      updated:documentObj.updated,
      hashDid:this.util.calcAddress(documentStr),
      hashCore:this.util.calcAddress(coreDocStr),
      b64Did:this.util.encodeBase64Str(documentStr),
      didDocument:documentObj
    }
    this.localStore.storeBuzzerDid(storeDoc);
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
  async getController(did) {
    if(this.trace) {
      console.log('DidResolver::getController::did=:<',did,'>');
    }
    const ctrlDid = await this.localStore.getController(did);
    if(this.trace) {
      console.log('DidResolver::getController::ctrlDid=:<',ctrlDid,'>');
    }
    return ctrlDid;
  }
}

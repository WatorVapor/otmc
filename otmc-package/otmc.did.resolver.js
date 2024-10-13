import {
  DidStoreDocument,
  DidStoreManifest
} from './otmc.did.document.store.js';
import {
  DidStoreTeamJoin
} from './otmc.did.store.team.join.js';

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
      self.webStore = new DidResolverWebStore(evt);
    });
    this.eeInternal.on('webwoker.resolver.worker',(evt)=>{
      if(self.trace) {
        console.log('DidResolver::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.worker = evt.worker;
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
    try {
      const webDidDoc = await this.webStore.resolver(didAddress);
      if(this.trace) {
        console.log('DidResolver::resolver::webDidDoc=:<',webDidDoc,'>');
      }
      const didDoc = localDidDoc || webDidDoc;
      return didDoc;
    } catch(err) {
      console.log('DidResolver::resolver::err=:<',err,'>');
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
    try {
      const webDidDoc = await this.webStore.getDidDocumentAll(didAddress);
      if(this.trace) {
        console.log('DidResolver::getDidDocumentAll::webDidDoc=:<',webDidDoc,'>');
      }
      const didDoc = localDidDoc || webDidDoc;
      return didDoc;
    } catch(err) {
      console.log('DidResolver::getDidDocumentAll::err=:<',err,'>');
    }
    return localDidDoc;
  }

  async storeDid(documentObj){
    const documentStr = JSON.stringify(documentObj);
    const storeKey = `${documentObj.id}.${this.util.calcAddress(documentStr)}`;
    this.localStore.storeDid(storeKey,documentStr);
    this.webStore.storeDid(documentObj);
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
    try {
      const webManifest = await this.webStore.manifest(didAddress);
      if(this.trace) {
        console.log('DidResolver::manifest::webManifest=:<',webManifest,'>');
      }
      const manifest = localManifest || webManifest;
      return manifest;
    } catch(err) {
      console.log('DidResolver::manifest::err=:<',err,'>');
    }
    return localManifest;
  }
  async storeManifest(manifestObj,did){
    if(this.trace) {
      console.log('DidResolver::storeManifest::did=:<',did,'>');
    }
    const manifestStr = JSON.stringify(manifestObj);
    const storeKey = `${did}.${this.util.calcAddress(manifestStr)}`;
    if(this.trace) {
      console.log('DidResolver::storeManifest::storeKey=:<',storeKey,'>');
    }
    this.localStore.storeManifest(storeKey,manifestStr);
    this.webStore.storeManifest(manifestObj,did);
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
    try {
      const webManifest = await this.webStore.manifestAll(didAddress);
      if(this.trace) {
        console.log('DidResolver::manifestAll::webManifest=:<',webManifest,'>');
      }
      const manifest = localManifest || webManifest;
      return manifest;
    } catch(err) {
      console.log('DidResolver::manifestAll::err=:<',err,'>');
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
}


class DidResolverLocalStore {
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

  async storeDid(storeKey,didDocStr){
    this.didDocLS.put(storeKey, didDocStr, LEVEL_OPT,(err)=>{
      if(this.trace) {
        console.log('DidResolverLocalStore::storeDid::err=:<',err,'>');
      }
    });
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
  async storeManifest(storeKey,manifestStr){
    this.manifestLS.put(storeKey, manifestStr, LEVEL_OPT,(err)=>{
      if(this.trace) {
        console.log('DidResolverLocalStore::storeManifest::err=:<',err,'>');
      }
    });
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
      await this.joinStoreLS.addCredReq(credReqStore);
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
}

const context = 'https://otmc.wator.xyz/ns/did';
class DidResolverWebStore {
  constructor(wrapper) {
    this.trace = true;;
    this.debug = true;
    this.auth = wrapper.auth;
    this.otmc = wrapper.otmc;
    this.base32 = wrapper.base32;
    this.util = wrapper.util;
  }

  async resolver(didAddress){
    if(this.trace) {
      console.log('DidResolverWebStore::resolver::didAddress=:<',didAddress,'>');
    }
    const didDoc = await this.requestAPI_(didAddress);
    return didDoc;
  }
  async getDidDocumentAll(didAddress){
    if(this.trace) {
      console.log('DidResolverWebStore::getDidDocumentAll::didAddress=:<',didAddress,'>');
    }
    const didDoc = await this.requestAPI_(`${didAddress}?all=true`);
    return didDoc;
  }
  async storeDid(didDoc){
    if(this.trace) {
      console.log('DidResolverWebStore::storeDid::didDoc=:<',didDoc,'>');
    }
    const apiPath = `document/upload/${didDoc.id}`
    if(this.trace) {
      console.log('DidResolverWebStore::storeDid::apiPath=:<',apiPath,'>');
    }
    const didDocSigned =this.auth.sign({did:didDoc});
    if(this.trace) {
      console.log('DidResolverWebStore::storeDid::didDocSigned=:<',didDocSigned,'>');
    }
    const result = await this.postAPI_(apiPath,didDocSigned);
    return result;
  }
  async manifest(didAddress){
    if(this.trace) {
      console.log('DidResolverWebStore::manifest::didAddress=:<',didAddress,'>');
    }
    const manifest = await this.requestAPI_(`manifest/${didAddress}`);
    return manifest;
  }
  async manifestAll(didAddress){
    if(this.trace) {
      console.log('DidResolverWebStore::manifestAll::didAddress=:<',didAddress,'>');
    }
    const manifest = await this.requestAPI_(`manifest/${didAddress}?all=true`);
    return manifest;
  }

  async storeManifest(manifest,did){
    if(this.trace) {
      console.log('DidResolverWebStore::storeManifest::manifest=:<',manifest,'>');
    }
    const apiPath = `manifest/upload/${did}`
    if(this.trace) {
      console.log('DidResolverWebStore::storeManifest::apiPath=:<',apiPath,'>');
    }
    const manifestSigned =this.auth.sign({manifest:manifest});
    if(this.trace) {
      console.log('DidResolverWebStore::storeManifest::manifestSigned=:<',manifestSigned,'>');
    }
    const result = await this.postAPI_(apiPath,manifestSigned);
    return result;
  }
  async requestAPI_(apiPath) {
    const reqURl =`${context}/v1/${apiPath}`;
    if(this.trace) {
      console.log('DidResolverWebStore::requestAPI_::reqURl=:<',reqURl,'>');
    }
    const reqHeader = new Headers();
    reqHeader.append('Content-Type', 'application/json');
    const authToken = this.accessToken_();
    reqHeader.append('Authorization', `Bearer ${authToken}`);
    //const reqBody = {};
    const reqOption = {
      method: 'GET',
      //body:reqBody,
      headers:reqHeader
    };
    const apiReq = new Request(reqURl, reqOption);
    if(this.trace) {
      console.log('DidResolverWebStore::requestAPI_::apiReq=:<',apiReq,'>');
    }
    const apiResp = await fetch(apiReq);
    if(this.trace) {
      console.log('DidResolverWebStore::requestAPI_::apiResp=:<',apiResp,'>');
    }
    const resultJson = await apiResp.json();
    if(this.trace) {
      console.log('DidResolverWebStore::requestAPI_::resultJson=:<',resultJson,'>');
    }
    return resultJson;
  }
  async postAPI_(apiPath,reqBody) {
    const reqURl =`${context}/v1/${apiPath}`;
    if(this.trace) {
      console.log('DidResolverWebStore::postAPI_::reqURl=:<',reqURl,'>');
    }
    const reqHeader = new Headers();
    reqHeader.append('Content-Type', 'application/json');
    const authToken = this.accessToken_();
    reqHeader.append('Authorization', `Bearer ${authToken}`);
    const reqOption = {
      method: 'POST',
      body:JSON.stringify(reqBody),
      headers:reqHeader
    };
    const apiReq = new Request(reqURl, reqOption);
    if(this.trace) {
      console.log('DidResolverWebStore::postAPI_::apiReq=:<',apiReq,'>');
    }
    const apiResp = await fetch(apiReq);
    if(this.trace) {
      console.log('DidResolverWebStore::postAPI_::apiResp=:<',apiResp,'>');
    }
    const resultJson = await apiResp.json();
    if(this.trace) {
      console.log('DidResolverWebStore::postAPI_::resultJson=:<',resultJson,'>');
    }
    return resultJson;
  }
  accessToken_() {
    if(this.trace) {
      console.log('DidResolverWebStore::accessToken_::this.auth=:<',this.auth,'>');
    }
    const token = {};
    const signedToken = this.auth.sign(token);
    if(this.trace) {
      console.log('DidResolverWebStore::accessToken_::signedToken=:<',signedToken,'>');
    }
    const tokenB64 = this.util.encodeBase64Str(JSON.stringify(signedToken));
    if(this.trace) {
      console.log('DidResolverWebStore::accessToken_::tokenB64=:<',tokenB64,'>');
    }
    return tokenB64;
  }
}
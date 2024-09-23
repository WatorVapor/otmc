import {
  DidStoreDocument,
  DidStoreManifest,
  DidStoreJoin
} from './otmc.did.document.store.js';
import { StoreKey } from './otmc.const.js';

const context = 'https://otmc.wator.xyz/ns/did';
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
      self.localStore = new DidResolverLocalStore();
      self.webStore = new DidResolverWebStore();
    });
  }

  async resolver(didAddress){
    if(this.trace) {
      console.log('DidResolver::resolver::didAddress=:<',didAddress,'>');
    }
    const didDoc = await this.webStore(didAddress);
    if(this.trace) {
      console.log('DidResolver::resolver::didDoc=:<',didDoc,'>');
    }
  }
  async storeDid(storeKey,didDocStr){
    this.localStore.storeDid(storeKey,didDocStr)
  }
  async storeManifest(storeKey,manifestStr){
    this.localStore.storeManifest(storeKey,manifestStr)
  }
}


class DidResolverLocalStore {
  constructor() {
    this.trace = true;;
    this.debug = true;
    this.didDocLS = new DidStoreDocument(StoreKey.open.did.document);
    this.manifestLS = new DidStoreManifest(StoreKey.open.did.manifest);
    this.joinStore = new DidStoreJoin(StoreKey.open.did.joinReq);
  }

  async resolver(didAddress){
    if(this.trace) {
      console.log('DidResolverLocalStore::resolver::didAddress=:<',didAddress,'>');
    }
    //const didDoc = await this.requestAPI_(didAddress);
    
    //return didDoc;
  }
  async storeDid(storeKey,didDocStr){
    this.didDocLS.put(storeKey, didDocStr, LEVEL_OPT,(err)=>{
      if(this.trace) {
        console.log('DidResolverLocalStore::storeDid::err=:<',err,'>');
      }
    });
  }
  async storeManifest(storeKey,manifestStr){
    this.manifestLS.put(storeKey, manifestStr, LEVEL_OPT,(err)=>{
      if(this.trace) {
        console.log('DidResolverLocalStore::storeManifest::err=:<',err,'>');
      }
    });
  }
}

 class DidResolverWebStore {
  constructor(ee) {
    this.trace = true;;
    this.debug = true;
  }

  async resolver(didAddress){
    if(this.trace) {
      console.log('DidResolver::resolver::didAddress=:<',didAddress,'>');
    }
  }
  async storeDid(storeKey,didDocStr){
  }
  async storeManifest(storeKey,manifestStr){
  }
  async requestAPI_(apiPath) {
    const reqURl =`${context}/v1/${apiPath}`;
    if(this.trace) {
      console.log('DidResolver::requestAPI_::reqURl=:<',reqURl,'>');
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
      console.log('DidResolver::requestAPI_::apiReq=:<',apiReq,'>');
    }
    const apiResp = await fetch(apiReq);
    if(this.trace) {
      console.log('DidResolver::requestAPI_::apiResp=:<',apiResp,'>');
    }
    const resultJson = await apiResp.json();
    if(this.trace) {
      console.log('DidResolver::requestAPI_::resultJson=:<',resultJson,'>');
    }
    return resultJson;
  }
  async postAPI_(apiPath) {
    const reqURl =`${context}/v1/${apiPath}`;
    if(this.trace) {
      console.log('DidResolver::postAPI_::reqURl=:<',reqURl,'>');
    }
    const reqHeader = new Headers();
    reqHeader.append('Content-Type', 'application/json');
    const authToken = this.accessToken_();
    reqHeader.append('Authorization', `Bearer ${authToken}`);
    const reqBody = {};
    const reqOption = {
      method: 'POST',
      body:reqBody,
      headers:reqHeader
    };
    const apiReq = new Request(reqURl, reqOption);
    if(this.trace) {
      console.log('DidResolver::postAPI_::apiReq=:<',apiReq,'>');
    }
    const apiResp = await fetch(apiReq);
    if(this.trace) {
      console.log('DidResolver::postAPI_::apiResp=:<',apiResp,'>');
    }
    const resultJson = await apiResp.json();
    if(this.trace) {
      console.log('DidResolver::postAPI_::resultJson=:<',resultJson,'>');
    }
    return resultJson;
  }
  accessToken_() {
    if(this.trace) {
      console.log('DidResolver::accessToken_::this.auth=:<',this.auth,'>');
    }
    const token = {};
    const signedToken = this.auth.sign(token);
    if(this.trace) {
      console.log('DidResolver::accessToken_::signedToken=:<',signedToken,'>');
    }
    const tokenB64 = this.util.encodeBase64Str(JSON.stringify(signedToken));
    if(this.trace) {
      console.log('DidResolver::accessToken_::tokenB64=:<',tokenB64,'>');
    }
    return tokenB64;
  }
}
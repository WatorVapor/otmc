import {
  DidStoreDocument,
  DidStoreManifest,
  DidStoreJoin
} from './otmc.did.document.store.js';
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
    const webDidDoc = await this.webStore.resolver(didAddress);
    if(this.trace) {
      console.log('DidResolver::resolver::webDidDoc=:<',webDidDoc,'>');
    }
    const didDoc = localDidDoc || webDidDoc;
    return didDoc;
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
    const webManifest = await this.webStore.manifest(didAddress);
    if(this.trace) {
      console.log('DidResolver::manifest::webManifest=:<',webManifest,'>');
    }
    const manifest = localManifest || webManifest;
    return manifest;
  }
  async storeManifest(manifestObj,did){
    const manifestStr = JSON.stringify(manifestObj);
    const storeKey = `${did}.${this.util.calcAddress(manifestStr)}`;
    this.localStore.storeManifest(storeKey,manifestStr);
    this.webStore.storeManifest(manifestObj,did);
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
    this.joinStore = new DidStoreJoin(StoreKey.open.did.joinReq);
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
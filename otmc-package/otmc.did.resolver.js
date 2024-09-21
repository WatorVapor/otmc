import {
  DidStoreDocument,
  DidStoreManifest,
  DidStoreJoin
} from './otmc.did.document.store.js';

const context = 'https://otmc.wator.xyz/ns/did';


/**
*
*/
export class DidResolver {
  constructor(ee) {
    this.trace = true;;
    this.debug = true;
    this.ee = ee;
    this.ListenEventEmitter_();
  }
  ListenEventEmitter_() {
    if(this.trace) {
      console.log('DidResolver::ListenEventEmitter_::this.ee=:<',this.ee,'>');
    }
    const self = this;
    this.ee.on('sys.authKey.ready',(evt)=>{
      if(self.trace) {
        console.log('DidResolver::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.auth = evt.auth;
      self.otmc = evt.otmc;
      self.base32 = evt.base32;
      self.util = evt.util;
    });
  }

  async resolver(didAddress){
    if(this.trace) {
      console.log('DidResolver::resolver::didAddress=:<',didAddress,'>');
    }
    const didDoc = await this.requestAPI_(didAddress);
    if(this.trace) {
      console.log('DidResolver::resolver::didDoc=:<',didDoc,'>');
    }
  }
  async store(didDoc){
    
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

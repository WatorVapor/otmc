import { StoreKey } from './otmc.const.js';
const context = 'https://otmc.wator.xyz/ns/did';
export class DidResolverWebStore {
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
    const didDoc = await this.GetRequestAPI_(didAddress);
    return didDoc;
  }
  async getDidDocumentAll(didAddress){
    if(this.trace) {
      console.log('DidResolverWebStore::getDidDocumentAll::didAddress=:<',didAddress,'>');
    }
    const didDoc = await this.GetRequestAPI_(`${didAddress}?all=true`);
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
    const result = await this.postRequestAPI_(apiPath,didDocSigned);
    return result;
  }
  async manifest(didAddress){
    if(this.trace) {
      console.log('DidResolverWebStore::manifest::didAddress=:<',didAddress,'>');
    }
    const manifest = await this.GetRequestAPI_(`manifest/${didAddress}`);
    return manifest;
  }
  async manifestAll(didAddress){
    if(this.trace) {
      console.log('DidResolverWebStore::manifestAll::didAddress=:<',didAddress,'>');
    }
    const manifest = await this.GetRequestAPI_(`manifest/${didAddress}?all=true`);
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
    const result = await this.postRequestAPI_(apiPath,manifestSigned);
    return result;
  }
  async GetRequestAPI_(apiPath) {
    /*
    const reqURl =`${context}/v1/${apiPath}`;
    if(this.trace) {
      console.log('DidResolverWebStore::GetRequestAPI_::reqURl=:<',reqURl,'>');
    }
    const reqHeader = new Headers();
    reqHeader.append('Content-Type', 'application/json');
    const authToken = this.accessToken_();
    reqHeader.append('Authorization', `Bearer ${authToken}`);
    const reqOption = {
      method: 'GET',
      headers:reqHeader
    };
    const apiReq = new Request(reqURl, reqOption);
    if(this.trace) {
      console.log('DidResolverWebStore::GetRequestAPI_::apiReq=:<',apiReq,'>');
    }
    const apiResp = await fetch(apiReq);
    if(this.trace) {
      console.log('DidResolverWebStore::GetRequestAPI_::apiResp=:<',apiResp,'>');
    }
    const resultJson = await apiResp.json();
    if(this.trace) {
      console.log('DidResolverWebStore::GetRequestAPI_::resultJson=:<',resultJson,'>');
    }
    return resultJson;
    */
  }
  async postRequestAPI_(apiPath,reqBody) {
    /*
    const reqURl =`${context}/v1/${apiPath}`;
    if(this.trace) {
      console.log('DidResolverWebStore::postRequestAPI_::reqURl=:<',reqURl,'>');
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
      console.log('DidResolverWebStore::postRequestAPI_::apiReq=:<',apiReq,'>');
    }
    const apiResp = await fetch(apiReq);
    if(this.trace) {
      console.log('DidResolverWebStore::postRequestAPI_::apiResp=:<',apiResp,'>');
    }
    const resultJson = await apiResp.json();
    if(this.trace) {
      console.log('DidResolverWebStore::postRequestAPI_::resultJson=:<',resultJson,'>');
    }
    return resultJson;
    */
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
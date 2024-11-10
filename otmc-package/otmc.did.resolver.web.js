import { StoreKey } from './otmc.const.js';
import { DidStoreDocument } from './otmc.did.store.document.js';
import { DidStoreManifest } from './otmc.did.store.manifest.js';
import { DidStoreTeamJoin } from './otmc.did.store.team.join.js';

const context = 'https://otmc.wator.xyz/ns/did';
export class DidResolverSyncWebStore {
  constructor(eeInternal,worker) {
    this.trace = true;;
    this.debug = true;
    this.eeInternal = eeInternal;
    this.worker = worker;
    this.ListenEventEmitter_();
  }
  ListenEventEmitter_() {
    if(this.trace) {
      console.log('DidResolverSyncWebStore::ListenEventEmitter_::this.eeInternal=:<',this.eeInternal,'>');
    }
    const self = this;
    this.eeInternal.on('sys.authKey.ready',(evt)=>{
      if(self.trace) {
        console.log('DidResolverSyncWebStore::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.auth = evt.auth;
      self.otmc = evt.otmc;
      self.base32 = evt.base32;
      self.util = evt.util;
      self.document = new DidStoreDocument(evt);
      self.manifest = new DidStoreManifest(evt);
      self.teamJoin = new DidStoreTeamJoin(evt);
      setTimeout(()=>{
        self.trySyncCloudEvidence_();
      },10);
    });
  }
  trySyncCloudEvidence_() {
    this.trySyncCloudDocument_();
    this.trySyncCloudManifest_();
    this.trySyncCloudTeamJoin_();
  }
  async trySyncCloudDocument_() {
    if(this.trace) {
      console.log('DidResolverSyncWebStore::trySyncCloudDocument_::this.document=:<',this.document,'>');
    }
    const concernDids = await this.document.getConcernDidAddress();
    if(this.trace) {
      console.log('DidResolverSyncWebStore::trySyncCloudDocument_::concernDids=:<',concernDids,'>');
    }
    const cloudRequests = [];
    for(const didAddress of concernDids) {
      const didAllApi = `${didAddress}?fullchain=true`;
      const requstObj = this.createCloudGetRequest_(didAllApi);
      cloudRequests.push(requstObj);
    }
    if(this.trace) {
      console.log('DidResolverSyncWebStore::trySyncCloudDocument_::cloudRequests=:<',cloudRequests,'>');
    }
    this.worker.postMessage({reqDL:cloudRequests});
  }
  async trySyncCloudManifest_() {
    if(this.trace) {
      console.log('DidResolverSyncWebStore::trySyncCloudManifest_::this.manifest=:<',this.manifest,'>');
    }
  }
  async trySyncCloudTeamJoin_() {
    if(this.trace) {
      console.log('DidResolverSyncWebStore::trySyncCloudTeamJoin_::this.teamJoin=:<',this.teamJoin,'>');
    }
  }

  async resolver(didAddress){
    if(this.trace) {
      console.log('DidResolverSyncWebStore::resolver::didAddress=:<',didAddress,'>');
    }
    const didDoc = await this.GetRequestAPI_(didAddress);
    return didDoc;
  }
  async getDidDocumentAll(didAddress){
    if(this.trace) {
      console.log('DidResolverSyncWebStore::getDidDocumentAll::didAddress=:<',didAddress,'>');
    }
    const didDoc = await this.GetRequestAPI_(`${didAddress}?all=true`);
    return didDoc;
  }
  async storeDid(didDoc){
    if(this.trace) {
      console.log('DidResolverSyncWebStore::storeDid::didDoc=:<',didDoc,'>');
    }
    const apiPath = `document/upload/${didDoc.id}`
    if(this.trace) {
      console.log('DidResolverSyncWebStore::storeDid::apiPath=:<',apiPath,'>');
    }
    const didDocSigned =this.auth.sign({did:didDoc});
    if(this.trace) {
      console.log('DidResolverSyncWebStore::storeDid::didDocSigned=:<',didDocSigned,'>');
    }
    const result = await this.postRequestAPI_(apiPath,didDocSigned);
    return result;
  }
  async manifest(didAddress){
    if(this.trace) {
      console.log('DidResolverSyncWebStore::manifest::didAddress=:<',didAddress,'>');
    }
    const manifest = await this.GetRequestAPI_(`manifest/${didAddress}`);
    return manifest;
  }
  async manifestAll(didAddress){
    if(this.trace) {
      console.log('DidResolverSyncWebStore::manifestAll::didAddress=:<',didAddress,'>');
    }
    const manifest = await this.GetRequestAPI_(`manifest/${didAddress}?all=true`);
    return manifest;
  }

  async storeManifest(manifest,did){
    if(this.trace) {
      console.log('DidResolverSyncWebStore::storeManifest::manifest=:<',manifest,'>');
    }
    const apiPath = `manifest/upload/${did}`
    if(this.trace) {
      console.log('DidResolverSyncWebStore::storeManifest::apiPath=:<',apiPath,'>');
    }
    const manifestSigned =this.auth.sign({manifest:manifest});
    if(this.trace) {
      console.log('DidResolverSyncWebStore::storeManifest::manifestSigned=:<',manifestSigned,'>');
    }
    const result = await this.postRequestAPI_(apiPath,manifestSigned);
    return result;
  }
  createCloudGetRequest_(apiPath) {
    const reqURl =`${context}/v1/${apiPath}`;
    if(this.trace) {
      console.log('DidResolverSyncWebStore::createCloudGetRequest_::reqURl=:<',reqURl,'>');
    }
    const authToken = this.accessToken_();
    const reqObj = {
      GET:{
        url:reqURl,
        Authorization:authToken
      }
    }
    return reqObj;
  }  
  async GetRequestAPI_(apiPath) {
    /*
    const reqURl =`${context}/v1/${apiPath}`;
    if(this.trace) {
      console.log('DidResolverSyncWebStore::GetRequestAPI_::reqURl=:<',reqURl,'>');
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
      console.log('DidResolverSyncWebStore::GetRequestAPI_::apiReq=:<',apiReq,'>');
    }
    const apiResp = await fetch(apiReq);
    if(this.trace) {
      console.log('DidResolverSyncWebStore::GetRequestAPI_::apiResp=:<',apiResp,'>');
    }
    const resultJson = await apiResp.json();
    if(this.trace) {
      console.log('DidResolverSyncWebStore::GetRequestAPI_::resultJson=:<',resultJson,'>');
    }
    return resultJson;
    */
  }
  async postRequestAPI_(apiPath,reqBody) {
    /*
    const reqURl =`${context}/v1/${apiPath}`;
    if(this.trace) {
      console.log('DidResolverSyncWebStore::postRequestAPI_::reqURl=:<',reqURl,'>');
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
      console.log('DidResolverSyncWebStore::postRequestAPI_::apiReq=:<',apiReq,'>');
    }
    const apiResp = await fetch(apiReq);
    if(this.trace) {
      console.log('DidResolverSyncWebStore::postRequestAPI_::apiResp=:<',apiResp,'>');
    }
    const resultJson = await apiResp.json();
    if(this.trace) {
      console.log('DidResolverSyncWebStore::postRequestAPI_::resultJson=:<',resultJson,'>');
    }
    return resultJson;
    */
  }
  accessToken_() {
    if(this.trace) {
      console.log('DidResolverSyncWebStore::accessToken_::this.auth=:<',this.auth,'>');
    }
    const token = {};
    const signedToken = this.auth.sign(token);
    if(this.trace) {
      console.log('DidResolverSyncWebStore::accessToken_::signedToken=:<',signedToken,'>');
    }
    const tokenB64 = this.util.encodeBase64Str(JSON.stringify(signedToken));
    if(this.trace) {
      console.log('DidResolverSyncWebStore::accessToken_::tokenB64=:<',tokenB64,'>');
    }
    return tokenB64;
  }
}
import { DidStoreDocument } from './otmc.did.store.document.js';
import { DidStoreTeamJoin } from './otmc.did.store.team.join.js';

const context = 'https://otmc.wator.xyz/ns/did/evidence';
export class DidResolverSyncWebStore {
  constructor(eeInternal,worker) {
    this.trace = true;;
    this.debug = true;
    this.eeInternal = eeInternal;
    this.worker = worker;
    this.ListenEventEmitter_();
    const self = this;
    this.worker.onmessage = (e) => {
      self.onCloudMsg_(e.data);
    }
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
      self.teamJoin = new DidStoreTeamJoin(evt);
      setTimeout(()=>{
        self.trySyncCloudEvidence_();
      },10);
    });
  }
  trySyncCloudEvidence_() {
    this.trySyncCloudDocument_();
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
      const didAllApi = `hash/document/${didAddress}?fullchain=true`;
      const requstObj = this.createCloudGetRequest_(didAllApi);
      cloudRequests.push(requstObj);
    }
    if(this.trace) {
      console.log('DidResolverSyncWebStore::trySyncCloudDocument_::cloudRequests=:<',cloudRequests,'>');
    }
    this.worker.postMessage({reqDL:cloudRequests});
  }
  async trySyncCloudTeamJoin_() {
    if(this.trace) {
      console.log('DidResolverSyncWebStore::trySyncCloudTeamJoin_::this.teamJoin=:<',this.teamJoin,'>');
    }
    const concernDids = await this.document.getConcernDidAddress();
    if(this.trace) {
      console.log('DidResolverSyncWebStore::trySyncCloudTeamJoin_::concernDids=:<',concernDids,'>');
    }
    const cloudRequests = [];
    for(const didAddress of concernDids) {
      const joinAllApi = `hash/join/${didAddress}?fullchain=true`;
      const requstObj = this.createCloudGetRequest_(joinAllApi);
      cloudRequests.push(requstObj);
    }
    if(this.trace) {
      console.log('DidResolverSyncWebStore::trySyncCloudTeamJoin_::cloudRequests=:<',cloudRequests,'>');
    }
    this.worker.postMessage({reqDL:cloudRequests});
  }
  async onCloudMsg_(msgCloud) {
    if(this.trace) {
      console.log('DidResolverSyncWebStore::onCloudMsg_::msgCloud=:<',msgCloud,'>');
    }
    if(msgCloud.reqDid && msgCloud.content && msgCloud.content.hash) {
      await this.onCloudDidResponsedHash_(msgCloud.reqDid,msgCloud.content.hash)
    }
    if(msgCloud.reqJoin && msgCloud.content && msgCloud.content.hash) {
      await this.onCloudJoinResponsedHash_(msgCloud.reqJoin,msgCloud.content.hash)
    }
    if(msgCloud.reqDid && msgCloud.content && msgCloud.content.didDocument) {
      await this.onCloudDidResponsedDocument_(msgCloud.reqDid,msgCloud.content.didDocument)
    }
    if(msgCloud.reqJoin && msgCloud.content && msgCloud.content.didJoin) {
      await this.onCloudDidResponsedJoinRequest_(msgCloud.reqJoin,msgCloud.content.didJoin)
    }
  }
  async onCloudDidResponsedHash_(reqDid,cloudHashList) {
    if(this.trace) {
      console.log('DidResolverSyncWebStore::onCloudDidResponsedHash_::reqDid=:<',reqDid,'>');
      console.log('DidResolverSyncWebStore::onCloudDidResponsedHash_::cloudHashList=:<',cloudHashList,'>');
    }
    const localHashList = await this.document.getHashListOfStable(reqDid);
    if(this.trace) {
      console.log('DidResolverSyncWebStore::onCloudDidResponsedHash_::localHashList=:<',localHashList,'>');
    }
    for(const hash in cloudHashList) {
      const hashContent = cloudHashList[hash];
      if(localHashList.includes(hash)) {
        // cloud did already in local
        continue;
      } else {
        // cloud did not already in local
        this.tryStoreCloudDid2Local_(reqDid,hash,hashContent);        
      }
    }
    for(const hash of localHashList) {
      const hashCloud = cloudHashList[hash];
      if(!hashCloud) {
        // local did not already in cloud
        this.tryStoreLocalDid2Cloud_(reqDid,hash);
      } else {
        // local did already in cloud
        continue;
      }
    }
  }
  tryStoreCloudDid2Local_(didDL,hashDL,hashContent) {
    if(this.trace) {
      console.log('DidResolverSyncWebStore::tryStoreCloudDid2Local_::didDL=:<',didDL,'>');
      console.log('DidResolverSyncWebStore::tryStoreCloudDid2Local_::hashDL=:<',hashDL,'>');
      console.log('DidResolverSyncWebStore::tryStoreCloudDid2Local_::hashContent=:<',hashContent,'>');
    }
    const didAllApi = `document/${didDL}?didHash=${hashDL}`;
    const requstObj = this.createCloudGetRequest_(didAllApi);
    if(this.trace) {
      console.log('DidResolverSyncWebStore::tryStoreCloudDid2Local_::didrequstObjDL=:<',requstObj,'>');
    }
    this.worker.postMessage({reqDL:[requstObj]});
  }
  async tryStoreLocalDid2Cloud_(didUL,hashUL) {
    if(this.trace) {
      console.log('DidResolverSyncWebStore::tryStoreLocalDid2Cloud_::didUL=:<',didUL,'>');
      console.log('DidResolverSyncWebStore::tryStoreLocalDid2Cloud_::hashUL=:<',hashUL,'>');
    }
    const localDid = await this.document.getStableDidDocument(didUL,hashUL);
    if(this.trace) {
      console.log('DidResolverSyncWebStore::tryStoreLocalDid2Cloud_::localDid=:<',localDid,'>');
    }
    if(!localDid) {
      return; // local did not exist
    }
    const apiPath = `document/upload/${didUL}`
    if(this.trace) {
      console.log('DidResolverSyncWebStore::tryStoreLocalDid2Cloud_::apiPath=:<',apiPath,'>');
    }
    const b64Did = this.util.encodeBase64Str(JSON.stringify(localDid));
    const syncObject = {
      did: didUL, 
      hash: hashUL,
      updated: localDid.updated,
      docB64: b64Did
    }
    const syncObjectSigned =this.auth.sign(syncObject);
    if(this.trace) {
      console.log('DidResolverSyncWebStore::tryStoreLocalDid2Cloud_::syncObjectSigned=:<',syncObjectSigned,'>');
    }
    const requstObj = this.createCloudPostRequest_(apiPath,syncObjectSigned);
    if(this.trace) {
      console.log('DidResolverSyncWebStore::tryStoreLocalDid2Cloud_::requstObj=:<',requstObj,'>');
    }
    this.worker.postMessage({postUL:requstObj});
  }

  async onCloudDidResponsedDocument_(reqDid,cloudDids) {
    if(this.trace) {
      console.log('DidResolverSyncWebStore::onCloudDidResponsedDocument_::reqDid=:<',reqDid,'>');
      console.log('DidResolverSyncWebStore::onCloudDidResponsedDocument_::cloudDids=:<',cloudDids,'>');
    }
    for(const cloudDid of cloudDids) {
      if(this.trace) {
        console.log('DidResolverSyncWebStore::onCloudDidResponsedDocument_::cloudDid=:<',cloudDid,'>');
      }
      this.onCloudDidSyncDocument_(cloudDid.hash,cloudDid.didJson);
    }
  }
  onCloudDidSyncDocument_(remoteHash,remoteDid) {
    if(this.trace) {
      console.log('DidResolverSyncWebStore::onCloudDidSyncDocument_::remoteHash=:<',remoteHash,'>');
      console.log('DidResolverSyncWebStore::onCloudDidSyncDocument_::remoteDid=:<',remoteDid,'>');
    }
    const documentStr = JSON.stringify(remoteDid);
    const calcHash = this.util.calcAddress(documentStr);
    if(this.trace) {
      console.log('DidResolverSyncWebStore::onCloudDidSyncDocument_::calcHash=:<',calcHash,'>');
    }
    if(calcHash !== remoteHash) {
      return;
    }
    const storeDoc = {
      id:remoteDid.id,
      updated:remoteDid.updated,
      hashDid:calcHash,
      origDid:documentStr
    }
    if(this.trace) {
      console.log('DidResolverSyncWebStore::onCloudDidSyncDocument_::storeDoc=:<',storeDoc,'>');
    }
    this.document.putTentative(storeDoc);
  }

  async onCloudJoinResponsedHash_(reqJoin,cloudHashList) {
    if(this.trace) {
      console.log('DidResolverSyncWebStore::onCloudJoinResponsedHash_::reqJoin=:<',reqJoin,'>');
      console.log('DidResolverSyncWebStore::onCloudJoinResponsedHash_::cloudHashList=:<',cloudHashList,'>');
    }
    const localHashList = await this.teamJoin.getHashListOfJoin(reqJoin);
    if(this.trace) {
      console.log('DidResolverSyncWebStore::onCloudJoinResponsedHash_::localHashList=:<',localHashList,'>');
    }
    for(const hash in cloudHashList) {
      const hashContent = cloudHashList[hash];
      if(localHashList.includes(hash)) {
        // cloud did already in local
        continue;
      } else {
        // cloud did not already in local
        this.tryStoreCloudJoinReq2Local_(reqJoin,hash,hashContent);        
      }
    }
    for(const hash of localHashList) {
      const hashCloud = cloudHashList[hash];
      if(!hashCloud) {
        // local did not already in cloud
        this.tryStoreLocalJoinReq2Cloud_(reqJoin,hash);
      } else {
        // local did already in cloud
        continue;
      }
    }
  }
  tryStoreCloudJoinReq2Local_(joinDL,hashDL,hashContent) {
    if(this.trace) {
      console.log('DidResolverSyncWebStore::tryStoreCloudJoinReq2Local_::joinDL=:<',joinDL,'>');
      console.log('DidResolverSyncWebStore::tryStoreCloudJoinReq2Local_::hashDL=:<',hashDL,'>');
      console.log('DidResolverSyncWebStore::tryStoreCloudJoinReq2Local_::hashContent=:<',hashContent,'>');
    }
    const didAllApi = `join/${joinDL}?joinHash=${hashDL}`;
    const requstObj = this.createCloudGetRequest_(didAllApi);
    if(this.trace) {
      console.log('DidResolverSyncWebStore::tryStoreCloudJoinReq2Local_::didrequstObjDL=:<',requstObj,'>');
    }
    this.worker.postMessage({reqDL:[requstObj]});
  }
  async tryStoreLocalJoinReq2Cloud_(joinUL,hashUL) {
    if(this.trace) {
      console.log('DidResolverSyncWebStore::tryStoreLocalJoinReq2Cloud_::joinUL=:<',joinUL,'>');
      console.log('DidResolverSyncWebStore::tryStoreLocalJoinReq2Cloud_::hashUL=:<',hashUL,'>');
    }
    const localJoinReq = await this.teamJoin.getJoinRequestByAddreAndHash(joinUL,hashUL);
    if(this.trace) {
      console.log('DidResolverSyncWebStore::tryStoreLocalJoinReq2Cloud_::localJoinReq=:<',localJoinReq,'>');
    }
    if(!localJoinReq) {
      return; // local did not exist
    }
    const apiPath = `team/join/upload/${joinUL}`
    if(this.trace) {
      console.log('DidResolverSyncWebStore::tryStoreLocalJoinReq2Cloud_::apiPath=:<',apiPath,'>');
    }
    const b64Join = this.util.encodeBase64Str(JSON.stringify(localJoinReq));
    const syncObject = {
      did: joinUL,
      hash: hashUL,
      joinB64: b64Join
    }
    const syncObjectSigned =this.auth.sign(syncObject);
    if(this.trace) {
      console.log('DidResolverSyncWebStore::tryStoreLocalJoinReq2Cloud_::syncObjectSigned=:<',syncObjectSigned,'>');
    }
    const requstObj = this.createCloudPostRequest_(apiPath,syncObjectSigned);
    if(this.trace) {
      console.log('DidResolverSyncWebStore::tryStoreLocalJoinReq2Cloud_::requstObj=:<',requstObj,'>');
    }
    this.worker.postMessage({postUL:[requstObj]});
  }
  async onCloudDidResponsedJoinRequest_(reqJoin,cloudJoinReqs) {
    if(this.trace) {
      console.log('DidResolverSyncWebStore::onCloudDidResponsedJoinRequest_::reqJoin=:<',reqJoin,'>');
      console.log('DidResolverSyncWebStore::onCloudDidResponsedJoinRequest_::cloudJoinReqs=:<',cloudJoinReqs,'>');
    }
    for(const cloudJoinReq of cloudJoinReqs) {
      if(this.trace) {
        console.log('DidResolverSyncWebStore::onCloudDidResponsedJoinRequest_::cloudJoinReq=:<',cloudJoinReq,'>');
      }
      await this.onCloudDidSyncJoinRequest_(cloudJoinReq.hash,cloudJoinReq.joinJson);
    }
  }
  async onCloudDidSyncJoinRequest_(remoteHash,remoteJoin) {
    if(this.trace) {
      console.log('DidResolverSyncWebStore::onCloudDidSyncJoinRequest_::remoteHash=:<',remoteHash,'>');
      console.log('DidResolverSyncWebStore::onCloudDidSyncJoinRequest_::remoteJoin=:<',remoteJoin,'>');
    }
    const joinRemoteStr = JSON.stringify(remoteJoin);
    const calcHash = this.util.calcAddress(joinRemoteStr);
    if(this.trace) {
      console.log('DidResolverSyncWebStore::onCloudDidSyncJoinRequest_::calcHash=:<',calcHash,'>');
    }
    if(calcHash !== remoteHash) {
      return;
    }
    const storeJoin = {
      did:remoteJoin.credentialRequest.claims.did.id,
      hashCR:remoteHash,
      origCredReq:joinRemoteStr,
    }
    if(this.trace) {
      console.log('DidResolverSyncWebStore::onCloudDidSyncJoinRequest_::storeJoin=:<',storeJoin,'>');
    }
    await this.teamJoin.putTentativeCredReq(storeJoin);
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
  createCloudPostRequest_(apiPath,reqBody) {
    const reqURl =`${context}/v1/${apiPath}`;
    if(this.trace) {
      console.log('DidResolverSyncWebStore::createCloudGetRequest_::reqURl=:<',reqURl,'>');
    }
    const authToken = this.accessToken_();
    const reqObj = {
      POST:{
        url:reqURl,
        Authorization:authToken,
        body:reqBody
      }
    }
    return reqObj;
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
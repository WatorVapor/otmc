import { DidStoreDocument } from './otmc.did.store.document.js';
import { DidStoreTeamJoin } from './otmc.did.store.team.join.js';

const context = 'https://otmc.wator.xyz/ns/did/evidence';
export class DidResolverSyncWebStore {
  /**
   * Creates an instance of the class.
   * 
   * @constructor
   * @param {Object} eeInternal - The internal event emitter.
   * @param {Worker} worker - The web worker instance.
   * @property {boolean} trace - Flag to enable tracing.
   * @property {boolean} debug - Flag to enable debugging.
   * @property {Object} eeInternal - The internal event emitter.
   * @property {Worker} worker - The web worker instance.
   * @fires ListenEventEmitter_
   * @listens Worker#onmessage
   */
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
  /**
   * Listens to the 'sys.authKey.ready' event on the internal event emitter.
   * When the event is triggered, it updates the instance properties with the event data
   * and initializes the DidStoreDocument and DidStoreTeamJoin instances.
   * Finally, it attempts to synchronize cloud evidence after a short delay.
   *
   * @private
   */
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
  /**
   * Attempts to synchronize cloud evidence by calling the necessary
   * methods to sync the cloud document and cloud team join.
   * 
   * @private
   */
  trySyncCloudEvidence_() {
    this.trySyncCloudDocument_();
    //this.trySyncCloudTeamJoin_();
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
  /**
   * Attempts to synchronize the cloud team join process.
   * 
   * This function retrieves the DID addresses of concerns from the document,
   * creates cloud GET requests for each DID address, and posts these requests
   * to a worker for further processing.
   * 
   * @async
   * @private
   * @returns {Promise<void>} A promise that resolves when the synchronization process is complete.
   */
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
      const joinAllApi = `hash/join/${didAddress}`;
      const requstObj = this.createCloudGetRequest_(joinAllApi);
      cloudRequests.push(requstObj);
    }
    if(this.trace) {
      console.log('DidResolverSyncWebStore::trySyncCloudTeamJoin_::cloudRequests=:<',cloudRequests,'>');
    }
    this.worker.postMessage({reqDL:cloudRequests});
  }
  /**
   * Handles incoming cloud messages and processes them based on their content.
   * 
   * @param {Object} msgCloud - The cloud message object.
   * @param {string} [msgCloud.reqDid] - The requested DID.
   * @param {string} [msgCloud.reqJoin] - The requested join.
   * @param {Object} [msgCloud.content] - The content of the cloud message.
   * @param {string} [msgCloud.content.hash] - The hash value in the content.
   * @param {Object} [msgCloud.content.didDocument] - The DID document in the content.
   * @param {Object} [msgCloud.content.didJoin] - The DID join request in the content.
   * 
   * @returns {Promise<void>} - A promise that resolves when the message has been processed.
   */
  async onCloudMsg_(msgCloud) {
    if(this.trace) {
      console.log('DidResolverSyncWebStore::onCloudMsg_::msgCloud=:<',msgCloud,'>');
    }
    if(msgCloud.reqDid && msgCloud.content && msgCloud.content.hash) {
      await this.onCloudDidResponsedHash_(msgCloud.reqDidHash,msgCloud.content.hash)
    }
    if(msgCloud.reqDid && msgCloud.content && msgCloud.content.didDocument) {
      await this.onCloudDidResponsedDocument_(msgCloud.reqDid,msgCloud.content.didDocument)
    }
    if(msgCloud.reqJoin && msgCloud.content && msgCloud.content.hash) {
      await this.onCloudJoinResponsedHash_(msgCloud.reqJoinHash,msgCloud.content.hash)
    }
    if(msgCloud.reqJoin && msgCloud.content && msgCloud.content.didJoinCR) {
      await this.onCloudDidResponsedJoinCR_(msgCloud.reqJoinCR,msgCloud.content.didJoinCR)
    }
    if(msgCloud.reqJoin && msgCloud.content && msgCloud.content.didJoinVC) {
      await this.onCloudDidResponsedJoinVC_(msgCloud.reqJoinVC,msgCloud.content.didJoinVC)
    }
  }
  /**
   * Handles the response of cloud DID hashes and synchronizes them with the local storage.
   *
   * @param {string} reqDid - The requested DID.
   * @param {Object} cloudHashList - The list of hashes from the cloud, where the key is the hash and the value is the hash content.
   * @returns {Promise<void>} - A promise that resolves when the synchronization is complete.
   */
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
  /**
   * Attempts to store a cloud DID (Decentralized Identifier) locally.
   *
   * @param {string} didDL - The DID to be stored.
   * @param {string} hashDL - The hash of the DID document.
   * @param {string} hashContent - The hash of the content associated with the DID.
   * @private
   */
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
  /**
   * Attempts to store a local DID document to the cloud.
   * 
   * @param {string} didUL - The DID URL.
   * @param {string} hashUL - The hash of the DID document.
   * @returns {Promise<void>} - A promise that resolves when the operation is complete.
   * @private
   */
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
      controller:localDid.controller,
      authentication:localDid.authentication,
      hashDid: localDid.hashDid,
      hashDid: localDid.hashCore,
      updated: localDid.updated,
      b64Did: b64Did
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

  /**
   * Handles the response of cloud DID documents.
   *
   * @param {string} reqDid - The requested DID.
   * @param {Array<Object>} cloudDids - An array of cloud DID objects.
   * @param {string} cloudDids[].hash - The hash of the cloud DID document.
   * @param {Object} cloudDids[].didJson - The JSON representation of the cloud DID document.
   * @returns {Promise<void>} - A promise that resolves when the operation is complete.
   */
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
  /**
   * Handles the synchronization of a DID document from the cloud.
   *
   * @param {string} remoteHash - The hash of the remote DID document.
   * @param {Object} remoteDid - The remote DID document.
   * @private
   */
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
    const coreDocObj = JSON.parse(documentStr);
    delete coreDocObj.proof;
    const coreDocStr = JSON.stringify(coreDocObj);
    const storeDoc = {
      did:remoteDid.id,
      controller:remoteDid.controller,
      authentication:remoteDid.authentication,
      updated:remoteDid.updated,
      hashDid:calcHash,
      hashCore:this.util.calcAddress(coreDocStr),
      b64Did:this.util.encodeBase64Str(documentStr)
    }
    if(this.trace) {
      console.log('DidResolverSyncWebStore::onCloudDidSyncDocument_::storeDoc=:<',storeDoc,'>');
    }
    this.document.putTentative(storeDoc);
  }

  /**
   * Handles the response of a cloud join request by comparing the cloud hash list with the local hash list.
   * 
   * @param {Object} reqJoin - The join request object.
   * @param {Object} cloudHashList - The list of hashes from the cloud.
   * @returns {Promise<void>}
   * @private
   */
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
  /**
   * Attempts to store a cloud join request locally.
   *
   * @param {string} joinDL - The join data link.
   * @param {string} hashDL - The hash of the data link.
   * @param {string} hashContent - The hash of the content.
   * @private
   */
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
  /**
   * Attempts to store a local join request to the cloud.
   * 
   * @param {string} joinUL - The unique identifier for the join request.
   * @param {string} hashUL - The hash associated with the join request.
   * @returns {Promise<void>} - A promise that resolves when the operation is complete.
   * @private
   */
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
    const syncObject = {
      did: localJoinReq.did,
      control: localJoinReq.control,
      hashCR: localJoinReq.hashCR,
      b64JoinCR: localJoinReq.b64JoinCR
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
  /**
   * Handles the response to a join request from the cloud.
   *
   * @param {Object} reqJoin - The join request object.
   * @param {Array} cloudJoinReqs - An array of join request objects from the cloud.
   * @returns {Promise<void>} - A promise that resolves when all join requests have been processed.
   */
  async onCloudDidResponsedJoinCR_(reqJoin,cloudJoinReqs) {
    if(this.trace) {
      console.log('DidResolverSyncWebStore::onCloudDidResponsedJoinCR_::reqJoin=:<',reqJoin,'>');
      console.log('DidResolverSyncWebStore::onCloudDidResponsedJoinCR_::cloudJoinReqs=:<',cloudJoinReqs,'>');
    }
    for(const cloudJoinReq of cloudJoinReqs) {
      if(this.trace) {
        console.log('DidResolverSyncWebStore::onCloudDidResponsedJoinCR_::cloudJoinReq=:<',cloudJoinReq,'>');
      }
      await this.onCloudDidSyncJoinCR_(cloudJoinReq.hash,cloudJoinReq.joinJson);
    }
  }
  /**
   * Handles the cloud DID sync join request.
   *
   * @param {string} remoteHash - The hash of the remote join request.
   * @param {Object} remoteJoin - The remote join request object.
   * @returns {Promise<void>} - A promise that resolves when the join request has been processed.
   */
  async onCloudDidSyncJoinCR_(remoteHash,remoteJoin) {
    if(this.trace) {
      console.log('DidResolverSyncWebStore::onCloudDidSyncJoinCR_::remoteHash=:<',remoteHash,'>');
      console.log('DidResolverSyncWebStore::onCloudDidSyncJoinCR_::remoteJoin=:<',remoteJoin,'>');
    }
    const joinRemoteStr = JSON.stringify(remoteJoin);
    const calcHash = this.util.calcAddress(joinRemoteStr);
    if(this.trace) {
      console.log('DidResolverSyncWebStore::onCloudDidSyncJoinCR_::calcHash=:<',calcHash,'>');
    }
    if(calcHash !== remoteHash) {
      return;
    }
    const didAddress = remoteJoin.credentialRequest.claims.did.id;
    if(this.trace) {
      console.log('DidResolverSyncWebStore::onCloudDidSyncJoinCR_::didAddress=:<',didAddress,'>');
    }
    const controllers = await this.document.getControll(didAddress);
    if(this.trace) {
      console.log('DidResolverSyncWebStore::onCloudDidSyncJoinCR_::didAddress=:<',didAddress,'>');
    }
    for(const control of controllers) {
      const storeJoin = {
        did:didAddress,
        control:control,
        hashCR:remoteHash,
        b64JoinCR:this.util.encodeBase64Str(joinRemoteStr),
      }
      if(this.trace) {
        console.log('DidResolverSyncWebStore::onCloudDidSyncJoinCR_::storeJoin=:<',storeJoin,'>');
      }
      await this.teamJoin.putTentativeCredReq(storeJoin);
    }
  }

  /**
   * Handles the response to a join request from the cloud.
   *
   * @param {Object} reqJoin - The join request object.
   * @param {Array} cloudJoinReqs - An array of join request objects from the cloud.
   * @returns {Promise<void>} - A promise that resolves when all join requests have been processed.
   */
  async onCloudDidResponsedJoinVC_(reqJoin,cloudJoinReqs) {
    if(this.trace) {
      console.log('DidResolverSyncWebStore::onCloudDidResponsedJoinVC_::reqJoin=:<',reqJoin,'>');
      console.log('DidResolverSyncWebStore::onCloudDidResponsedJoinVC_::cloudJoinReqs=:<',cloudJoinReqs,'>');
    }
    for(const cloudJoinReq of cloudJoinReqs) {
      if(this.trace) {
        console.log('DidResolverSyncWebStore::onCloudDidResponsedJoinVC_::cloudJoinReq=:<',cloudJoinReq,'>');
      }
      await this.onCloudDidSyncJoinVC_(cloudJoinReq.hash,cloudJoinReq.joinJson);
    }
  }
  /**
   * Handles the cloud DID sync join request.
   *
   * @param {string} remoteHash - The hash of the remote join request.
   * @param {Object} remoteJoin - The remote join request object.
   * @returns {Promise<void>} - A promise that resolves when the join request has been processed.
   */
  async onCloudDidSyncJoinVC_(remoteHash,remoteJoin) {
    if(this.trace) {
      console.log('DidResolverSyncWebStore::onCloudDidSyncJoinVC_::remoteHash=:<',remoteHash,'>');
      console.log('DidResolverSyncWebStore::onCloudDidSyncJoinVC_::remoteJoin=:<',remoteJoin,'>');
    }
    const joinRemoteStr = JSON.stringify(remoteJoin);
    const calcHash = this.util.calcAddress(joinRemoteStr);
    if(this.trace) {
      console.log('DidResolverSyncWebStore::onCloudDidSyncJoinVC_::calcHash=:<',calcHash,'>');
    }
    if(calcHash !== remoteHash) {
      return;
    }
    const didAddress = remoteJoin.credentialRequest.claims.did.id;
    if(this.trace) {
      console.log('DidResolverSyncWebStore::onCloudDidSyncJoinVC_::didAddress=:<',didAddress,'>');
    }
    const controllers = await this.document.getControll(didAddress);
    if(this.trace) {
      console.log('DidResolverSyncWebStore::onCloudDidSyncJoinVC_::didAddress=:<',didAddress,'>');
    }
    for(const control of controllers) {
      const storeJoin = {
        did:didAddress,
        control:control,
        hashCR:remoteJoin.hashCR,
        hashVC:remoteJoin.hashVC,
        b64JoinVC:remoteJoin.b64JoinVC,
      }
      if(this.trace) {
        console.log('DidResolverSyncWebStore::onCloudDidResponsedJoinVC_::storeJoin=:<',storeJoin,'>');
      }
      await this.teamJoin.putTentativeVC(storeJoin);
    }
  }  

  /**
   * Creates a cloud GET request object with the specified API path.
   *
   * @param {string} apiPath - The API path to be appended to the base URL.
   * @returns {Object} The request object containing the URL and authorization token.
   * @private
   */
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
  /**
   * Creates a cloud POST request object.
   *
   * @param {string} apiPath - The API path to append to the base context URL.
   * @param {Object} reqBody - The request body to be sent with the POST request.
   * @returns {Object} The request object containing the URL, authorization token, and request body.
   */
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
  /**
   * Generates an access token by signing an empty token object and encoding it in Base64.
   * Logs the process if tracing is enabled.
   *
   * @returns {string} The Base64 encoded signed token.
   */
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
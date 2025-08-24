import { DidStoreDocument } from './otmc.did.store.document.js';
import { DidStoreTeamJoin } from './otmc.did.store.team.join.js';

export class DidResolverLocalStore {
  constructor(wrapper) {
    this.trace = true;
    this.debug = true;
    this.auth = wrapper.auth;
    this.otmc = wrapper.otmc;
    this.base32 = wrapper.base32;
    this.util = wrapper.util;

    this.didDocLS = new DidStoreDocument(this.otmc.config);
    this.joinStoreLS = new DidStoreTeamJoin(this.otmc.config);
  }

  async resolver(keyAddress){
    if(this.trace) {
      console.log('DidResolverLocalStore::resolver::keyAddress=:<',keyAddress,'>');
    }
    const didValuesJson = await this.didDocLS.getAllStable(keyAddress);
    if(this.trace) {
      console.log('DidResolverLocalStore::resolver::didValuesJson=:<',didValuesJson,'>');
    }
    if(didValuesJson.length > 0) {
      return this.bestDidFromStore_(didValuesJson);
    }

    const didMemberValuesJson = await this.didDocLS.getMemberAllStable(keyAddress);
    if(this.trace) {
      console.log('DidResolverLocalStore::resolver::didMemberValuesJson=:<',didMemberValuesJson,'>');
    }
    if(didMemberValuesJson.length > 0) {
      return this.bestDidFromStore_(didMemberValuesJson);
    }


    const didValuesJsonFickle = await this.didDocLS.getAllFickle(keyAddress);
    if(this.trace) {
      console.log('DidResolverLocalStore::resolver::didValuesJsonFickle=:<',didValuesJsonFickle,'>');
    }
    if(didValuesJsonFickle.length > 0) {
      return this.bestDidFromStore_(didValuesJsonFickle);
    }

    const didMemberValuesJsonFickle = await this.didDocLS.getMemberAllFickle(keyAddress);
    if(this.trace) {
      console.log('DidResolverLocalStore::resolver::didMemberValuesJsonFickle=:<',didMemberValuesJsonFickle,'>');
    }
    if(didMemberValuesJsonFickle.length > 0) {
      return this.bestDidFromStore_(didMemberValuesJsonFickle);
    }

    const didValuesJsonBuzzer = await this.didDocLS.getAllBuzzer(keyAddress);
    if(this.trace) {
      console.log('DidResolverLocalStore::resolver::didValuesJsonBuzzer=:<',didValuesJsonBuzzer,'>');
    }
    if(didValuesJsonBuzzer.length > 0) {
      return this.bestDidFromStore_(didValuesJsonBuzzer);
    }

    const didMemberValuesJsonBuzzer = await this.didDocLS.getMemberAllBuzzer(keyAddress);
    if(this.trace) {
      console.log('DidResolverLocalStore::resolver::didMemberValuesJsonBuzzer=:<',didMemberValuesJsonBuzzer,'>');
    }
    if(didMemberValuesJsonBuzzer.length > 0) {
      return this.bestDidFromStore_(didMemberValuesJsonBuzzer);
    }

    return null;
  }
  async getDidDocumentAll(keyAddress){
    if(this.trace) {
      console.log('DidResolverLocalStore::resolver::keyAddress=:<',keyAddress,'>');
    }
    const didValuesJson = await this.didDocLS.getAllStable(keyAddress);
    if(this.trace) {
      console.log('DidResolverLocalStore::resolver::didValuesJson=:<',didValuesJson,'>');
    }
    return didValuesJson;
  }
  async storeStableDid(storeDid){
    this.didDocLS.putStable(storeDid);
  }
  async storeFickleDid(storeDid){
    this.didDocLS.putFickle(storeDid);
  }
  async storeBuzzerDid(storeDid){
    this.didDocLS.putBuzzer(storeDid);
  }
  async storeCredentialRequest(did,credReq){
    if(this.trace) {
      console.log('DidResolverLocalStore::storeCredentialRequest::credReq=:<',credReq,'>');
    }
    const credReqStr = JSON.stringify(credReq);
    const credReqStore = {
      did:did,
      hashCR:this.util.calcAddress(credReqStr),
      b64JoinCR:this.util.encodeBase64Str(credReqStr)
    }
    let holders = []
    if(credReq.holder.length < 1){
      holders = await this.didDocLS.getControll(did);
      if(this.trace) {
        console.log('DidResolverLocalStore::storeCredentialRequest::holders=:<',holders,'>');
      }
    } else {
      holders = credReq.holder;
    }
    if(this.trace) {
      console.log('DidResolverLocalStore::storeCredentialRequest::holders=:<',holders,'>');
    }
    for(const holder of holders) {
      credReqStore.control = holder;
      await this.joinStoreLS.putCredReq(credReqStore);
    }
  }
  async getJoinInProgress(didAddress){
    if(this.trace) {
      console.log('DidResolverLocalStore::getJoinInProgress::didAddress=:<',didAddress,'>');
    }
    const joinList = await this.joinStoreLS.getInProgressOfAddress(didAddress);
    if(this.trace) {
      console.log('DidResolverLocalStore::getJoinInProgress::joinList=:<',joinList,'>');
    }
    const joinValuesJson = {};
    for(const joinReq of joinList) {
      if(this.trace) {
        console.log('DidResolverLocalStore::getJoinInProgress::storeReq=:<',joinReq,'>');
      }
      const joinKey = joinReq.hashCR;
      const joinValueStr = this.util.decodeBase64Str(joinReq.b64JoinCR);
      const joinValue = JSON.parse(joinValueStr);
      if(this.trace) {
        console.log('DidResolverLocalStore::getJoinInProgress::joinValue=:<',joinValue,'>');
      }
      joinValuesJson[joinKey] = joinValue;
    }
    if(this.trace) {
      console.log('DidResolverLocalStore::getJoinInProgress::joinValuesJson=:<',joinValuesJson,'>');
    }
    return joinValuesJson;
  }
  async getJoinCredRequest(storeHash){
    if(this.trace) {
      console.log('DidResolverLocalStore::getJoinCredRequest::storeHash=:<',storeHash,'>');
    }
    const credReq = await this.joinStoreLS.getJoinCredRequest(storeHash);
    if(this.trace) {
      console.log('DidResolverLocalStore::getJoinCredRequest::credReq=:<',credReq,'>');
    }
    const credReqStr = this.util.decodeBase64Str(credReq.b64JoinCR);
    return JSON.parse(credReqStr);
  }
  async markDoneJoinCredRequest(storeHash){
    if(this.trace) {
      console.log('DidResolverLocalStore::markDoneJoinCredRequest::storeHash=:<',storeHash,'>');
    }
    const markResult = await this.joinStoreLS.moveJoinCredRequest2Done(storeHash);
    if(this.trace) {
      console.log('DidResolverLocalStore::markDoneJoinCredRequest::markResult=:<',markResult,'>');
    }
    return markResult;
  }  
  
  async storeJoinVerifiableCredential(didVC) {
    if(this.trace) {
      console.log('DidResolverLocalStore::storeJoinVerifiableCredential::didVC=:<',didVC,'>');
    }
    const didVCStr = JSON.stringify(didVC);
    const vcStore = {
      did:didVC.credentialSubject.did.id,
      control:didVC.credentialSubject.did.controller,
      hashCR:didVC.id,
      hashVC:this.util.calcAddress(didVCStr),
      b64JoinVC:this.util.encodeBase64Str(didVCStr)
    }
    if(this.trace) {
      console.log('DidResolverLocalStore::storeJoinVerifiableCredential::vcStore=:<',vcStore,'>');
    }
    const resultStore = await this.joinStoreLS.putVerifiableCredential(vcStore);
    if(this.trace) {
      console.log('DidResolverLocalStore::storeJoinVerifiableCredential::resultStore=:<',resultStore,'>');
    }
    return resultStore;
  }
  decodeDidFromStore_(didStore){
    if(this.trace) {
      console.log('DidResolverLocalStore::decodeDidFromStore::didStore=:<',didStore,'>');
    }
    const did = JSON.parse(this.util.decodeBase64Str(didStore.b64Did));
    if(this.trace) {
      console.log('DidResolverLocalStore::decodeDidFromStore::did=:<',did,'>');
    }
    return did;
  }
  bestDidFromStore_(didValuesJson){
    const didValuesSorted = didValuesJson.sort((a,b) => new Date(b.updated) - new Date(a.updated));
    if(this.trace) {
      console.log('DidResolverLocalStore::bestDidFromStore_::didValuesSorted=:<',didValuesSorted,'>');
    }
    if(didValuesSorted.length < 1) {
      return null;
    }
    const topHashCore = didValuesSorted[0].hashCore;
    if(this.trace) {
      console.log('DidResolverLocalStore::bestDidFromStore_::topHashCore=:<',topHashCore,'>');
    }
    const didValuesTop = didValuesSorted.filter((store) => store.hashCore === topHashCore);
    if(this.trace) {
      console.log('DidResolverLocalStore::bestDidFromStore_::didValuesTop=:<',didValuesTop,'>');
    }
    if(didValuesTop.length === 1) {
      const bestDidStore = didValuesTop[0];
      if(this.trace) {
        console.log('DidResolverLocalStore::bestDidFromStore_::bestDidStore=:<',bestDidStore,'>');
      }
      return this.decodeDidFromStore_(bestDidStore);
    }
    const decodeDidDocs = [];
    for(const didValue of didValuesTop) {
      if(this.trace) {
        console.log('DidResolverLocalStore::bestDidFromStore_::didValue=:<',didValue,'>');
      }
      const decodeDidDoc = this.decodeDidFromStore_(didValue)
      if(this.trace) {
        console.log('DidResolverLocalStore::bestDidFromStore_::decodeDidDoc=:<',decodeDidDoc,'>');
      }
      decodeDidDocs.push(decodeDidDoc);
    }
    if(this.trace) {
      console.log('DidResolverLocalStore::bestDidFromStore_::decodeDidDocs=:<',decodeDidDocs,'>');
    }
    const reduceDidDoc = decodeDidDocs.reduce((acc,cur) => {
      if(this.trace) {
        console.log('DidResolverLocalStore::bestDidFromStore_::acc=:<',acc,'>');
        console.log('DidResolverLocalStore::bestDidFromStore_::cur=:<',cur,'>');
      }
      if(acc.proof.length < cur.proof.length) {
        return cur;
      }
      return acc;
    },decodeDidDocs[0]);
    if(this.trace) {
      console.log('DidResolverLocalStore::bestDidFromStore_::reduceDidDoc=:<',reduceDidDoc,'>');
    }
    return reduceDidDoc;
  }
  async getController(did) {
    const ctrlDid = await this.didDocLS.getControll(did);
    if(this.trace) {
      console.log('DidResolverLocalStore::getController::ctrlDid=:<',ctrlDid,'>');
    }
    return ctrlDid;
  }
}

import { EventEmitter } from 'eventemitter3';
import { DidDocument } from './otmc.did.document.js';
import { OtmcStateMachine } from './otmc.state.machine.js';
import { WebWorkerLoader } from './otmc.webworker.loader.js';
import { EdcryptKeyLoader } from './otmc.edcrypt.keyloader.js';

/**
*
*/
export class OtmcTeam extends EventEmitter {
  static trace = true;
  static debug = true;
  constructor(config) {
    super();
    this.trace0 = false;
    this.trace = true;
    this.debug = true;
    if(config) {
      this.config = config;
    } else {
      this.config = {};
    }
    this.eeInternal = new EventEmitter();
    if(this.trace) {
      console.log('OtmcTeam::constructor::this.eeInternal=:<',this.eeInternal,'>');
    }
    this.worker = new WebWorkerLoader(this.eeInternal);
    this.edCryptKey = new EdcryptKeyLoader(this.eeInternal,this);
    const self = this;
    setTimeout(() => {
      self.did = new DidDocument(this.eeInternal,this);
      self.edCryptKey.otmc = self;
      self.did.otmc = self;
      self.eeInternal.emit('edCryptKey.loader.runWorker',{});
      self.eeInternal.emit('webwoker.create.worker',{});
      self.sm = new OtmcStateMachine(this.eeInternal);
    },1);
  }
  switchDidKey(didKey) {
    const data = {
      keyId:didKey
    }
    this.eeInternal.emit('edCryptKey.loader.switchKey',data);
  }
  listKeys() {
    this.eeInternal.emit('edCryptKey.loader.listKey',{});
  }
  readAllAccountInfo() {
    this.eeInternal.emit('otmc.mqtt.read.all.account.info',{});
  }
  startMining() {
    const data = {
      mine:{
        start:true,
      }
    }
    this.eeInternal.emit('edCryptKey.loader.mining',data);
  }
  createDidTeamFromSeedCtrler(controls,root) {
    if(this.trace) {
      console.log('OtmcTeam::createDidTeamFromSeedCtrler::this.eeInternal=:<',this.eeInternal,'>');
    }
    this.eeInternal.emit('did.create.seed.controller',{controls:controls,root:root});
  }
  createDidTeamFromSeedCtrlee(controls) {
    if(this.trace) {
      console.log('OtmcTeam::createDidTeamFromSeedCtrlee::this.eeInternal=:<',this.eeInternal,'>');
    }
    this.eeInternal.emit('did.create.seed.controllee',{controls:controls});
  }
  joinDidTeamAsAuth(id) {
    if(this.trace) {
      console.log('OtmcTeam::joinDidTeamAsAuth::this.eeInternal=:<',this.eeInternal,'>');
    }
    this.eeInternal.emit('did.join.as.auth',{did:id});
  }
  joinDidTeamAsGuest(id) {
    if(this.trace) {
      console.log('OtmcTeam::joinDidTeamAsAuth::this.eeInternal=:<',this.eeInternal,'>');
    }
    this.eeInternal.emit('did.join.as.guest',{did:id});
  }
  
  createJoinTeamVCR(controller) {
    this.eeInternal.emit('did.vcr.join.team',{controller:controller});
  }

  
  requestJoinDidTeam() {
    this.eeInternal.emit('did.join.request',{});
  }
  acceptJoinRequest(storeHash){
    if(this.trace) {
      console.log('Otmc::acceptJoinRequest::new Date()=:<',new Date(),'>');
      console.log('Otmc::acceptJoinRequest::storeHash=:<',storeHash,'>');
    }
    this.eeInternal.emit('did.join.accept.request',{storeHash:storeHash});
  }
  rejectJoinRequest(storeHash){
    if(this.trace) {
      console.log('Otmc::rejectJoinRequest::new Date()=:<',new Date(),'>');
      console.log('Otmc::rejectJoinRequest::storeHash=:<',storeHash,'>');
    }
    this.eeInternal.emit('did.join.reject.request',{storeHash:storeHash});
  }
  checkEvidenceChain(){
    if(this.trace) {
      console.log('Otmc::checkEvidenceChain::new Date()=:<',new Date(),'>');
    }
    this.eeInternal.emit('did.check.evidence.chain',{});
  }
  updateManifest(manifest){
    if(this.trace) {
      console.log('Otmc::updateManifest::manifest=:<',manifest,'>');
    }
    this.eeInternal.emit('did.manifest.update',{manifest:manifest});
  }

  changeTeamProperty(property){
    if(this.trace) {
      console.log('Otmc::changeTeamProperty::property=:<',property,'>');
    }
    this.eeInternal.emit('did.property.update',{property:property});
  }
}



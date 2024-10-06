import { EventEmitter } from 'eventemitter3';
import { DidDocument } from './otmc.did.document.js';
import { OtmcStateMachine } from './otmc.state.machine.js';
import { WebWorkerLoaderBrowser,WebWorkerLoaderNode } from './otmc.webworker.loader.js';
import { EdcryptKeyLoaderBrowser,EdcryptKeyLoaderNode } from './otmc.edcrypt.keyloader.js';

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
      this.isNode = config.node;
    } else {
      this.config = {};
    }
    this.eeInternal = new EventEmitter();
    if(this.trace) {
      console.log('OtmcTeam::constructor::this.eeInternal=:<',this.eeInternal,'>');
    }
    if(this.isNode) {
      this.worker = new WebWorkerLoaderNode(this.eeInternal);
      this.edCryptKey = new EdcryptKeyLoaderNode(this.eeInternal,this);
    } else {
      this.worker = new WebWorkerLoaderBrowser(this.eeInternal);
      this.edCryptKey = new EdcryptKeyLoaderBrowser(this.eeInternal,this);
    }
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
  startMining() {
    const data = {
      mine:{
        start:true,
      }
    }
    this.eeInternal.emit('edCryptKey.loader.mining',data);
  }
  createDidTeamFromSeed(controls) {
    if(this.trace) {
      console.log('OtmcTeam::createDidTeamFromSeed::this.eeInternal=:<',this.eeInternal,'>');
    }
    this.eeInternal.emit('did.create.seed',{controls:controls});
  }
  joinDidTeamAsAuth(id) {
    this.eeInternal.emit('did.join.as.auth',{did:id});
  }
  
  
  requestJoinDidTeam() {
    this.eeInternal.emit('did.join.request',{});
  }
  acceptInvitation(address){
    if(this.trace) {
      console.log('Otmc::acceptInvitation::new Date()=:<',new Date(),'>');
      console.log('Otmc::acceptInvitation::address=:<',address,'>');
    }
    this.eeInternal.emit('did.join.accept.request',{address:address});
  }
  rejectInvitation(address){
    if(this.trace) {
      console.log('Otmc::rejectInvitation::new Date()=:<',new Date(),'>');
      console.log('Otmc::rejectInvitation::address=:<',address,'>');
    }
    this.eeInternal.emit('did.join.reject.request',{address:address});
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
}

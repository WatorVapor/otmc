import { DidStoreDocument } from './otmc.did.store.document.js';
import { DidStoreManifest } from './otmc.did.store.manifest.js';
/**
*
*/
export class DidDocumentStateMachine {
  constructor(eeInternal,eeOut) {
    this.trace0 = true;
    this.trace1 = true;
    this.trace2 = true;
    this.trace = true;;
    this.debug = true;
    this.eeInternal = eeInternal;
    this.eeOut = eeOut;
    this.ListenEventEmitter_();
  }
    
  ListenEventEmitter_() {
    if(this.trace0) {
      console.log('DidDocumentStateMachine::ListenEventEmitter_::this.eeInternal=:<',this.eeInternal,'>');
    }
    const self = this;
    this.eeInternal.on('sys.authKey.ready',(evt)=>{
      if(self.trace) {
        console.log('DidDocumentStateMachine::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.auth = evt.auth;
      self.otmc = evt.otmc;
      self.base32 = evt.base32;
      self.util = evt.util;
      self.document = new DidStoreDocument(evt);
      self.manifest = new DidStoreManifest(evt);
    });
    this.eeInternal.on('did.evidence.load.storage',async (evt)=>{
      if(self.trace0) {
        console.log('DidDocumentStateMachine::ListenEventEmitter_::evt=:<',evt,'>');
      }
      await self.loadEvidenceChain_();
      if(self.trace0) {
        console.log('DidDocumentStateMachine::ListenEventEmitter_::this.allEvidenceChain=:<',this.allEvidenceChain,'>');
      }
      for(const chainId in this.allEvidenceChain) {
        if(self.trace0) {
          console.log('DidDocumentStateMachine::ListenEventEmitter_::chainId=:<',chainId,'>');
        }
        const manifest = await self.loadDidRuleFromManifest_(chainId);
        if(self.trace0) {
          console.log('DidDocumentStateMachine::ListenEventEmitter_::manifest=:<',manifest,'>');
        }
        this.allEvidenceChain[chainId].manifest = manifest;
        const evidence = this.allEvidenceChain[chainId].did;
        const evidenceChain = {
          manifest:manifest,
          evidence:evidence,
        };
        self.eeInternal.emit('did:document:evidence.chain',evidenceChain);
      }
      self.eeInternal.emit('did:document:evidence.complete',{});
    });
  }

  async loadEvidenceChain_() {
    const evidencesJson = await this.document.getAnyDidDocument();
    if(this.trace2) {
      console.log('DidDocumentStateMachine::loadEvidenceChain_::evidencesJson=<',evidencesJson,'>');
    }
    const evidencesOfAddress = {};
    for(const evidenceJson of evidencesJson){
      if(this.trace2) {
        console.log('DidDocumentStateMachine::loadEvidenceChain_::evidenceJson=<',evidenceJson,'>');
      }
      const address = evidenceJson.id;
      if(!evidencesOfAddress[address]) {
        evidencesOfAddress[address] = [];
      }
      evidencesOfAddress[address].push(evidenceJson);
    }
    if(this.trace2) {
      console.log('DidDocumentStateMachine::loadEvidenceChain_::evidencesOfAddress=<',evidencesOfAddress,'>');
    }
    const evidences = {};
    for(const didAddress in evidencesOfAddress) {
      const manifest = await this.loadDidRuleFromManifest_(didAddress);
      evidences[didAddress] = {
        did:evidencesOfAddress[didAddress],
        manifest:manifest
      }
    }
    if(this.trace2) {
      console.log('DidDocumentStateMachine::loadEvidenceChain_::evidences=<',evidences,'>');
    }
    return evidences;
  }  
  
  async loadDidRuleFromManifest_(didId) {
    const manifestTop = await this.manifest.getTop(didId);
    if(this.trace2) {
      console.log('DidDocumentStateMachine::loadDidRuleFromManifest_::manifestTop=<',manifestTop,'>');
    }
    if(manifestTop && manifestTop.diddoc) {
      return manifestTop.diddoc;
    }
    return false;
  }
}

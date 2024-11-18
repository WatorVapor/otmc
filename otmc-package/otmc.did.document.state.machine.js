const LOG = {
  trace:true,
  debug:true,
};
import { DidStoreDocument } from './otmc.did.store.document.js';
import { DidStoreManifest } from './otmc.did.store.manifest.js';
import { createMachine, createActor, assign  }  from 'xstate';

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
    this.chainState = {};
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
      self.loadEvidence();
    });
  }
  async loadEvidence() {
    this.allEvidenceChain = await this.loadEvidenceChain_();
    if(self.trace0) {
      console.log('DidDocumentStateMachine::loadEvidence::this.allEvidenceChain=:<',this.allEvidenceChain,'>');
    }
    for(const chainId in this.allEvidenceChain) {
      if(this.trace0) {
        console.log('DidDocumentStateMachine::loadEvidence::chainId=:<',chainId,'>');
      }
      const chain = this.allEvidenceChain[chainId];
      if(this.trace0) {
        console.log('DidDocumentStateMachine::loadEvidence::chain=:<',chain,'>');
      }
      if(!this.chainState[chainId]) {
        this.chainState[chainId] = new DidChainStateMachine();
      }
      if(this.trace0) {
        console.log('DidDocumentStateMachine::loadEvidence::this.chainState=:<',this.chainState,'>');
      }
      //this.eeInternal.emit('did:document:evidence.chain',chain);
    }
    this.eeInternal.emit('did:document:evidence.complete',{});
    return;
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


class DidChainStateMachine {
  constructor() {
    this.trace0 = true;
    this.trace1 = true;
    this.trace = true;
    this.debug = true;
    this.createStateMachine_();
  }
  
  createStateMachine_() {
    const stmConfig = {
      initial: 'genesis',
      context: {},
      states: didDocStateTable,
    }
    const stmOption = {
      actions:didDocActionTable,
    }
    if(this.trace) {
      console.log('DidDocumentStateMachine::createStateMachine_::stmConfig=:<',stmConfig,'>');
    }
    this.stm = createMachine(stmConfig,stmOption);
    if(this.trace0) {
      console.log('DidDocumentStateMachine::createStateMachine_::this.stm=:<',this.stm,'>');
    }
    this.actor = createActor(this.stm);
    
    const self = this;
    this.actor.subscribe((state) => {
      if(self.trace0) {
        console.log('DidDocumentStateMachine::createStateMachine_::state=:<',state,'>');
        console.log('DidDocumentStateMachine::createStateMachine_::self.stm=:<',self.stm,'>');
      }
      if(self.trace) {
        console.log('DidDocumentStateMachine::createStateMachine_::state.value=:<',state.value,'>');
      }
    });
    this.actor.start();
    setTimeout(()=>{
      self.actor.send({type:'init'});
    },1);
  }
}

const didDocStateTable = {
  genesis: {
    on: {
      'init': {
        actions: ['init']
      },
      'chain.load':'evidenceChainReady',
      'manifest.lack':'evidenceChainWithoutManifest',
    } 
  },
  evidenceChainReady: {
    entry:['chainReady'],
    on: {
      'root.auth.proof.is.seed':'rootAuthIsSeed',
      'root.auth.proof.by.seed':'rootAuthBySeed',
      'root.auth.proof.by.auth':'rootAuthByAuth',
      'root.auth.proof.by.none':'rootAuthByNone',
      'leaf.seed.proof.by.ctrl':'leafAuthSeedByCtrl',
      'leaf.seed.proof.by.none':'leafAuthSeedByNoe',
      'leaf.auth.proof.by.ctrl':'leafAuthByCtrl',
      'leaf.auth.proof.by.none':'leafAuthByNoe',
    } 
  },
  evidenceChainWithoutManifest: {
    entry:['chainReady'],
    on: {
      'root.auth.proof.is.seed':'rootAuthIsSeed',
      'root.auth.proof.by.seed':'rootAuthBySeed',
      'root.auth.proof.by.auth':'rootAuthByAuth',
      'root.auth.proof.by.none':'rootAuthByNone',
      'leaf.seed.proof.by.ctrl':'leafAuthSeedByCtrl',
      'leaf.seed.proof.by.none':'leafAuthSeedByNoe',
      'leaf.auth.proof.by.ctrl':'leafAuthByCtrl',
      'leaf.auth.proof.by.none':'leafAuthByNoe',
    } 
  },
  evidenceChainFail: {
    entry:['chainFail'],
    on: {
      'root.auth.proof.by.none':'rootAuthByNone',
    }
  },
  rootAuthIsSeed: {
    entry:['rootAuthIsSeed'],
    on: {
    }
  },
  rootAuthBySeed: {
    entry:['rootAuthBySeed'],
    on: {
    }
  },
  rootAuthByAuth: {
    entry:['rootAuthByAuth'],
    on: {
    }
  },
  rootAuthByNone: {
    entry:['rootAuthByNone'],
    on: {
    }
  },
  leafAuthSeedByCtrl: {
    entry:['leafAuthSeedByCtrl'],
    on: {
    }
  },
  leafAuthSeedByNoe: {
    entry:['leafAuthSeedByNoe'],
    on: {
    }
  },
  leafAuthByCtrl: {
    entry:['leafAuthByCtrl'],
    on: {
    }
  },
  leafAuthByNoe: {
    entry:['leafAuthByNoe'],
    on: {
    }
  },
}

const didDocActionTable = {
  init: (context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidDocumentStateMachine::didDocActionTable::init:context=:<',context,'>');
      console.log('DidDocumentStateMachine::didDocActionTable::init:ee=:<',ee,'>');
      console.log('DidDocumentStateMachine::didDocActionTable::init:chain=:<',chain,'>');
    }
  },
  chainReady: async (context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidDocumentStateMachine::didDocActionTable::chainReady:context=:<',context,'>');
      console.log('v::didDocActionTable::chainReady:ee=:<',ee,'>');
      console.log('DidDocumentStateMachine::didDocActionTable::chainReady:chain=:<',chain,'>');
    }
    const proof = await chain.calcDidAuth();
    if(LOG.trace) {
      console.log('DidDocumentStateMachine::didDocActionTable::chainReady:proof=:<',proof,'>');
    }
    ee.emit('did.stm.docstate.internal.proof',{proof:proof});
  },
  chainFail:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidDocumentStateMachine::didDocActionTable::chainFail:context=:<',context,'>');
      console.log('DidDocumentStateMachine::didDocActionTable::chainFail:ee=:<',ee,'>');
      console.log('DidDocumentStateMachine::didDocActionTable::chainFail:chain=:<',chain,'>');
    }
    const proof = chain.calcDidAuth();
    if(LOG.trace) {
      console.log('DidDocumentStateMachine::didDocActionTable::chainFail:proof=:<',proof,'>');
    }
    ee.emit('did.stm.docstate.internal.proof',{proof:proof});
  },
  rootAuthIsSeed:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidDocumentStateMachine::didDocActionTable::authIsSeed:context=:<',context,'>');
      console.log('DidDocumentStateMachine::didDocActionTable::authIsSeed:ee=:<',ee,'>');
      console.log('DidDocumentStateMachine::didDocActionTable::authIsSeed:chain=:<',chain,'>');
    }
    const notify = {
      isSeedRoot:true,
    };
    ee.emit('did.evidence.auth',notify);
  },
  rootAuthBySeed:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidDocumentStateMachine::didDocActionTable::rootAuthBySeed:context=:<',context,'>');
      console.log('DidDocumentStateMachine::didDocActionTable::rootAuthBySeed:ee=:<',ee,'>');
      console.log('DidDocumentStateMachine::didDocActionTable::rootAuthBySeed:chain=:<',chain,'>');
    }
    const notify = {
      bySeedRoot:true,
    };
    ee.emit('did.evidence.auth',notify);
  },
  rootAuthByAuth:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidDocumentStateMachine::didDocActionTable::rootAuthByAuth:context=:<',context,'>');
      console.log('DidDocumentStateMachine::didDocActionTable::rootAuthByAuth:ee=:<',ee,'>');
      console.log('DidDocumentStateMachine::didDocActionTable::rootAuthByAuth:chain=:<',chain,'>');
    }
    const notify = {
      byAuthRoot:true,
    };
    ee.emit('did.evidence.auth',notify);
  },
  rootAuthByNone:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidDocumentStateMachine::didDocActionTable::rootAuthByNone:context=:<',context,'>');
      console.log('DidDocumentStateMachine::didDocActionTable::rootAuthByNone:ee=:<',ee,'>');
      console.log('DidDocumentStateMachine::didDocActionTable::rootAuthByNone:chain=:<',chain,'>');
    }
    const notify = {
      byNoneRoot:true,
    };
    ee.emit('did.evidence.auth',notify);
  },
  leafAuthSeedByCtrl:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidDocumentStateMachine::didDocActionTable::leafAuthSeedByCtrl:context=:<',context,'>');
      console.log('DidDocumentStateMachine::didDocActionTable::leafAuthSeedByCtrl:ee=:<',ee,'>');
      console.log('DidDocumentStateMachine::didDocActionTable::leafAuthSeedByCtrl:chain=:<',chain,'>');
    }
    const notify = {
      byCtrlLeafSeed:true,
    };
    ee.emit('did.evidence.auth',notify);
  },
  leafAuthSeedByNoe:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidDocumentStateMachine::didDocActionTable::leafAuthSeedByNoe:context=:<',context,'>');
      console.log('DidDocumentStateMachine::didDocActionTable::leafAuthSeedByNoe:ee=:<',ee,'>');
      console.log('DidDocumentStateMachine::didDocActionTable::leafAuthSeedByNoe:chain=:<',chain,'>');
    }
    const notify = {
      byNoneLeafSeed:true,
    };
    ee.emit('did.evidence.auth',notify);
  },
  leafAuthByCtrl:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidDocumentStateMachine::didDocActionTable::leafAuthByCtrl:context=:<',context,'>');
      console.log('DidDocumentStateMachine::didDocActionTable::leafAuthByCtrl:ee=:<',ee,'>');
      console.log('DidDocumentStateMachine::didDocActionTable::leafAuthByCtrl:chain=:<',chain,'>');
    }
    const notify = {
      byCtrlLeaf:true,
    };
    ee.emit('did.evidence.auth',notify);
  },
  leafAuthByNoe:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidDocumentStateMachine::didDocActionTable::leafAuthByNoe:context=:<',context,'>');
      console.log('DidDocumentStateMachine::didDocActionTable::leafAuthByNoe:ee=:<',ee,'>');
      console.log('DidDocumentStateMachine::didDocActionTable::leafAuthByNoe:chain=:<',chain,'>');
    }
    const notify = {
      byNoneLeaf:true,
    };
    ee.emit('did.evidence.auth',notify);
  },
};

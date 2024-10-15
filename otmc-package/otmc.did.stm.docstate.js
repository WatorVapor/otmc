import * as xstate  from 'xstate';
import { StoreKey } from './otmc.const.js';
const LOG = {
  trace:true,
  debug:true,
};
if(LOG.trace) {
  console.log('::did::xstate=:<',xstate,'>');
}
import { createMachine, createActor, assign  }  from 'xstate';
import { EvidenceChain } from './did/evidence.use.db.js';



export class DidDocStateMachine {
  constructor(ee) {
    this.trace0 = true;
    this.trace1 = true;
    this.trace = true;
    this.debug = true;
    if(this.trace0) {
      console.log('DidDocStateMachine::constructor::ee=:<',ee,'>');
    }
    this.ee = ee;
    this.chain = false;
    this.createStateMachine_();
    this.ListenEventEmitter_();
  }
  ListenEventEmitter_() {
    if(this.trace0) {
      console.log('DidDocStateMachine::ListenEventEmitter_::this.ee=:<',this.ee,'>');
    }
    const self = this;
    this.ee.on('did:document',(evt)=>{
      if(self.trace0) {
        console.log('DidDocStateMachine::ListenEventEmitter_::evt=:<',evt,'>');
      }
      if(evt.didDoc.auth && evt.didDoc.didDoc_) {
        self.chain = new EvidenceChain(evt.didDoc.auth,evt.didDoc.didDoc_,StoreKey);
        if(self.trace0) {
          console.log('DidDocStateMachine::ListenEventEmitter_::this.stm=:<',this.stm,'>');
        }
        if(self.trace0) {
          console.log('DidDocStateMachine::ListenEventEmitter_::this.stm.config.context=:<',this.stm.config.context,'>');
        }
        this.stm.config.context.chain = self.chain;
        self.ee.emit('did.evidence.load.storage',{chain:self.chain});
      }
    });
    this.ee.on('did:document:evidence.chain',(evt)=>{
      if(self.trace0) {
        console.log('DidDocStateMachine::ListenEventEmitter_::evt=:<',evt,'>');
      }
      if(!evt.manifest) {
        self.actor.send({type:'manifest.lack'});
        return;
      }
      const chainType = self.chain.buildEvidenceProofChain(evt);
      if(self.trace0) {
        console.log('DidDocStateMachine::ListenEventEmitter_::chainType=:<',chainType,'>');
      }
    });
    this.ee.on('did:document:evidence.complete',(evt)=>{
      if(self.trace0) {
        console.log('DidDocStateMachine::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.ee.emit('did.stm.runtime.chain',{chain:self.chain});
      self.actor.send({type:'chain.load'});  
    });

    this.ee.on('did.stm.docstate.internal.proof',(evt)=>{
      if(self.trace1) {
        console.log('DidDocStateMachine::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.actor.send({type:evt.proof});
    });

  }
  
  createStateMachine_() {
    const stmConfig = {
      initial: 'genesis',
      context: {
        ee:this.ee,
        chain:this.chain,
      },
      states: didDocStateTable,
    }
    const stmOption = {
      actions:didDocActionTable,
    }
    if(this.trace) {
      console.log('DidDocStateMachine::createStateMachine_::stmConfig=:<',stmConfig,'>');
    }
    this.stm = createMachine(stmConfig,stmOption);
    if(this.trace0) {
      console.log('DidDocStateMachine::createStateMachine_::this.stm=:<',this.stm,'>');
    }
    this.actor = createActor(this.stm);
    
    const self = this;
    this.actor.subscribe((state) => {
      if(self.trace0) {
        console.log('DidDocStateMachine::createStateMachine_::state=:<',state,'>');
        console.log('DidDocStateMachine::createStateMachine_::self.stm=:<',self.stm,'>');
      }
      if(self.trace) {
        console.log('DidDocStateMachine::createStateMachine_::state.value=:<',state.value,'>');
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
      console.log('DidDocStateMachine::didDocActionTable::init:context=:<',context,'>');
      console.log('DidDocStateMachine::didDocActionTable::init:ee=:<',ee,'>');
      console.log('DidDocStateMachine::didDocActionTable::init:chain=:<',chain,'>');
    }
  },
  chainReady:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidDocStateMachine::didDocActionTable::chainReady:context=:<',context,'>');
      console.log('DidDocStateMachine::didDocActionTable::chainReady:ee=:<',ee,'>');
      console.log('DidDocStateMachine::didDocActionTable::chainReady:chain=:<',chain,'>');
    }
    const proof = chain.calcDidAuth();
    if(LOG.trace) {
      console.log('DidDocStateMachine::didDocActionTable::chainReady:proof=:<',proof,'>');
    }
    ee.emit('did.stm.docstate.internal.proof',{proof:proof});
  },
  chainFail:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidDocStateMachine::didDocActionTable::chainFail:context=:<',context,'>');
      console.log('DidDocStateMachine::didDocActionTable::chainFail:ee=:<',ee,'>');
      console.log('DidDocStateMachine::didDocActionTable::chainFail:chain=:<',chain,'>');
    }
    const proof = chain.calcDidAuth();
    if(LOG.trace) {
      console.log('DidDocStateMachine::didDocActionTable::chainFail:proof=:<',proof,'>');
    }
    ee.emit('did.stm.docstate.internal.proof',{proof:proof});
  },
  rootAuthIsSeed:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidDocStateMachine::didDocActionTable::authIsSeed:context=:<',context,'>');
      console.log('DidDocStateMachine::didDocActionTable::authIsSeed:ee=:<',ee,'>');
      console.log('DidDocStateMachine::didDocActionTable::authIsSeed:chain=:<',chain,'>');
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
      console.log('DidDocStateMachine::didDocActionTable::rootAuthBySeed:context=:<',context,'>');
      console.log('DidDocStateMachine::didDocActionTable::rootAuthBySeed:ee=:<',ee,'>');
      console.log('DidDocStateMachine::didDocActionTable::rootAuthBySeed:chain=:<',chain,'>');
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
      console.log('DidDocStateMachine::didDocActionTable::rootAuthByAuth:context=:<',context,'>');
      console.log('DidDocStateMachine::didDocActionTable::rootAuthByAuth:ee=:<',ee,'>');
      console.log('DidDocStateMachine::didDocActionTable::rootAuthByAuth:chain=:<',chain,'>');
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
      console.log('DidDocStateMachine::didDocActionTable::rootAuthByNone:context=:<',context,'>');
      console.log('DidDocStateMachine::didDocActionTable::rootAuthByNone:ee=:<',ee,'>');
      console.log('DidDocStateMachine::didDocActionTable::rootAuthByNone:chain=:<',chain,'>');
    }
    const notify = {
      byNoneRoot:true,
    };
    ee.emit('did.evidence.auth',notify);
  },
  leafAuthByCtrl:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidDocStateMachine::didDocActionTable::leafAuthByCtrl:context=:<',context,'>');
      console.log('DidDocStateMachine::didDocActionTable::leafAuthByCtrl:ee=:<',ee,'>');
      console.log('DidDocStateMachine::didDocActionTable::leafAuthByCtrl:chain=:<',chain,'>');
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
      console.log('DidDocStateMachine::didDocActionTable::leafAuthByNoe:context=:<',context,'>');
      console.log('DidDocStateMachine::didDocActionTable::leafAuthByNoe:ee=:<',ee,'>');
      console.log('DidDocStateMachine::didDocActionTable::leafAuthByNoe:chain=:<',chain,'>');
    }
    const notify = {
      byNoneLeaf:true,
    };
    ee.emit('did.evidence.auth',notify);
  },
};

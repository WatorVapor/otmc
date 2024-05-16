import * as xstate  from 'xstate';
const LOG = {
  trace:false,
  debug:true,
};
if(LOG.trace) {
  console.log('::did::xstate=:<',xstate,'>');
}
import { createMachine, createActor, assign  }  from 'xstate';
import { EvidenceChain } from './did/evidence.js';



export class DidDocStateMachine {
  constructor(ee) {
    this.trace0 = false;
    this.trace = true;
    this.debug = true;
    if(this.trace) {
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
      if(this.trace) {
        console.log('DidDocStateMachine::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.chain = new EvidenceChain(evt.didDoc.auth,evt.didDoc.didDoc_);
      if(self.trace0) {
        console.log('DidDocStateMachine::ListenEventEmitter_::this.stm=:<',this.stm,'>');
      }
      if(self.trace0) {
        console.log('DidDocStateMachine::ListenEventEmitter_::this.stm.config.context=:<',this.stm.config.context,'>');
      }
      this.stm.config.context.chain = self.chain;
      self.ee.emit('did.evidence.load.storage',{chain:self.chain});
    });
    this.ee.on('did:document:evidence',(evt)=>{
      if(this.trace) {
        console.log('DidDocStateMachine::ListenEventEmitter_::evt=:<',evt,'>');
      }
      if(!evt.manifest) {
        self.actor.send({type:'manifest.lack'});
        return;
      }
      self.chain.buildEvidenceProofChain(evt);
      self.ee.emit('did.stm.runtime.chain',{chain:self.chain});
      self.actor.send({type:'chain.load'});
    });
    this.ee.on('did.stm.docstate.internal.proof',(evt)=>{
      if(this.trace) {
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
      'manifest.lack':'evidenceChainFail',
    } 
  },
  evidenceChainReady: {
    entry:['chainReady'],
    on: {
      'auth.proof.is.seed':'authIsSeed',
      'auth.proof.by.seed':'authBySeed',
      'auth.proof.by.auth':'authByAuth',
      'auth.proof.by.none':'authByNone',
      'capability.proof.by.seed':'capabilityBySeed',
      'capability.proof.by.auth':'capabilityByAuth',
      'capability.proof.by.none':'capabilityByNone',
    } 
  },
  evidenceChainFail: {
    entry:['chainFail'],
    on: {
      'auth.proof.by.none':'authByNone',
      'capability.proof.by.none':'capabilityByNone',
    }
  },
  authIsSeed: {
    entry:['authIsSeed'],
    on: {
    }
  },
  authBySeed: {
    entry:['authBySeed'],
    on: {
    }
  },
  authByAuth: {
    entry:['authByAuth'],
    on: {
    }
  },
  authByNone: {
    entry:['authByNone'],
    on: {
    }
  },
  capabilityBySeed: {
    entry:['capabilityBySeed'],
    on: {
    }
  },
  capabilityByAuth: {
    entry:['capabilityByAuth'],
    on: {
    }
  },
  capabilityByNone: {
    entry:['capabilityByNone'],
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
  authIsSeed:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidDocStateMachine::didDocActionTable::authIsSeed:context=:<',context,'>');
      console.log('DidDocStateMachine::didDocActionTable::authIsSeed:ee=:<',ee,'>');
      console.log('DidDocStateMachine::didDocActionTable::authIsSeed:chain=:<',chain,'>');
    }
    const notify = {
      isSeed:true,
    };
    ee.emit('did.evidence.auth',notify);
  },
  authBySeed:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidDocStateMachine::didDocActionTable::authBySeed:context=:<',context,'>');
      console.log('DidDocStateMachine::didDocActionTable::authBySeed:ee=:<',ee,'>');
      console.log('DidDocStateMachine::didDocActionTable::authBySeed:chain=:<',chain,'>');
    }
    const notify = {
      bySeed:true,
    };
    ee.emit('did.evidence.auth',notify);
  },
  authByAuth:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidDocStateMachine::didDocActionTable::authByAuth:context=:<',context,'>');
      console.log('DidDocStateMachine::didDocActionTable::authByAuth:ee=:<',ee,'>');
      console.log('DidDocStateMachine::didDocActionTable::authByAuth:chain=:<',chain,'>');
    }
    const notify = {
      byAuth:true,
    };
    ee.emit('did.evidence.auth',notify);
  },
  authByNone:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidDocStateMachine::didDocActionTable::authByNone:context=:<',context,'>');
      console.log('DidDocStateMachine::didDocActionTable::authByNone:ee=:<',ee,'>');
      console.log('DidDocStateMachine::didDocActionTable::authByNone:chain=:<',chain,'>');
    }
    const notify = {
      byNone:true,
    };
    ee.emit('did.evidence.auth',notify);
  },
  capabilityBySeed:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidDocStateMachine::didDocActionTable::capabilityBySeed:context=:<',context,'>');
      console.log('DidDocStateMachine::didDocActionTable::capabilityBySeed:ee=:<',ee,'>');
      console.log('DidDocStateMachine::didDocActionTable::capabilityBySeed:chain=:<',chain,'>');
    }
    const notify = {
      bySeed:true,
    };
    ee.emit('did.evidence.capability',notify);
  },
  capabilityByAuth:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidDocStateMachine::didDocActionTable::capabilityByAuth:context=:<',context,'>');
      console.log('DidDocStateMachine::didDocActionTable::capabilityByAuth:ee=:<',ee,'>');
      console.log('DidDocStateMachine::didDocActionTable::capabilityByAuth:chain=:<',chain,'>');
    }
    const notify = {
      byAuth:true,
    };
    ee.emit('did.evidence.capability',notify);
  },
  capabilityByNone:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidDocStateMachine::didDocActionTable::capabilityByNone:context=:<',context,'>');
      console.log('DidDocStateMachine::didDocActionTable::capabilityByNone:ee=:<',ee,'>');
      console.log('DidDocStateMachine::didDocActionTable::capabilityByNone:chain=:<',chain,'>');
    }
    const notify = {
      byNone:true,
    };
    ee.emit('did.evidence.capability',notify);
  },

};

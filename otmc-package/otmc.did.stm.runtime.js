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

export class DidRuntimeStateMachine {
  static otmc = false;
  constructor(ee) {
    this.trace = false;
    this.debug = true;
    if(this.trace) {
      console.log('DidRuntimeStateMachine::constructor::ee=:<',ee,'>');
    }
    this.ee = ee;
    this.createStateMachine_();
    this.ListenEventEmitter_();
  }
  createStateMachine_() {
    const stmConfig = {
      initial: 'genesis',
      context: {
        ee:this.ee,
        chain:this.chain,
      },
      states: didRuntimeStateTable,
    }
    const stmOption = {
      actions:didRuntimeActionTable,
    }
    if(this.trace) {
      console.log('DidRuntimeStateMachine::createStateMachine_::stmConfig=:<',stmConfig,'>');
      console.log('DidRuntimeStateMachine::createStateMachine_::stmOption=:<',stmOption,'>');
    }
    this.stm = createMachine(stmConfig,stmOption);
    this.actor = createActor(this.stm);
    this.actor.subscribe((state) => {
      console.log('DidRuntimeStateMachine::createStateMachine_::state.value=:<',state.value,'>');
    });
    this.actor.start();
    const self = this;
    setTimeout(()=>{
      self.actor.send({type:'init'});
    },1);    
  }
  ListenEventEmitter_() {
    if(this.trace) {
      console.log('DidRuntimeStateMachine::ListenEventEmitter_::this.ee=:<',this.ee,'>');
    }
    const self = this;
    this.ee.on('did.stm.runtime.chain',(evt)=>{
      if(this.trace) {
        console.log('DidRuntimeStateMachine::ListenEventEmitter_::evt=:<',evt,'>');
      }      
      this.stm.config.context.chain = evt.chain;
      self.actor.send({type:'chain.load'});
    });
    this.ee.on('did.evidence.auth',(evt)=>{
      if(self.trace) {
        console.log('DidRuntimeStateMachine::ListenEventEmitter_::evt=:<',evt,'>');
      }      
      self.actor.send({type:'chain.pass.auth.proof'});
    });
  }
}

const didRuntimeStateTable = {
  genesis: {
    on: {
      'init': {
        actions: ['init']
      },
      'chain.load':'evidenceChainReady',
    } 
  },
  evidenceChainReady: {
    entry:['chainReady'],
    on: {
      'chain.pass.auth.proof':'evidenceChainAuthPass',
    } 
  },
  evidenceChainAuthPass: {
    entry:['chainAuthPass'],
    on: {
      'did.merge.document': {
        actions: ['mergeDidDocument']
      }
    } 
  },
}

const didRuntimeActionTable = {
  init: (context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidRuntimeStateMachine::didRuntimeActionTable::init:context=:<',context,'>');
      console.log('DidRuntimeStateMachine::didRuntimeActionTable::init:ee=:<',ee,'>');
      console.log('DidRuntimeStateMachine::didRuntimeActionTable::init:chain=:<',chain,'>');
      console.log('DidRuntimeStateMachine::didRuntimeActionTable::init:evt=:<',evt,'>');
    }
  },
  chainReady:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidRuntimeStateMachine::didRuntimeActionTable::chainReady:context=:<',context,'>');
      console.log('DidRuntimeStateMachine::didRuntimeActionTable::chainReady:ee=:<',ee,'>');
      console.log('DidRuntimeStateMachine::didRuntimeActionTable::chainReady:chain=:<',chain,'>');
    }
  },
  chainAuthPass:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidRuntimeStateMachine::didRuntimeActionTable::chainAuthPass:context=:<',context,'>');
      console.log('DidRuntimeStateMachine::didRuntimeActionTable::chainAuthPass:ee=:<',ee,'>');
      console.log('DidRuntimeStateMachine::didRuntimeActionTable::chainAuthPass:chain=:<',chain,'>');
    }
    const didDocMerge = chain.tryMergeStoredDidDocument();
    if(LOG.trace) {
      console.log('DidRuntimeStateMachine::didRuntimeActionTable::chainAuthPass:didDocMerge=:<',didDocMerge,'>');
    }
    if(didDocMerge) {
      ee.emit('did.document.merge',didDocMerge);
    }
  },
  mergeDidDocument:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidRuntimeStateMachine::didRuntimeActionTable::mergeDidDocument:evt=:<',evt,'>');
      console.log('DidRuntimeStateMachine::didRuntimeActionTable::mergeDidDocument:context=:<',context,'>');
      console.log('DidRuntimeStateMachine::didRuntimeActionTable::mergeDidDocument:ee=:<',ee,'>');
      console.log('DidRuntimeStateMachine::didRuntimeActionTable::mergeDidDocument:chain=:<',chain,'>');
    }
  },
};

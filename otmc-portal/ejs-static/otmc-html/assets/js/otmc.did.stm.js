const LOG = {
  trace:true,
  debug:true,
};
import * as xstate  from 'xstate';
if(LOG.trace) {
  console.log('::did::xstate=:<',xstate,'>');
}
import { createMachine, createActor, assign  }  from 'xstate';
import { EvidenceChain } from './did/evidence.js';



export class DidDocStateMachine {
  static otmc = false;
  static chain = false;
  static instances = {};
  constructor(parentRef) {
    this.trace = true;
    this.debug = true;
    if(this.trace) {
      console.log('DidDocStateMachine::constructor::parentRef=:<',parentRef,'>');
    }
    DidDocStateMachine.otmc = parentRef.otmc;
    const self = this;
    setTimeout(()=>{
      self.createStateMachine_();
    },1)
  }
  createStateMachine_() {
    const stmOption = {
      initial: 'genesis',
      context: {},
      states: didDocStateTable,
    }
    if(this.trace) {
      console.log('DidDocStateMachine::createStateMachine_::stmOption=:<',stmOption,'>');
    }
    this.stm = createMachine(stmOption);
    this.actor = createActor(this.stm);
    DidDocStateMachine.chain = new EvidenceChain(DidDocStateMachine.otmc.did);
    
    this.actor.subscribe((state) => {
      console.log('DidDocStateMachine::createStateMachine_::state=:<',state,'>');
      console.log('DidDocStateMachine::createStateMachine_::state.value=:<',state.value,'>');
      console.log('DidDocStateMachine::createStateMachine_::this.stm=:<',this.stm,'>');
    });
    this.actor.start();
    const self = this;
    setTimeout(()=>{
      self.actor.send({type:'init'});
    },1);
  }
}

const didDocStateTable = {
  genesis: {
    on: {
      'init': {
        actions: assign({ otmc: () => {
          DidDocStateMachine.chain.loadEvidenceChain();
        }})
      },
      'chain.load':'evidenceChainReady',
      'manifest.lack':'evidenceFailure',
    } 
  },
  evidenceChainReady: {
    entry:assign({ otmc: () => {
      DidDocStateMachine.chain.calcDidAuth();
    }}),
    on: {
      'auth.proof.is.seed':'authIsSeed',
      'auth.proof.by.seed':'authBySeed',
      'auth.proof.by.auth':'authByAuth',
      'auth.proof.by.none':'authByNone',
    } 
  },
  evidenceFailure: {
    entry:assign({ otmc: () => {
    }}),
    on: {
    }
  },
  authIsSeed: {
    entry:assign({ otmc: () => {
    }}),
    on: {
    }
  },
  authBySeed: {
    entry:assign({ otmc: () => {
    }}),
    on: {
    }
  },
  authByAuth: {
    entry:assign({ otmc: () => {
    }}),
    on: {
    }
  },
  authByNone: {
    entry:assign({ otmc: () => {
    }}),
    on: {
    }
  },
}



export class DidRuntimeStateMachine {
  static otmc = false;
  static instances = {};
  constructor(parentRef) {
    this.trace = true;
    this.debug = true;
    console.log('DidRuntimeStateMachine::constructor::parentRef=:<',parentRef,'>');
    DidRuntimeStateMachine.otmc = parentRef.otmc;
    const self = this;
    setTimeout(()=>{
      self.createStateMachine_();
    },1)
  }
  createStateMachine_() {
    const stmOption = {
      initial: 'genesis',
      context: {},
      states: didRuntimeStateTable,
    }
    if(this.trace) {
      console.log('DidRuntimeStateMachine::createStateMachine_::stmOption=:<',stmOption,'>');
    }
    const stateMachine = createMachine(stmOption);
    this.actor = createActor(stateMachine);
    this.actor.subscribe((state) => {
      console.log('DidRuntimeStateMachine::createStateMachine_::state.value=:<',state.value,'>');
    });
    this.actor.start();
    this.actor.send({type:'init'});
  }
}

const didRuntimeStateTable = {
  genesis: {
    on: {
      'init': { 
        actions: assign({ otmc: () => {
        }})
      },
    } 
  },
}


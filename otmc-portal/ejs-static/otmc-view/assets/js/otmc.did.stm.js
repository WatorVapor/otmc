import * as xstate  from 'xstate';
console.log('::did::xstate=:<',xstate,'>');
import { createMachine, createActor, assign  }  from 'xstate';

export class DidDocStateMachine {
  static otmc = false;
  static instances = {};
  constructor(parentRef) {
    this.trace = true;
    this.debug = true;
    console.log('DidDocStateMachine::constructor::parentRef=:<',parentRef,'>');
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
    const stateMachine = createMachine(stmOption);
    this.actor = createActor(stateMachine);
    this.actor.subscribe((state) => {
      console.log('DidDocStateMachine::createStateMachine_::state.value=:<',state.value,'>');
    });
    this.actor.start();
    this.actor.send({type:'init'});
  }
}

const didDocStateTable = {
  genesis: {
    on: {
      'init': { 
        actions: assign({ otmc: () => {
        }})
      },
      'edcrypt:address': 'edKeyReady',
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
      'edcrypt:address': 'edKeyReady',
    } 
  },
}


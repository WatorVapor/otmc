import { createMachine, interpret, assign  }  from 'xstate';
/*
console.log('::::createMachine=:<',createMachine,'>');
console.log('::::interpret=:<',interpret,'>');
*/
console.log('::::assign=:<',assign,'>');
/**
*
*/
export class OtmcStateMachine {
  static otmc = false;
  constructor(otmc) {
    this.trace = true;
    this.debug = true;
    console.log('OtmcStateMachine::constructor::otmc=:<',otmc,'>');
    OtmcStateMachine.otmc = otmc;
    const self = this;
    setTimeout(()=>{
      self.createStateMachine_();
    },1)
  }
  
  createStateMachine_() {
    const otmcStateMachine = {
      id: 'otmc',
      initial: 'genesis',
      context: {},      
      states: otmcStateTable,
    }
    if(this.trace) {
      console.log('OtmcStateMachine::createStateMachine_::otmcStateMachine=:<',otmcStateMachine,'>');
    }
    const stateMachine = createMachine(otmcStateMachine);
    this.actor = interpret(stateMachine)
    .onTransition((state) => {
      console.log('OtmcStateMachine::createStateMachine_::state.value=:<',state.value,'>');
    })
    .start();
    this.actor.send('init');
  }
}


const otmcStateTable = {
  genesis: {
    on: {
      'init': { 
        actions:assign({ otmc: () => {
          OtmcStateMachine.otmc.edcrypt.loadKey();
        }})
      },
      'edcrypt:address': 'edKeyReady',      
    } 
  },
  edKeyReady: {
    entry:assign({ otmc: () => {
      OtmcStateMachine.otmc.did.loadDocument();
    }}),
    on: { TOGGLE: 'didReady' } 
  },
  didReady: {
    on: { TOGGLE: 'jwtReady' } 
  },
  jwtReady: {
    on: { TOGGLE: 'mqttService' } 
  },
  mqttService: {
  },  
}




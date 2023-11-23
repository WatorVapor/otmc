import { createMachine, interpret, assign  }  from 'xstate4';
console.log('::::createMachine=:<',createMachine,'>');
console.log('::::interpret=:<',interpret,'>');
console.log('::::assign=:<',assign,'>');
/*
import * as xstate  from 'xstate';
console.log('::::xstate=:<',xstate,'>');
import { createMachine, createActor, assign  }  from 'xstate';
*/


/**
*
*/
export class OtmcStateMachine {
  static otmc = false;
  constructor(parentRef) {
    this.trace = true;
    this.debug = true;
    console.log('OtmcStateMachine::constructor::parentRef=:<',parentRef,'>');
    OtmcStateMachine.otmc = parentRef.otmc;
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
    this.actor.send({ type:'init'});
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
    on: { 'did:document': 'didReady' } 
  },
  didReady: {
    entry:assign({ otmc: () => {
      //console.log('OtmcStateMachine::otmcStateTable::OtmcStateMachine.otmc=:<',OtmcStateMachine.otmc,'>');
      OtmcStateMachine.otmc.mqtt.validateMqttJwt();
    }}),
    on: { TOGGLE: 'jwtReady' } 
  },
  jwtReady: {
    on: { TOGGLE: 'mqttService' } 
  },
  mqttService: {
  },  
}




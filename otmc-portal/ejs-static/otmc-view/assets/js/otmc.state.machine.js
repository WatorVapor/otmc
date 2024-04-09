import * as xstate  from 'xstate';
console.log('::::xstate=:<',xstate,'>');
import { createMachine, createActor, assign  }  from 'xstate';


/**
*
*/
export class OtmcStateMachine {
  static otmc = false;
  static instances = {};
  constructor(parentRef,ee) {
    this.trace = true;
    this.debug = true;
    console.log('OtmcStateMachine::constructor::parentRef=:<',parentRef,'>');
    OtmcStateMachine.otmc = parentRef.otmc;
    OtmcStateMachine.ee = ee;
    const self = this;
    setTimeout(()=>{
      self.createStateMachine_();
    },1)
  }
  
  createStateMachine_() {
    const otmcStateMachine = {
      id: 'otmc',
      initial: 'genesis',
      context: {
        
      },      
      states: otmcStateTable,
    }
    if(this.trace) {
      console.log('OtmcStateMachine::createStateMachine_::otmcStateMachine=:<',otmcStateMachine,'>');
    }
    const stateMachine = createMachine(otmcStateMachine);
    this.actor = createActor(stateMachine);
    this.actor.subscribe((state) => {
      console.log('OtmcStateMachine::createStateMachine_::state.value=:<',state.value,'>');
    });
    this.actor.start();
    this.actor.send({type:'init'});
  }
}


const otmcStateTable = {
  genesis: {
    on: {
      'init': { 
        actions: assign({ otmc: () => {
          //console.log('OtmcStateMachine::otmcStateTable::OtmcStateMachine.otmc=:<',OtmcStateMachine.otmc,'>');
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
    on: {
      'did:document_manifest': 'didReady',
      'did:document': 'didReady'
    } 
  },
  didReady: {
    entry:assign({ otmc: () => {
      //console.log('OtmcStateMachine::otmcStateTable::OtmcStateMachine.otmc=:<',OtmcStateMachine.otmc,'>');
      OtmcStateMachine.otmc.mqtt.validateMqttJwt();
    }}),
    on: { 'mqtt:jwt': 'jwtReady' } 
  },
  jwtReady: {
    entry:assign({ otmc: () => {
      //console.log('OtmcStateMachine::otmcStateTable::OtmcStateMachine.otmc=:<',OtmcStateMachine.otmc,'>');
      OtmcStateMachine.otmc.mqtt.connectMqtt();
    }}),
    on: { 'mqtt:connected': 'mqttService' } 
  },
  mqttService: {
    entry:assign({ otmc: () => {
      //console.log('OtmcStateMachine::otmcStateTable::OtmcStateMachine.otmc=:<',OtmcStateMachine.otmc,'>');
      OtmcStateMachine.otmc.syncDidDocument();
    }}),
  },
}




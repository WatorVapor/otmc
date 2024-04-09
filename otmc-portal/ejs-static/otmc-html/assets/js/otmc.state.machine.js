import * as xstate  from 'xstate';
console.log('::::xstate=:<',xstate,'>');
import { createMachine, createActor, assign  }  from 'xstate';


/**
*
*/
export class OtmcStateMachine {
  static ee = false;
  static instances = {};
  constructor(ee) {
    this.trace = true;
    this.debug = true;
    OtmcStateMachine.ee = ee;
    this.ee = ee;
    this.createStateMachine_();
    this.ListenEventEmitter_();
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
    this.actor = createActor(stateMachine);
    this.actor.subscribe((state) => {
      console.log('OtmcStateMachine::createStateMachine_::state.value=:<',state.value,'>');
    });
    this.actor.start();
    const self = this;
    setTimeout(()=>{
      self.actor.send({type:'init'});
    },1)
  }
  ListenEventEmitter_() {
    if(this.trace) {
      console.log('OtmcStateMachine::ListenEventEmitter_::this.ee=:<',this.ee,'>');
    }
    const self = this;
    this.ee.on('OtmcStateMachine.actor.send',(evt)=>{
      if(self.trace) {
        console.log('OtmcStateMachine::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.actor.send(evt);
    });
  }
}


const otmcStateTable = {
  genesis: {
    on: {
      'init': { 
        actions: assign({ otmc: () => {
          OtmcStateMachine.ee.emit('edcrypt.loadKey',{});
        }})
      },
      'edcrypt:address': 'edKeyReady',
    } 
  },
  edKeyReady: {
    entry:assign({ otmc: () => {
      OtmcStateMachine.ee.emit('did.loadDocument',{});
    }}),
    on: {
      'did:document_manifest': 'didReady',
      'did:document': 'didReady'
    } 
  },
  didReady: {
    entry:assign({ otmc: () => {
      OtmcStateMachine.ee.emit('mqtt.validateMqttJwt',{});
    }}),
    on: { 'mqtt:jwt': 'jwtReady' } 
  },
  jwtReady: {
    entry:assign({ otmc: () => {
      OtmcStateMachine.ee.emit('mqtt.connectMqtt',{});
    }}),
    on: { 'mqtt:connected': 'mqttService' } 
  },
  mqttService: {
    entry:assign({ otmc: () => {
      OtmcStateMachine.ee.emit('otmc.syncDidDocument',{});
    }}),
  },
}




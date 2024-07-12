import * as xstate  from 'xstate';
const LOG = {
  trace0:false,
  trace:true,
  debug:true,
};
if(LOG.trace) {
  console.log('::::xstate=:<',xstate,'>');
}
import { createMachine, createActor, assign  }  from 'xstate';

/**
*
*/
export class OtmcStateMachine {
  static ee = false;
  static instances = {};
  constructor(ee) {
    this.trace0 = false;
    this.trace = true;
    this.debug = true;
    this.ee = ee;
    this.createStateMachine_();
    this.ListenEventEmitter_();
  }
  
  createStateMachine_() {
    const stmConfig = {
      id: 'otmc',
      initial: 'genesis',
      context: {
        ee:this.ee,
      },
      states: otmcStateTable,
    }
    if(this.trace0) {
      console.log('OtmcStateMachine::createStateMachine_::stmConfig=:<',stmConfig,'>');
    }
    const stmOption = {
      actions:otmcActionTable,
    }
    const stateMachine = createMachine(stmConfig,stmOption);
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
    if(this.trace0) {
      console.log('OtmcStateMachine::ListenEventEmitter_::this.ee=:<',this.ee,'>');
    }
    const self = this;
    this.ee.on('OtmcStateMachine.actor.send',(evt)=>{
      if(self.trace0) {
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
        actions: ['init']
      },
      'did:module_ready': 'moduleReady',
    } 
  },
  moduleReady: {
    entry:['moduleReady'],
    on: {
      'edcrypt:address': 'edKeyReady',
    } 
  },
  edKeyReady: {
    entry:['edKeyReady'],
    on: {
      'did:document_manifest': 'didReady',
      'did:document': 'didReady'
    } 
  },
  didReady: {
    entry:['didReady'],
    on: { 'mqtt:jwt': 'jwtReady' } 
  },
  jwtReady: {
    entry:['jwtReady'],
    on: { 'mqtt:connected': 'mqttService' } 
  },
  mqttService: {
    entry:['mqttService'],
    on: { 'mqtt:jwt': 'jwtReady' } 
  },
}


const otmcActionTable = {
  init: (context, evt) => {
    const ee = context.context.ee;
    if(LOG.trace0) {
      console.log('OtmcStateMachine::otmcActionTable::init:context=:<',context,'>');
      console.log('OtmcStateMachine::otmcActionTable::init:ee=:<',ee,'>');
    }
    ee.emit('did.module.load',{});
  },
  moduleReady:(context, evt) => {
    const ee = context.context.ee;
    if(LOG.trace0) {
      console.log('OtmcStateMachine::otmcActionTable::moduleReady:context=:<',context,'>');
      console.log('OtmcStateMachine::otmcActionTable::moduleReady:ee=:<',ee,'>');
    }
    ee.emit('edcrypt.loadKey',{});
  },
  edKeyReady:(context, evt) => {
    const ee = context.context.ee;
    if(LOG.trace0) {
      console.log('OtmcStateMachine::otmcActionTable::edKeyReady:context=:<',context,'>');
      console.log('OtmcStateMachine::otmcActionTable::edKeyReady:ee=:<',ee,'>');
    }
    ee.emit('did.loadDocument',{});
  },
  didReady:(context, evt) => {
    const ee = context.context.ee;
    if(LOG.trace0) {
      console.log('OtmcStateMachine::otmcActionTable::didReady:context=:<',context,'>');
      console.log('OtmcStateMachine::otmcActionTable::didReady:ee=:<',ee,'>');
    }
    ee.emit('mqtt.validateMqttJwt',{});
  },
  jwtReady:(context, evt) => {
    const ee = context.context.ee;
    if(LOG.trace0) {
      console.log('OtmcStateMachine::otmcActionTable::jwtReady:context=:<',context,'>');
      console.log('OtmcStateMachine::otmcActionTable::jwtReady:ee=:<',ee,'>');
    }
    ee.emit('mqtt.connectMqtt',{});
  },
  mqttService:(context, evt) => {
    const ee = context.context.ee;
    if(LOG.trace0) {
      console.log('OtmcStateMachine::otmcActionTable::mqttService:context=:<',context,'>');
      console.log('OtmcStateMachine::otmcActionTable::mqttService:ee=:<',ee,'>');
    }
    ee.emit('otmc.did.client.storage',{});
  },
};


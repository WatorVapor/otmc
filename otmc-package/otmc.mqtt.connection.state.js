const LOG = {
  trace:true,
  debug:true,
};
import { createMachine, createActor, assign  }  from 'xstate';
/**
*
*/
export class MqttConnectionState {
  constructor(ee) {
    this.trace0 = true;
    this.trace1 = true;
    this.trace = true;
    this.debug = true;
    this.ee = ee;
    this.ListenEventEmitter_();
    this.createStateMachine_();
  }
  ListenEventEmitter_() {
    if(this.trace0) {
      console.log('MqttConnectionState::ListenEventEmitter_::this.ee=:<',this.ee,'>');
    }
    const self = this;

    this.ee.on('mqtt.connectMqtt',(evt)=>{
      if(self.trace) {
        console.log('MqttConnectionState::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.actor.send({type:'mqtt.connectMqtt'});
    });
    this.ee.on('mqtt.jwt.ready',(evt)=>{
      if(self.trace0) {
        console.log('MqttConnectionState::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.actor.send({type:'mqtt.jwt.ready'});
    });

    this.ee.on('mqtt.connect.state.event', (evt, payload) => {
      if(self.trace) {
        console.log('MqttConnectionState::ListenEventEmitter_::evt=:<',evt,'>');
        console.log('MqttConnectionState::ListenEventEmitter_::payload=:<',payload,'>');
      }
      self.actor.send({type:evt.evt});
    });
    /*
    this.ee.on('mqtt.state.event.connecting',(evt)=>{
      if(self.trace0) {
        console.log('MqttConnectionState::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.actor.send({type:'mqtt.state.event.connecting'});
    });

    this.ee.on('mqtt.state.event.connected',(evt)=>{
      if(self.trace0) {
        console.log('MqttConnectionState::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.actor.send({type:'mqtt.state.event.connected'});
    });

    this.ee.on('mqtt.state.event.offline',(evt)=>{
      if(self.trace0) {
        console.log('MqttConnectionState::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.actor.send({type:'mqtt.state.event.offline'});
    });
        
    this.ee.on('mqtt.state.event.jwt.refresh',(evt)=>{
      if(self.trace0) {
        console.log('MqttConnectionState::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.actor.send({type:'mqtt.state.event.jwt.refresh'});
    });
*/
  }  
  createStateMachine_() {
    const stmConfig = {
      initial: 'genesis',
      context: {
        ee:this.ee,
      },
      states: mqttConnectionStateTable,
    }
    const stmOption = {
      actions:mqttConnectionActionTable,
    }
    if(this.trace) {
      console.log('MqttConnectionState::createStateMachine_::stmConfig=:<',stmConfig,'>');
    }
    this.stm = createMachine(stmConfig,stmOption);
    if(this.trace0) {
      console.log('MqttConnectionState::createStateMachine_::this.stm=:<',this.stm,'>');
    }
    this.actor = createActor(this.stm);
    
    const self = this;
    this.actor.subscribe((state) => {
      if(self.trace0) {
        console.log('MqttConnectionState::createStateMachine_::state=:<',state,'>');
        console.log('MqttConnectionState::createStateMachine_::self.stm=:<',self.stm,'>');
      }
      if(self.trace) {
        console.log('MqttConnectionState::createStateMachine_::state.value=:<',state.value,'>');
      }
    });
    this.actor.start();
    setTimeout(()=>{
      self.actor.send({type:'init'});
    },1);
  }
}


const mqttConnectionStateTable = {
  genesis: {
    on: {
      'init':'init',
    }
  },
  init: {
    entry:['init'],
    on: {
      'mqtt.connectMqtt': 'jwt_lacking',
      'mqtt.jwt.ready': 'jwt_ready',
    }
  },
  jwt_lacking: {
    on: {
      'mqtt.jwt.ready': 'jwt_ready',
    }
  },
  jwt_ready: {
    entry:['jwt_ready'],
    on: {
      'evt.connecting': 'connecting',
    }
  },
  connecting: {
    on: {
      'evt.connected': 'connected',
    }
  },
  connected: {
    entry:['connected'],
    on: {
      'evt.offline': 'offline',
    }
  },
  offline: {
    on: {
      'evt.reconnect': 'reconnect',
    }
  },
  reconnect: {
    on: {
      'evt.jwt.refresh': 'jwt_refreshing',
      'evt.connected': 'connected',
    }
  },
  jwt_refreshing: {
    entry:['jwt_refreshing'],
    on: {
      'evt.reconnect': 'reconnect',
    }
  },
}

const mqttConnectionActionTable = {
  init: (context) => {
    if(LOG.trace) {
      console.log('MqttConnectionState::mqttConnectionActionTable::init:context=:<',context,'>');
    }
    const ee = context.context.ee;
    if(LOG.trace) {
      console.log('MqttConnectionState::mqttConnectionActionTable::init:ee=:<',ee,'>');
    }
  },
  jwt_ready: (context) => {
    if(LOG.trace) {
      console.log('MqttConnectionState::mqttConnectionActionTable::jwt_ready:context=:<',context,'>');
    }
    const ee = context.context.ee;
    if(LOG.trace) {
      console.log('MqttConnectionState::mqttConnectionActionTable::jwt_ready:ee=:<',ee,'>');
    }
    ee.emit('mqtt.state.action.connect');
  },
  connected: (context) => {
    if(LOG.trace) {
      console.log('MqttConnectionState::mqttConnectionActionTable::connected:context=:<',context,'>');
    }
    const ee = context.context.ee;
    if(LOG.trace) {
      console.log('MqttConnectionState::mqttConnectionActionTable::connected:ee=:<',ee,'>');
    }
    ee.emit('mqtt.state.action.connected');
  },
  jwt_refreshing: (context) => {
    if(LOG.trace) {
      console.log('MqttConnectionState::mqttConnectionActionTable::jwt_refreshing:context=:<',context,'>');
    }
    const ee = context.context.ee;
    if(LOG.trace) {
      console.log('MqttConnectionState::mqttConnectionActionTable::jwt_refreshing:ee=:<',ee,'>');
    }
    ee.emit('mqtt.state.action.jwt.refreshing');
  },
};

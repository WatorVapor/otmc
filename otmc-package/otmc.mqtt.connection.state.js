const LOG = {
  trace:false,
  debug:true,
};
import { createMachine, createActor, assign  }  from 'xstate';
/**
*
*/
export class MqttConnectionState {
  constructor(ee) {
    this.trace0 = false;
    this.trace1 = false;
    this.trace = false;
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
    this.ee.on('sys.authKey.ready',(evt)=>{
      if(self.trace0) {
        console.log('MqttConnectionState::ListenEventEmitter_::evt=:<',evt,'>');
      }
    });
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
      'init': {
        actions: ['init']
      },
    } 
  },
}

const mqttConnectionActionTable = {
  init: (context, evt) => {
    const ee = context.context.ee;
    if(LOG.trace) {
      console.log('MqttConnectionState::mqttConnectionActionTable::init:context=:<',context,'>');
      console.log('MqttConnectionState::mqttConnectionActionTable::init:ee=:<',ee,'>');
    }
  },
};

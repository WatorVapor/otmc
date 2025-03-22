import { createMachine, createActor, assign }  from 'xstate';

export class MqttEncrptStateMachine {
  constructor(ee) {
    this.trace0 = true;
    this.trace1 = true;
    this.trace = true;
    this.debug = true;
    this.ee = ee;
    if(this.trace0) {
      console.log('MqttEncrptStateMachine::constructor::ee=:<',ee,'>');
    }
    this.machine = this.createStateMachine_();
  }
  ListenEventEmitter_() {
    if(this.trace0) {
      console.log('MqttEncrptStateMachine::ListenEventEmitter_::this.ee=:<',this.ee,'>');
    }
  }
  setECDH(ecdh) {
    if(this.trace0) {
      console.log('MqttEncrptStateMachine::setECDH::ecdh=:<',ecdh,'>');
    }
    if(this.trace0) {
      console.log('MqttEncrptStateMachine::setECDH::this.stm=:<',this.stm,'>');
    }
    this.stm.config.context.ecdh = ecdh;
  }
  createStateMachine_() {
    const stmConfig = {
      initial: 'genesis',
      context: {
        ee:this.ee,
        ecdh:null,
      },
      states: mqttEncrptStateTable,
    }
    const stmOption = {
      actions:mqttEncrptActionTable,
    }
    if(this.trace) {
      console.log('MqttEncrptStateMachine::createStateMachine_::stmConfig=:<',stmConfig,'>');
    }
    this.stm = createMachine(stmConfig,stmOption);
    if(this.trace0) {
      console.log('MqttEncrptStateMachine::createStateMachine_::this.stm=:<',this.stm,'>');
    }
    this.actor = createActor(this.stm);
    
    const self = this;
    this.actor.subscribe((state) => {
      if(self.trace0) {
        console.log('MqttEncrptStateMachine::createStateMachine_::state=:<',state,'>');
        console.log('MqttEncrptStateMachine::createStateMachine_::self.stm=:<',self.stm,'>');
      }
      if(self.trace) {
        console.log('MqttEncrptStateMachine::createStateMachine_::state.value=:<',state.value,'>');
      }
    });
    this.actor.start();
  }
}


const LOG = {
  trace:true,
  debug:true,
};


const mqttEncrptStateTable = {
  genesis: {
    on: {
      'init': {
        /*
        actions: assign({
          ecdh: (context, evt) => {
            if(LOG.trace) {
              console.log('MqttEncrptStateMachine::mqttEncrptActionTable::init:context=:<',context,'>');
              console.log('MqttEncrptStateMachine::mqttEncrptActionTable::init:evt=:<',evt,'>');
            }
            return evt.ecdh;
          }
        }),
        */
        actions: ['init'],
        target: "init",
      },
    } 
  },
  init: {
    on: {
      'init': {
        actions: ['init'],
        target: "init",
      },
    }
  },
}

const mqttEncrptActionTable = {
  init: (context, evt) => {
    const ee = context.context.ee;
    if(LOG.trace) {
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::init:context=:<',context,'>');
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::init:ee=:<',ee,'>');
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::init:evt=:<',evt,'>');
    }
  },
};

import { createMachine, createActor }  from 'xstate';


export class MqttEncrptStateMachine {
  constructor(ee) {
    this.trace0 = false;
    this.trace1 = false;
    this.trace = false;
    this.trace10 = true;
    this.debug = true;
    this.ee = ee;
    if(this.trace0) {
      console.log('MqttEncrptStateMachine::constructor::ee=:<',ee,'>');
    }
    this.machine = this.createStateMachine_();
    this.ListenEventEmitter_();
  }
  ListenEventEmitter_() {
    if(this.trace0) {
      console.log('MqttEncrptStateMachine::ListenEventEmitter_::this.ee=:<',this.ee,'>');
    }
    const self = this;

    this.ee.on('otmc.mqtt.cluster.state.change',async (evt)=>{
      if(self.trace10) {
        console.log('MqttEncrptStateMachine::ListenEventEmitter_::evt=:<',evt,'>');
      }
      if(evt.role == 'follower') {
        self.actor.send({type:'role-change-follower'});
      } else if(evt.role == 'leader') {
        self.actor.send({type:'role-change-leader'});
      }
    });
  }
  setECDH(ecdh) {
    if(this.trace0) {
      console.log('MqttEncrptStateMachine::setECDH::ecdh=:<',ecdh,'>');
    }
    if(this.trace0) {
      console.log('MqttEncrptStateMachine::setECDH::this.stm=:<',this.stm,'>');
    }
    this.stm.config.context.ecdh = ecdh;
    this.actor.send({type:'init'});
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
      if(self.trace10) {
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
        target: "init",
      },
    } 
  },
  init: {
    entry: ['init_entry'],
    on: {
      'role-change-leader': {
        target: 'role_leader',
      },
      'role-change-follower': {
        target: 'role_follower',
      },
    }
  },
  role_leader: {
    entry: ['role_leader_entry'],
    on: {
      'role-change-follower': {
        target: 'role_follower',
      },
    }
  },
  role_follower: {
    entry: ['role_follower_entry'],
    on: {
      'role-change-leader': {
        target: 'role_leader',
      },
    },
  },
};

const mqttEncrptActionTable = {
  init_entry: async (context) => {
    if(LOG.trace) {
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::init_entry:context=:<',context,'>');
    }
    const ee = context.context.ee;
    const ecdh = context.context.ecdh;
    const evt = context.context.event;
    if(LOG.trace) {
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::init_entry:ee=:<',ee,'>');
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::init_entry:ecdh=:<',ecdh,'>');
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::init_entry:evt=:<',evt,'>');
    }
  },
  init: (context) => {
    if(LOG.trace) {
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::init:context=:<',context,'>');
    }
    const ee = context.context.ee;
    const evt = context.context.event;
    if(LOG.trace) {
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::init:ee=:<',ee,'>');
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::init:evt=:<',evt,'>');
    }
  },
  role_leader_entry: async (context) => {
    if(LOG.trace) {
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::role_leader_entry:context=:<',context,'>');
    }
    const ee = context.context.ee;
    const ecdh = context.context.ecdh;
    const evt = context.context.event;
    if(LOG.trace) {
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::role_leader_entry:ee=:<',ee,'>');
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::role_leader_entry:ecdh=:<',ecdh,'>');
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::role_leader_entry:evt=:<',evt,'>');
    }
    /*
    await ecdh.loadMyECKey();
    await ecdh.loadMemeberPubKey();
    ee.emit('xstate.action.mqtt.publish.ecdh.pubkey',{});
    await ecdh.calcSharedKeysOfNode();
    setTimeout(()=>{
      ee.emit('xstate.event.mqtt.encrypt.servant.vote.check',{});
    },1);
    await ecdh.loadSharedKeyOfTeamSpace();
    */
  },
  role_follower_entry: async (context) => {
    if(LOG.trace) {
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::role_follower_entry:context=:<',context,'>');
    }
    const ee = context.context.ee;
    const ecdh = context.context.ecdh;
    const evt = context.context.event;
    if(LOG.trace) {
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::role_follower_entry:ee=:<',ee,'>');
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::role_follower_entry:ecdh=:<',ecdh,'>');
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::role_follower_entry:evt=:<',evt,'>');
    }
  }
};

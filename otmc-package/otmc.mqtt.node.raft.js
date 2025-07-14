import { createMachine, createActor }  from 'xstate';

export class MqttNodeRaftState {
  constructor(ee) {
    this.trace0 = false;
    this.trace1 = false;
    this.trace10 = true;
    this.trace = true;
    this.debug = true;
    this.ee = ee;
    if(this.trace0) {
      console.log('MqttNodeRaftState::constructor::ee=:<',ee,'>');
    }
    this.machine = this.createStateMachine_();
    this.ListenEventEmitter_();
  }
  getTerm() {
    const term = this.actor.getSnapshot().context.term;
    if(this.trace10) {
      console.log('MqttNodeRaftState::getTerm::term=:<',term,'>');
    }
    return term;
  }
  ListenEventEmitter_() {
    if(this.trace0) {
      console.log('MqttNodeRaftState::ListenEventEmitter_::this.ee=:<',this.ee,'>');
    }
    const self = this;
    this.ee.on('otmc.mqtt.node.raft.event',(evt,payload)=>{
      if(self.trace10) {
        console.log('MqttNodeRaftState::ListenEventEmitter_::evt=:<',evt,'>');
        console.log('MqttNodeRaftState::ListenEventEmitter_::payload=:<',payload,'>');
      }
      self.actor.send({type:evt.type,payload:payload});
    });
  }
  createStateMachine_() {
    const stmConfig = {
      initial: 'init',
      id:'raft',
      context: {
        ee:this.ee,
        term: 0,
        votesReceived: 0
      },
      states: mqttEncrptRaftStateTable,
    }
    const stmOption = {
      actions:mqttEncrptRaftActionTable,
    }
    if(this.trace) {
      console.log('MqttNodeRaftState::createStateMachine_::stmConfig=:<',stmConfig,'>');
    }
    this.stm = createMachine(stmConfig,stmOption);
    if(this.trace0) {
      console.log('MqttNodeRaftState::createStateMachine_::this.stm=:<',this.stm,'>');
    }
    this.actor = createActor(this.stm);
    
    const self = this;
    this.actor.subscribe((state) => {
      if(self.trace10) {
        console.log('MqttNodeRaftState::createStateMachine_::state=:<',state,'>');
        console.log('MqttNodeRaftState::createStateMachine_::self.stm=:<',self.stm,'>');
      }
      if(self.trace10) {
        console.log('MqttNodeRaftState::createStateMachine_::state.value=:<',state.value,'>');
      }
    });
    this.actor.start();
  }
}


const LOG = {
  trace:true,
  debug:true,
};


const mqttEncrptRaftStateTable = {
  init: {
    on: {
      MQTT_CONNECTED: {
        target: 'follower',
      }
    }
  },
  follower: {
    entry: ['follower_entry'],
    exit: ['follower_leave'],
    on: {
      HEATBEAT_TIMEOUT: {
        target: 'candidate',
        //actions: ['election_timeout_action'],
      },
      ELECTION_TIMEOUT: {
        target: 'candidate',
        //actions: ['election_timeout_action'],
      },
      LEADER_HEARTBEAT: {
        target: 'follower',
        actions: ['leader_heartbeat_action'],
      },
      DISCOVER_HIGHER_TERM: {
        actions: ['discover_higher_term_action'],
      }
    }
  },
  candidate: {
    entry: ['candidate_entry'],
    exit: ['candidate_leave'],
    on: {
      VOTE_GRANTED: {
        actions: [
          'vote_granted_action',
        ],
        target: 'leader',
        cond: (ctx) => ctx.votesReceived + 1 >= 3 
      },
      DISCOVER_HIGHER_TERM: {
        target: 'follower',
        actions: ['discover_higher_term_action'],
      }
    }
  },
  leader: {
    entry: ['leader_entry'],
    exit: ['leader_leave'],
    on: {
      DISCOVER_HIGHER_TERM: {
        target: 'follower',
        actions: ['discover_higher_term_action'],
      }
    }
  }
}

const mqttEncrptRaftActionTable = {
  follower_entry: async (context, evt) => {
    const ee = context.context.ee;
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttEncrptActionTable::follower_entry:context=:<',context,'>');
      console.log('MqttNodeRaftState::mqttEncrptActionTable::follower_entry:ee=:<',ee,'>');
      console.log('MqttNodeRaftState::mqttEncrptActionTable::follower_entry:evt=:<',evt,'>');
    }
    ee.emit('otmc.mqtt.node.raft.action',{type:'entry_follower'},{});
  },
  follower_leave: async (context, evt) => {
    const ee = context.context.ee;
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttEncrptActionTable::follower_leave:context=:<',context,'>');
      console.log('MqttNodeRaftState::mqttEncrptActionTable::follower_leave:ee=:<',ee,'>');
      console.log('MqttNodeRaftState::mqttEncrptActionTable::follower_leave:evt=:<',evt,'>');
    }
    ee.emit('otmc.mqtt.node.raft.action',{type:'leave_follower'},{});
  },
  candidate_entry: async (context, evt) => {
    const ee = context.context.ee;
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttEncrptActionTable::candidate_entry:context=:<',context,'>');
      console.log('MqttNodeRaftState::mqttEncrptActionTable::candidate_entry:ee=:<',ee,'>');
      console.log('MqttNodeRaftState::mqttEncrptActionTable::candidate_entry:evt=:<',evt,'>');
    }
    ee.emit('otmc.mqtt.node.raft.action',{type:'entry_candidate'},{});

  },
  candidate_leave: async (context, evt) => {
    const ee = context.context.ee;
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttEncrptActionTable::candidate_leave:context=:<',context,'>');
      console.log('MqttNodeRaftState::mqttEncrptActionTable::candidate_leave:ee=:<',ee,'>');
      console.log('MqttNodeRaftState::mqttEncrptActionTable::candidate_leave:evt=:<',evt,'>');
    }
  },
  leader_entry: async (context, evt) => {
    const ee = context.context.ee;
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttEncrptActionTable::leader_entry:context=:<',context,'>');
      console.log('MqttNodeRaftState::mqttEncrptActionTable::leader_entry:ee=:<',ee,'>');
      console.log('MqttNodeRaftState::mqttEncrptActionTable::leader_entry:evt=:<',evt,'>');
    }
  },
  leader_leave: async (context, evt) => {
    const ee = context.context.ee;
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttEncrptActionTable::leader_leave:context=:<',context,'>');
      console.log('MqttNodeRaftState::mqttEncrptActionTable::leader_leave:ee=:<',ee,'>');
      console.log('MqttNodeRaftState::mqttEncrptActionTable::leader_leave:evt=:<',evt,'>');
    }
  },

  election_timeout_action: async (context, evt) => {
    const ee = context.context.ee;
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttEncrptActionTable::election_timeout_action:context=:<',context,'>');
      console.log('MqttNodeRaftState::mqttEncrptActionTable::election_timeout_action:ee=:<',ee,'>');
      console.log('MqttNodeRaftState::mqttEncrptActionTable::election_timeout_action:evt=:<',evt,'>');
    }
  },
};

import { createMachine, createActor }  from 'xstate';

export class MqttEncrptRaftState {
  constructor(ee) {
    this.trace0 = false;
    this.trace1 = false;
    this.trace10 = true;
    this.trace = false;
    this.debug = true;
    this.ee = ee;
    if(this.trace0) {
      console.log('MqttEncrptRaftState::constructor::ee=:<',ee,'>');
    }
    this.machine = this.createStateMachine_();
    this.ListenEventEmitter_();
  }
  ListenEventEmitter_() {
    if(this.trace0) {
      console.log('MqttEncrptRaftState::ListenEventEmitter_::this.ee=:<',this.ee,'>');
    }
    const self = this;
    this.ee.on('otmc.mqtt.encrypt.raft.event',(evt,payload)=>{
      if(self.trace10) {
        console.log('MqttEncrptRaftState::ListenEventEmitter_::evt=:<',evt,'>');
        console.log('MqttEncrptRaftState::ListenEventEmitter_::payload=:<',payload,'>');
      }
      self.actor.send({type:evt.type,payload:payload});
    });
  }
  createStateMachine_() {
    const stmConfig = {
      initial: 'follower',
      id:'raft',
      context: {
        ee:this.ee,
        ecdh:null,
        term: 0,
        votesReceived: 0
      },
      states: mqttEncrptRaftStateTable,
    }
    const stmOption = {
      actions:mqttEncrptRaftActionTable,
    }
    if(this.trace) {
      console.log('MqttEncrptRaftState::createStateMachine_::stmConfig=:<',stmConfig,'>');
    }
    this.stm = createMachine(stmConfig,stmOption);
    if(this.trace0) {
      console.log('MqttEncrptRaftState::createStateMachine_::this.stm=:<',this.stm,'>');
    }
    this.actor = createActor(this.stm);
    
    const self = this;
    this.actor.subscribe((state) => {
      if(self.trace10) {
        console.log('MqttEncrptRaftState::createStateMachine_::state=:<',state,'>');
        console.log('MqttEncrptRaftState::createStateMachine_::self.stm=:<',self.stm,'>');
      }
      if(self.trace10) {
        console.log('MqttEncrptRaftState::createStateMachine_::state.value=:<',state.value,'>');
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
  follower: {
    entry: ['follower_entry'],
    on: {
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
      console.log('MqttEncrptRaftState::mqttEncrptActionTable::follower_entry:context=:<',context,'>');
      console.log('MqttEncrptRaftState::mqttEncrptActionTable::follower_entry:ee=:<',ee,'>');
      console.log('MqttEncrptRaftState::mqttEncrptActionTable::follower_entry:evt=:<',evt,'>');
    }
  },
  candidate_entry: async (context, evt) => {
    const ee = context.context.ee;
    if(LOG.trace) {
      console.log('MqttEncrptRaftState::mqttEncrptActionTable::candidate_entry:context=:<',context,'>');
      console.log('MqttEncrptRaftState::mqttEncrptActionTable::candidate_entry:ee=:<',ee,'>');
      console.log('MqttEncrptRaftState::mqttEncrptActionTable::candidate_entry:evt=:<',evt,'>');
    }
  },
  candidate_entry: async (context, evt) => {
    const ee = context.context.ee;
    if(LOG.trace) {
      console.log('MqttEncrptRaftState::mqttEncrptActionTable::leader_entry:context=:<',context,'>');
      console.log('MqttEncrptRaftState::mqttEncrptActionTable::leader_entry:ee=:<',ee,'>');
      console.log('MqttEncrptRaftState::mqttEncrptActionTable::leader_entry:evt=:<',evt,'>');
    }
  },
  election_timeout_action: async (context, evt) => {
    const ee = context.context.ee;
    if(LOG.trace) {
      console.log('MqttEncrptRaftState::mqttEncrptActionTable::election_timeout_action:context=:<',context,'>');
      console.log('MqttEncrptRaftState::mqttEncrptActionTable::election_timeout_action:ee=:<',ee,'>');
      console.log('MqttEncrptRaftState::mqttEncrptActionTable::election_timeout_action:evt=:<',evt,'>');
    }
  },
};

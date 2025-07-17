import { createMachine, createActor ,assign}  from 'xstate';

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
        weight: Math.random(),
        votesReceived: 0
      },
      states: mqttNodeRaftStateTable,

    }
    const stmOption = {
      actions:mqttNodeRaftActionTable,
    }
    if(this.trace) {
      console.log('MqttNodeRaftState::createStateMachine_::stmConfig=:<',stmConfig,'>');
    }
    this.stm = createMachine(stmConfig,stmOption);
    if(this.trace0) {
      console.log('MqttNodeRaftState::createStateMachine_::this.stm=:<',this.stm,'>');
    }
    this.actor = createActor(this.stm);
    if(this.trace10) {
      console.log('MqttNodeRaftState::createStateMachine_::this.actor=:<',this.actor,'>');
    }    
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


const mqttNodeRaftStateTable = {
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
      VOTE_REQUEST: {
        target: 'follower',
        actions: ['vote_request_follower_action'],
      },
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
      VOTE_REQUEST: {
        actions: [
          'vote_request_candidate_action'
        ],
        target: 'candidate',
      },
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
      VOTE_REQUEST: {
        target: 'leader',
        actions: ['vote_request_leader_action'],
      },
      DISCOVER_HIGHER_TERM: {
        target: 'follower',
        actions: ['discover_higher_term_action'],
      }
    }
  }
}

const mqttNodeRaftActionTable = {
  follower_entry: (context, evt) => {
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::follower_entry:context=:<',context,'>');
    }
    const ee = context.context.ee;
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::follower_entry:ee=:<',ee,'>');
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::follower_entry:evt=:<',evt,'>');
    }
    ee.emit('otmc.mqtt.node.raft.action',{type:'entry_follower'},{});
  },
  follower_leave: (context, evt) => {
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::follower_leave:context=:<',context,'>');
    }
    const ee = context.context.ee;
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::follower_leave:ee=:<',ee,'>');
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::follower_leave:evt=:<',evt,'>');
    }
    ee.emit('otmc.mqtt.node.raft.action',{type:'leave_follower'},{});
  },
  candidate_entry: (context, evt) => {
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::candidate_entry:context=:<',context,'>');
    }
    const ee = context.context.ee;
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::candidate_entry:ee=:<',ee,'>');
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::candidate_entry:evt=:<',evt,'>');
    }
    const weight = context.context.weight;
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::candidate_entry:weight=:<',weight,'>');
    }
    ee.emit('otmc.mqtt.node.raft.action',{type:'entry_candidate'},{weight:weight});

  },
  candidate_leave: (context, evt) => {
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::candidate_leave:context=:<',context,'>');
    }
    const ee = context.context.ee;
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::candidate_leave:ee=:<',ee,'>');
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::candidate_leave:evt=:<',evt,'>');
    }
  },
  leader_entry: (context, evt) => {
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::leader_entry:context=:<',context,'>');
    }
    const ee = context.context.ee;
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::leader_entry:ee=:<',ee,'>');
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::leader_entry:evt=:<',evt,'>');
    }
  },
  leader_leave: (context, evt) => {
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::leader_leave:context=:<',context,'>');
    }
    const ee = context.context.ee;
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::leader_leave:ee=:<',ee,'>');
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::leader_leave:evt=:<',evt,'>');
    }
  },

  election_timeout_action: (context, evt) => {
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::election_timeout_action:context=:<',context,'>');
    }
    const ee = context.context.ee;
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::election_timeout_action:ee=:<',ee,'>');
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::election_timeout_action:evt=:<',evt,'>');
    }
  },


  // action of vote request.
  vote_request_follower_action: (context, evt) => {
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::vote_request_follower_action:context=:<',context,'>');
    }
    const ee = context.context.ee;
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::vote_request_follower_action:ee=:<',ee,'>');
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::vote_request_follower_action:evt=:<',evt,'>');
    }
    const termLocal = context.context.term;
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::vote_request_candidate_action:termLocal=:<',termLocal,'>');
    }
    const remoteVote = evt.payload.vote;
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::vote_request_candidate_action:remoteVote=:<',remoteVote,'>');
    }
    if(termLocal > remoteVote.term) {
      remoteVote.reason = `termLocal ${termLocal} > remoteVote.term ${remoteVote.term}`;
      ee.emit('otmc.mqtt.node.raft.action',{type:'refuse_vote'},remoteVote);
    } else {
      ee.emit('otmc.mqtt.node.raft.action',{type:'agree_vote'},remoteVote);
    }
  },
  vote_request_candidate_action: (context) => {
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::vote_request_candidate_action:context=:<',context,'>');
    }
    const ee = context.context.ee;
    const evt = context.event;
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::vote_request_candidate_action:ee=:<',ee,'>');
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::vote_request_candidate_action:evt=:<',evt,'>');
    }
    const termLocal = context.context.term;
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::vote_request_candidate_action:termLocal=:<',termLocal,'>');
    }
    const remoteVote = evt.payload.vote;
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::vote_request_candidate_action:remoteVote=:<',remoteVote,'>');
    }
    if(termLocal < remoteVote.term) {
      ee.emit('otmc.mqtt.node.raft.action',{type:'vote_agreed'},remoteVote);
    }
    if(termLocal === remoteVote.term) {
      const weightLocal = context.context.weight;
      if(LOG.trace) {
        console.log('MqttNodeRaftState::mqttNodeRaftActionTable::vote_request_candidate_action:weightLocal=:<',weightLocal,'>');
      }
      if(weightLocal > remoteVote.weight) {
      remoteVote.reason = `weightLocal ${weightLocal} > remoteVote.weight ${remoteVote.weight}`;
        ee.emit('otmc.mqtt.node.raft.action',{type:'refuse_vote'},remoteVote);
      } else {
        ee.emit('otmc.mqtt.node.raft.action',{type:'agree_vote'},remoteVote);
      }
    }
    if(termLocal > remoteVote.term) {
      remoteVote.reason = `termLocal ${termLocal} > remoteVote.term ${remoteVote.term}`;
      ee.emit('otmc.mqtt.node.raft.action',{type:'refuse_vote'},remoteVote);
    }
  },
  vote_request_leader_action: (context, evt) => {
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::vote_request_leader_action:context=:<',context,'>');
    }
    const ee = context.context.ee;
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::vote_request_leader_action:ee=:<',ee,'>');
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::vote_request_leader_action:evt=:<',evt,'>');
    }
    const remoteVote = evt.payload.vote;
    if(LOG.trace) {
      console.log('MqttNodeRaftState::mqttNodeRaftActionTable::vote_request_leader_action:remoteVote=:<',remoteVote,'>');
    }
    remoteVote.reason = `leader is here`;
    ee.emit('otmc.mqtt.node.raft.action',{type:'refuse_vote'},remoteVote);
  },

};

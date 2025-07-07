import { createMachine, createActor }  from 'xstate';
const kVoteDeadline = 3*1000;
const kVoteFactor = 0.001;

export class MqttEncrptRaftState {
  constructor(ee) {
    this.trace0 = false;
    this.trace1 = false;
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
    this.ee.on('xxxx',(evt)=>{
      if(self.trace0) {
        console.log('MqttEncrptRaftState::ListenEventEmitter_::evt=:<',evt,'>');
      }
    });
  }
  createStateMachine_() {
    const stmConfig = {
      initial: 'follower',
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
      if(self.trace0) {
        console.log('MqttEncrptRaftState::createStateMachine_::state=:<',state,'>');
        console.log('MqttEncrptRaftState::createStateMachine_::self.stm=:<',self.stm,'>');
      }
      if(self.trace) {
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
    on: {
      ELECTION_TIMEOUT: {
        target: 'candidate',
        actions: assign({
          term: (ctx) => ctx.term + 1,
          votesReceived: () => 1 
        })
      },
      LEADER_HEARTBEAT: {
        target: 'follower'
      },
      DISCOVER_HIGHER_TERM: {
        actions: assign({
          term: (_, event) => event.term
        })
      }
    }
  },
  candidate: {
    on: {
      VOTE_GRANTED: {
        actions: assign({
          votesReceived: (ctx) => ctx.votesReceived + 1
        }),
        target: 'leader',
        cond: (ctx) => ctx.votesReceived + 1 >= 3 
      },
      DISCOVER_HIGHER_TERM: {
        target: 'follower',
        actions: assign({
          term: (_, event) => event.term,
          votesReceived: () => 0
        })
      }
    }
  },
  leader: {
    on: {
      DISCOVER_HIGHER_TERM: {
        target: 'follower',
        actions: assign({
          term: (_, event) => event.term
        })
      }
    }
  }
}

const mqttEncrptRaftActionTable = {
  init_entry: async (context, evt) => {
    const ee = context.context.ee;
    const ecdh = context.context.ecdh;
    if(LOG.trace) {
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::init_entry:context=:<',context,'>');
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::init_entry:ee=:<',ee,'>');
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::init_entry:ecdh=:<',ecdh,'>');
    }
  },
  init: (context, evt) => {
    const ee = context.context.ee;
    if(LOG.trace) {
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::init:context=:<',context,'>');
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::init:ee=:<',ee,'>');
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::init:evt=:<',evt,'>');
    }
  },
  did_document_loaded_entry: async (context, evt) => {
    const ee = context.context.ee;
    const ecdh = context.context.ecdh;
    if(LOG.trace) {
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::init_entry:context=:<',context,'>');
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::init_entry:ee=:<',ee,'>');
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::init_entry:ecdh=:<',ecdh,'>');
    }
    await ecdh.loadMyECKey();
    await ecdh.loadMemeberPubKey();
    ee.emit('xstate.action.mqtt.publish.ecdh.pubkey',{});
    await ecdh.calcSharedKeysOfNode();
    setTimeout(()=>{
      ee.emit('xstate.event.mqtt.encrypt.servant.vote.check',{});
    },1);
    await ecdh.loadSharedKeyOfTeamSpace();
  },
  vote_checking_entry: async (context, evt) => {
    const ee = context.context.ee;
    const ecdh = context.context.ecdh;
    if(LOG.trace) {
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::vote_checking_entry:context=:<',context,'>');
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::vote_checking_entry:ee=:<',ee,'>');
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::vote_checking_entry:ecdh=:<',ecdh,'>');
    }
    const voteCheckResult = await ecdh.checkServantVoteExpired();
    if(LOG.trace) {
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::vote_checking_entry:voteCheckResult=:<',voteCheckResult,'>');
    }
    if(voteCheckResult.reVote) {
      ee.emit('xstate.action.mqtt.encrypt.servant.vote.refresh',voteCheckResult);
    } else {
      const voteEvidence = await ecdh.getServantVoteInTimeBound();
      if(LOG.trace) {
        console.log('MqttEncrptStateMachine::mqttEncrptActionTable::vote_checking_entry:voteEvidence=:<',voteEvidence,'>');
      }
      ee.emit('xstate.action.mqtt.encrypt.servant.announcement',voteEvidence);
    }
    const timeoutOfVoteDeadline = ecdh.voteTimeout*kVoteFactor + kVoteDeadline;
    if(LOG.trace) {
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::vote_checking_entry:timeoutOfVoteDeadline=:<',timeoutOfVoteDeadline,'>');
    }
    setTimeout(()=>{
      ee.emit('xstate.event.mqtt.encrypt.servant.vote.deadline',voteCheckResult);
    },timeoutOfVoteDeadline);
  },
  servant_vote_complete_entry: async (context, evt) => {
    const ee = context.context.ee;
    const ecdh = context.context.ecdh;
    if(LOG.trace) {
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::servant_vote_complete_entry:context=:<',context,'>');
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::servant_vote_complete_entry:ee=:<',ee,'>');
    }
    const voteCheckResult = await ecdh.collectServantVoteAtDeadline();
    if(LOG.trace) {
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::servant_vote_complete_entry:voteCheckResult=:<',voteCheckResult,'>');
    }
    if(voteCheckResult.servant){
      ee.emit('xstate.event.mqtt.encrypt.servant.ready',voteCheckResult);
    } else {
      ee.emit('xstate.event.mqtt.encrypt.master.ready',voteCheckResult);
    }
  },
  ready_as_servant_entry: async (context, evt) => {
    const ee = context.context.ee;
    const ecdh = context.context.ecdh;
    if(LOG.trace) {
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::ready_as_servant_entry:context=:<',context,'>');
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::ready_as_servant_entry:ee=:<',ee,'>');
    }
    ee.emit('xstate.action.mqtt.encrypt.servant.ready',{});
  },
  ready_as_master_entry: async (context, evt) => {
    const ee = context.context.ee;
    const ecdh = context.context.ecdh;
    if(LOG.trace) {
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::ready_as_master_entry:context=:<',context,'>');
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::ready_as_master_entry:ee=:<',ee,'>');
    }
    ee.emit('xstate.action.mqtt.encrypt.master.ready',{});
  }
};

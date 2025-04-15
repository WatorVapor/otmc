import { createMachine, createActor }  from 'xstate';
const kVoteDeadline = 3*1000;
const kVoteFactor = 0.001;

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
    this.ListenEventEmitter_();
  }
  ListenEventEmitter_() {
    if(this.trace0) {
      console.log('MqttEncrptStateMachine::ListenEventEmitter_::this.ee=:<',this.ee,'>');
    }
    const self = this;
    this.ee.on('did:document',(evt)=>{
      if(self.trace0) {
        console.log('MqttEncrptStateMachine::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.actor.send({type:'did-document'});
    });
    this.ee.on('xstate.event.mqtt.encrypt.servant.vote.check',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncrptStateMachine::ListenEventEmitter_::evt=:<',evt,'>');
      }
      this.actor.send({type:'vote-check'});
    });
    this.ee.on('xstate.event.mqtt.encrypt.servant.vote.deadline',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncrptStateMachine::ListenEventEmitter_::evt=:<',evt,'>');
      }
      this.actor.send({type:'vote-check-deadline'});
    });
    this.ee.on('xstate.event.mqtt.encrypt.servant.ready',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncrptStateMachine::ListenEventEmitter_::evt=:<',evt,'>');
      }
      this.actor.send({type:'vote-servant-ready'});
    });
    this.ee.on('xstate.event.mqtt.encrypt.master.ready',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncrptStateMachine::ListenEventEmitter_::evt=:<',evt,'>');
      }
      this.actor.send({type:'vote-master-ready'});
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
        target: "init",
      },
    } 
  },
  init: {
    entry: ['init_entry'],
    on: {
      'did-document': {
        target: 'did_document_loaded',
      },
    }
  },
  did_document_loaded: {
    entry: ['did_document_loaded_entry'],
    on: {
      'vote-check': {
        target: 'vote_checking',
      },
    }
  },
  vote_checking: {
    entry: ['vote_checking_entry'],
    on: {
      'vote-refresh': {
        target: 'servant_vote_refresh',
      },
      'servant-share-team-secret': {
        target: 'servant_share_secret',
      },
      'vote-check-deadline': {
        target:'servant_vote_complete',
      },
    }
  },
  servant_vote_complete: {
    entry: ['servant_vote_complete_entry'],
    on: {
      'vote-servant-ready': {
        target:'ready_as_servant',
      },
      'vote-master-ready': {
        target:'ready_as_master',
      },
    }
  },
  servant_vote_refresh: {
    entry: ['servant_vote_refresh_entry'], 
    on: {
      'vote-refresh-result': {
        target:'servant_vote_refresh',
      },
    }
  },
  servant_share_secret: {
    entry: ['servant_share_secret_entry'],
    on: {
      'vote-refresh': {
        target:'servant_vote_refresh',
      },
    }
  },
  ready_as_servant: {
    entry: ['ready_as_servant_entry'],
  },
  ready_as_master: {
    entry: ['ready_as_master_entry'],
  },
}

const mqttEncrptActionTable = {
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

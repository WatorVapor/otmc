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
    ee.emit('xstate.internal.mqtt.publish.ecdh.pubkey',{});
    await ecdh.calcSharedKeysOfNode();
    setTimeout(()=>{
      ee.emit('xstate.internal.mqtt.encrypt.servant.vote.check',{});
    },1);
  },
  vote_checking_entry: async (context, evt) => {
    const ee = context.context.ee;
    const ecdh = context.context.ecdh;
    if(LOG.trace) {
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::vote_checking_entry:context=:<',context,'>');
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::vote_checking_entry:ee=:<',ee,'>');
      console.log('MqttEncrptStateMachine::mqttEncrptActionTable::vote_checking_entry:ecdh=:<',ecdh,'>');
    }
    //const voteCheckResult = await ecdh.checkServantVote(self.otmc.did.didDoc_.id);
  },

};

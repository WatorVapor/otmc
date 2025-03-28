import { MqttEncryptECDH } from './otmc.mqtt.encrypt.ecdh.js';
import { MqttEncrptStateMachine } from './otmc.mqtt.encrypt.state.js';
/**
*
*/
export class MqttEncryptChannel {
  constructor(eeInternal) {
    this.ee = eeInternal;
    this.trace0 = true;
    this.trace = true;
    this.debug = true;
    this.sm = new MqttEncrptStateMachine(this.ee);
    this.ListenEventEmitter_();
    if(this.trace0) {
      console.log('MqttEncryptChannel::constructor::this.ee=:<',this.ee,'>');
    }
  }
  ListenEventEmitter_() {
    if(this.trace0) {
      console.log('MqttEncryptChannel::ListenEventEmitter_::this.ee=:<',this.ee,'>');
    }
    const self = this;
    this.ee.on('sys.authKey.ready',(evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.otmc = evt.otmc;
      self.auth = evt.auth;
      self.base32 = evt.base32;
      self.util = evt.util;
      if(!self.ecdh)  {
        self.ecdh = new MqttEncryptECDH(self.otmc,self.auth,self.base32,self.util);
      }
      self.sm.setECDH(self.ecdh);
      self.sm.actor.send({type:'init'});
    });
    this.ee.on('did:document',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.sm.actor.send({type:'did-document'});
    });
    this.ee.on('xstate.internal.mqtt.publish.ecdh.pubkey',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
      const topic = 'teamspace/secret/encrypt/ecdh/pubKey/jwk';
      const payload = {
        did:self.otmc.did.didDoc_.id,
        nodeId:self.auth.address(),
        pubKeyJwk:self.ecdh.myPublicKeyJwk
      }
      self.ee.emit('otmc.mqtt.publish',{msg:{topic:topic,payload:payload}});
    });
    this.ee.on('teamspace/secret/encrypt/ecdh/pubKey/jwk',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.ecdh.storeRemotePubKey(evt.payload);
    });
    this.ee.on('teamspace/secret/encrypt/ecdh/secret/space',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.ecdh.storeSharedKeySecretOfSpace(evt.payload,self.otmc.did.didDoc_.id);
    });

    this.ee.on('xstate.internal.mqtt.encrypt.servant.vote.check',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.sm.actor.send({type:'vote-check'});
/*
      const voteCheckResult = await self.ecdh.checkServantVote(self.otmc.did.didDoc_.id);
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::voteCheckResult=:<',voteCheckResult,'>');
      }
      self.servant = voteCheckResult.servant;
      if(voteCheckResult.reVote === true) {
        const topic = 'teamspace/secret/encrypt/ecdh/servant/vote';
        const payload = {
          did:self.otmc.did.didDoc_.id,
        }
        if(self.trace0) {
          console.log('MqttEncryptChannel::ListenEventEmitter_::payload=:<',payload,'>');
        }
        self.ee.emit('otmc.mqtt.publish',{msg:{topic:topic,payload:payload}});        
      } else {
        self.ee.emit('otmc.mqtt.encrypt.sharedkey.spaceteam.loadSecret',{});
      }
*/
    });
    this.ee.on('xstate.internal.mqtt.encrypt.servant.vote.refresh',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.servant = evt.servant;
      const topic = 'teamspace/secret/encrypt/ecdh/servant/vote';
      const payload = {
        did:self.otmc.did.didDoc_.id,
      }
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::payload=:<',payload,'>');
      }
      self.ee.emit('otmc.mqtt.publish',{msg:{topic:topic,payload:payload}});        
    });
    this.ee.on('xstate.internal.mqtt.encrypt.servant.vote.ready',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
    });


    this.ee.on('teamspace/secret/encrypt/ecdh/servant/vote',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');      
      }
      const voteResult = await self.ecdh.voteServant(self.otmc.did.didDoc_.id);
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::voteResult=:<',voteResult,'>');      
      }
      if(voteResult) {
        const topic = 'teamspace/secret/encrypt/ecdh/servant/voteResult';
        const payload = {
          did:self.otmc.did.didDoc_.id,
          voteResult:voteResult
        }
        if(self.trace0) {
          console.log('MqttEncryptChannel::ListenEventEmitter_::payload=:<',payload,'>');
        }
        self.ee.emit('otmc.mqtt.publish',{msg:{topic:topic,payload:payload}});
      }
    });
    this.ee.on('teamspace/secret/encrypt/ecdh/servant/voteResult',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');      
      }
      const voteResult = await self.ecdh.collectRemotevoteServant(evt.payload.voteResult);
    });


    this.ee.on('otmc.mqtt.encrypt.channel.encrypt',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.encryptMsgPayload4TeamSpace_(evt);
    });
    this.ee.on('otmc.mqtt.encrypt.sharedkey.spaceteam.refresh',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
      await self.ecdh.prepareSharedKeysOfTeamSpace();
      const unicastMsg = await self.ecdh.createUnicastMessage4SharedKeysOfTeamSpace();
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::unicastMsg=:<',unicastMsg,'>');
      }
      for(const msg of unicastMsg) {
        self.ee.emit('otmc.mqtt.publish',{msg:msg});
      }
    });
  }
  async encryptMsgPayload4TeamSpace_(mqttMsg) {
    if(this.trace0) {
      console.log('MqttEncryptChannel::encryptMsgPayload4TeamSpace_::mqttMsg=:<',mqttMsg,'>');
    }
    const did = this.otmc.did.didDoc_.id;
    if(this.trace0) {
      console.log('MqttEncryptChannel::encryptMsgPayload4TeamSpace_::did=:<',did,'>');
    }
    const encyptMsg = await this.ecdh.encryptData4TeamSpace(mqttMsg,did);
    if(this.trace0) {
      console.log('MqttEncryptChannel::encryptMsgPayload4TeamSpace_::encyptMsg=:<',encyptMsg,'>');
    }
    if(encyptMsg === false) {
      this.ee.emit('otmc.mqtt.encrypt.sharedkey.spaceteam.refresh',{});
      return;
    }
    return encyptMsg;
  }
  async encryptMsgPayloadByPublicKey_(mqttMsg) {
    const didPublicKeys = this.ecdh.memberPublicKeys[did];
    if(this.trace0) {
      console.log('MqttEncryptChannel::encryptMsgPayloadByPublicKey_::didPublicKeys=:<',didPublicKeys,'>');
    }
    for(const nodeId in didPublicKeys) {
      if(this.trace0) {
        console.log('MqttEncryptChannel::encryptMsgPayloadByPublicKey_::nodeId=:<',nodeId,'>');
      }
      const pubKey = didPublicKeys[nodeId];
      if(this.trace0) {
        console.log('MqttEncryptChannel::encryptMsgPayloadByPublicKey_::pubKey=:<',pubKey,'>');
      }
      const encryptPayload = await this.ecdh.encryptData(mqttMsg.payload,did,nodeId);
      if(this.trace0) {
        console.log('MqttEncryptChannel::encryptMsgPayloadByPublicKey_::encryptPayload=:<',encryptPayload,'>');
      }
    }
  }

}

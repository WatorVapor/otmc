import { MqttEncryptECDH } from './otmc.mqtt.encrypt.ecdh.js';
import { MqttEncrptStateMachine } from './otmc.mqtt.encrypt.state.js';
import { MqttEncrptRaftState } from './otmc.mqtt.encrypt.raft.js';
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
    this.raft = new MqttEncrptRaftState(this.ee);
    this.ListenEventEmitter_();
    if(this.trace0) {
      console.log('MqttEncryptChannel::constructor::this.ee=:<',this.ee,'>');
    }
    this.cachedPlainMsg = [];
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
      self.ee.emit('otmc.mqtt.encrypt.raft.event',{type:'ELECTION_TIMEOUT'},{});
    });

    this.ee.on('teamspace/secret/encrypt/ecdh/pubKey/jwk',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.ecdh.storeRemotePubKey(evt.payload);
      self.ecdh.loadMemeberPubKey();
    });
    this.ee.on('teamspace/secret/encrypt/ecdh/secret/space',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_ ecdh/secret/space::evt=:<',evt,'>');
      }
      const result = await self.ecdh.storeSharedKeySecretOfSpace(evt.payload,self.otmc.did.didDoc_.id);
      if(result.nodeKeyMiss) {
        try {
          const topic = `teamspace/secret/encrypt/ecdh/sync/pubKey`;
          if(this.trace0) {
            console.log('MqttEncryptChannel::ListenEventEmitter_::topic=:<',topic,'>');
          }
          const nodeId = result.nodeId;
          if(this.trace0) {
            console.log('MqttEncryptChannel::ListenEventEmitter_::nodeId=:<',nodeId,'>');
          }
          this.ee.emit('otmc.mqtt.publish',{msg:{topic:topic,payload:{nodeId:nodeId}}});
        } catch(err) {
          console.error('MqttEncryptChannel::ListenEventEmitter_::err=:<',err,'>');
        }
      } else if (result.nodeMissMatch) {
        if(self.trace0) {
          console.log('MqttEncryptChannel::ListenEventEmitter_ ecdh/secret/space::result=:<',result,'>');
        }
      } else {
        const evt2 = {};
        if(self.trace0) {
          console.log('MqttEncryptChannel::ListenEventEmitter_ ecdh/secret/space::evt2=:<',evt2,'>');
        }
        self.tryDecryptCacheMessage_();
        self.ee.emit('otmc.mqtt.encrypt.channel.refresh',evt2);      
      }
    });

    this.ee.on('xstate.action.mqtt.publish.ecdh.pubkey',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.broadCastPubKey_();
    });

    this.ee.on('xstate.action.mqtt.encrypt.servant.vote.refresh',async (evt)=>{
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
    this.ee.on('xstate.action.mqtt.encrypt.servant.announcement',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
      const topic = 'teamspace/secret/encrypt/ecdh/servant/announcement';
      const payload = {
        did:self.otmc.did.didDoc_.id,
        voteEvidence:evt,
      }
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::payload=:<',payload,'>');
      }
      self.ee.emit('otmc.mqtt.publish',{msg:{topic:topic,payload:payload}});
    });

    this.ee.on('xstate.action.mqtt.encrypt.servant.ready',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.servant = true;
      self.ee.emit('otmc.mqtt.encrypt.sharedkey.spaceteam.refresh',{});
    });
    
    this.ee.on('xstate.action.mqtt.encrypt.master.ready',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.servant = false;
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
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::self.ecdh=:<',self.ecdh,'>');
      }
      const voteCollectResult = await self.ecdh.collectRemoteVoteServant(evt.payload.voteResult);
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::voteCollectResult=:<',voteCollectResult,'>');
      }
    });
    this.ee.on('teamspace/secret/encrypt/ecdh/servant/announcement',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
      await self.ecdh.updateAnnouncementRemoteServant(evt.payload.voteEvidence);
    });
    this.ee.on('teamspace/secret/encrypt/ecdh/sync/sharedKey',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
      const keyId = evt.payload.keyId;
      const unicastMsg = await self.ecdh.createUnicastMessage4SharedKeysOfTeamSpace(keyId);
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::unicastMsg=:<',unicastMsg,'>');
      }
      for(const msg of unicastMsg) {
        self.ee.emit('otmc.mqtt.publish',{msg:msg});
      }
    });
    this.ee.on('teamspace/secret/encrypt/ecdh/sync/pubKey',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
      this.broadCastPubKey_();
    });

    this.ee.on('otmc.mqtt.encrypt.channel.encrypt',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.encryptMsgPayload4TeamSpace_(evt);
    });
    this.ee.on('otmc.mqtt.encrypt.channel.encrypt.broadcast',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.encryptMsgPayload4TeamSpace_(evt);
    });
    this.ee.on('otmc.mqtt.encrypt.channel.encrypt.unicast',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.encryptMsgPayload4TeamSpaceUnicast_(evt);
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
      self.tryDecryptCacheMessage_();
      self.ee.emit('otmc.mqtt.encrypt.channel.refresh',evt);      
    });
  
    this.ee.on('mqtt.encrypt.channel.decrypt.message',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
      const mqttMsg = evt.msg;
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::mqttMsg=:<',mqttMsg,'>');
      }
      const decryptedMsg = await self.decryptMsgPayload4TeamSpace_(mqttMsg);
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::decryptedMsg=:<',decryptedMsg,'>');
        //console.log('MqttEncryptChannel::ListenEventEmitter_::self.otmc=:<',self.otmc,'>');
        console.log('MqttEncryptChannel::ListenEventEmitter_::self.otmc.listenerCount(”otmc:mqtt:all“)=:<',self.otmc.listenerCount('otmc:mqtt:all'),'>');
        console.log('MqttEncryptChannel::ListenEventEmitter_::self.otmc.listenerCount(”otmc:mqtt:encrypt:channel“)=:<',self.otmc.listenerCount('otmc:mqtt:encrypt:channel'),'>');
      }
      if(decryptedMsg.keyMiss) {
        const resultCache = await self.ecdh.storeEncryptedCacheSharedKeysOfTeamSpace(mqttMsg);
        if(self.trace0) {
          console.log('MqttEncryptChannel::ListenEventEmitter_::resultCache=:<',resultCache,'>');
        }
        self.syncSharedKey4TeamSpace_(mqttMsg.payload.keyId);
      }
      if(decryptedMsg.decrypt) {
        const relayMsg ={
          orignal:mqttMsg,
          decryptedMsg:decryptedMsg.decrypt,
          sTopic:evt.sTopic.replace('encrypt/channel/',''),
        };
        const emitResult = self.otmc.emit('otmc:mqtt:encrypt:channel',relayMsg);
        if(self.trace0) {
          console.log('MqttEncryptChannel::ListenEventEmitter_::emitResult=:<',emitResult,'>');
        }
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
      this.ee.emit('xstate.event.mqtt.encrypt.servant.vote.check',{});
      this.cachedPlainMsg.push(mqttMsg);
      return;
    }
    const topic = `encrypt/channel/${mqttMsg.topic}`;
    if(this.trace0) {
      console.log('MqttEncryptChannel::encryptMsgPayload4TeamSpace_::topic=:<',topic,'>');
    }
    this.ee.emit('otmc.mqtt.publish',{msg:{topic:topic,payload:encyptMsg}});
    return encyptMsg;
  }

  async encryptMsgPayload4TeamSpaceUnicast_(mqttMsg) {
    if(this.trace0) {
      console.log('MqttEncryptChannel::encryptMsgPayload4TeamSpaceUnicast_::mqttMsg=:<',mqttMsg,'>');
    }
    const did = this.otmc.did.didDoc_.id;
    if(this.trace0) {
      console.log('MqttEncryptChannel::encryptMsgPayload4TeamSpaceUnicast_::did=:<',did,'>');
    }
    // wrong redo it.
    const encyptMsg = await this.ecdh.encryptData4TeamSpace(mqttMsg,did);
    if(this.trace0) {
      console.log('MqttEncryptChannel::encryptMsgPayload4TeamSpaceUnicast_::encyptMsg=:<',encyptMsg,'>');
    }
    if(encyptMsg === false) {
      this.ee.emit('xstate.event.mqtt.encrypt.servant.vote.check',{});
      this.cachedPlainMsg.push(mqttMsg);
      return;
    }
    const topic = `encrypt/channel/${mqttMsg.topic}`;
    if(this.trace0) {
      console.log('MqttEncryptChannel::encryptMsgPayload4TeamSpaceUnicast_::topic=:<',topic,'>');
    }
    this.ee.emit('otmc.mqtt.publish',{msg:{topic:topic,payload:encyptMsg}});
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
  async decryptMsgPayload4TeamSpace_(mqttMsg) {
    if(this.trace0) {
      console.log('MqttEncryptChannel::decryptMsgPayload4TeamSpace_::mqttMsg=:<',mqttMsg,'>');
    }
    const did = this.otmc.did.didDoc_.id;
    if(this.trace0) {
      console.log('MqttEncryptChannel::decryptMsgPayload4TeamSpace_::did=:<',did,'>');
    }
    const decryptMsg = await this.ecdh.decryptData4TeamSpace(mqttMsg.payload,did);
    if(this.trace0) {
      console.log('MqttEncryptChannel::decryptMsgPayload4TeamSpace_::decryptMsg=:<',decryptMsg,'>');
    }
    return decryptMsg;
  }
  async tryDecryptCacheMessage_() {
    const cachedMsg = await this.ecdh.getEncryptedCacheMsg();
    if(this.trace0) {
      console.log('MqttEncryptChannel::tryDecryptCacheMessage_::cachedMsg=:<',cachedMsg,'>');
    }
    for(const mqttMsg of cachedMsg) {
      if(this.trace0) {
        console.log('MqttEncryptChannel::tryDecryptCacheMessage_::mqttMsg=:<',mqttMsg,'>');
      }
      const decryptMsg = await this.decryptMsgPayload4TeamSpace_(mqttMsg);
      if(this.trace0) {
        console.log('MqttEncryptChannel::tryDecryptCacheMessage_::decryptMsg=:<',decryptMsg,'>');
      }
      if(decryptMsg) {
        if(decryptMsg.decrypt) {
          this.ecdh.removeEncryptedCacheMsg(mqttMsg);
          this.ee.emit('otmc.mqtt.publish',{msg:{topic:mqttMsg.topic,payload:decryptMsg}});
        }
        if(decryptMsg.keyMiss) {
          this.syncSharedKey4TeamSpace_(mqttMsg.payload.keyId);
        }
      }
    }
  }
  broadCastPubKey_() {
      const topic = 'teamspace/secret/encrypt/ecdh/pubKey/jwk';
      const payload = {
        did:this.otmc.did.didDoc_.id,
        nodeId:this.auth.address(),
        pubKeyJwk:this.ecdh.myPublicKeyJwk
      }
      this.ee.emit('otmc.mqtt.publish',{msg:{topic:topic,payload:payload}});
  }
  syncSharedKey4TeamSpace_(sharedkeyId) {
    try {
      const topic = `teamspace/secret/encrypt/ecdh/sync/sharedKey`;
      if(this.trace0) {
        console.log('MqttEncryptChannel::syncSharedKey4TeamSpace_::topic=:<',topic,'>');
      }
      if(this.trace0) {
        console.log('MqttEncryptChannel::syncSharedKey4TeamSpace_::sharedkeyId=:<',sharedkeyId,'>');
      }
      this.ee.emit('otmc.mqtt.publish',{msg:{topic:topic,payload:{keyId:sharedkeyId}}});
    } catch(err) {
      console.error('MqttEncryptChannel::syncSharedKey4TeamSpace_::err=:<',err,'>');
    }
  }
}

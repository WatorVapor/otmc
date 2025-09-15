import { EventEmitter } from 'eventemitter3';
import { DidDocument } from './otmc.did.document.js';
import { OtmcStateMachine } from './otmc.state.machine.js';
import { WebWorkerLoader } from './otmc.webworker.loader.js';
import { EdcryptKeyLoader } from './otmc.edcrypt.keyloader.js';
import { MqttMessager } from './otmc.mqtt.message.js';
import { MqttConnection } from './otmc.mqtt.connection.js';
import { MqttNodeCluster } from './otmc.mqtt.node.cluster.js';

/**
*
*/
export class OtmcMqtt extends EventEmitter {
  static trace = false;
  static debug = true;
  constructor(config) {
    super();
    this.trace0 = true;
    this.trace10 = false;
    this.trace = true;
    this.debug = true;
    if(config) {
      this.config = config;
    } else {
      this.config = {};
    }
    this.eeInternal = new EventEmitter();
    if(this.trace) {
      console.log('OtmcMqtt::constructor::this.eeInternal=:<',this.eeInternal,'>');
    }
    this.worker = new WebWorkerLoader(this.eeInternal);
    this.edCryptKey = new EdcryptKeyLoader(this.eeInternal,this);
    const self = this;
    setTimeout(() => {
      self.did = new DidDocument(this.eeInternal,this);
      self.edCryptKey.otmc = self;
      self.did.otmc = self;
      self.eeInternal.emit('edCryptKey.loader.runWorker',{});
      self.eeInternal.emit('webwoker.create.worker',{});
      self.sm = new OtmcStateMachine(this.eeInternal);
      self.mqtt = new MqttConnection(self.eeInternal);
      self.mqttMsg = new MqttMessager(self.eeInternal);
      self.cluster = new MqttNodeCluster(self.eeInternal);
    },1);
    this.mqttOption = {
      qos:0,
      nl:true
    };
  }
  switchDidTeam(didTeam) {
    const data = {
      teamId:didTeam
    }
    this.eeInternal.emit('otmc.document.switchTeam',data);
  }
  switchDidKey(didKey) {
    const data = {
      keyId:didKey
    }
    this.eeInternal.emit('edCryptKey.loader.switchKey',data);
  }
  readAllAccountInfo() {
    this.eeInternal.emit('otmc.mqtt.read.all.account.info',{});
  }
  publishMsg(mqttMsg){
    if(this.trace0) {
      console.log('OtmcMqtt::publishMsg::mqttMsg=:<',mqttMsg,'>');
    }
    const msgPack = this.did.packMessage(mqttMsg);
    if(this.trace0) {
      console.log('OtmcMqtt::publishMsg::msgPack=:<',msgPack,'>');
    }
    this.mqtt.publish(msgPack.topic,msgPack,this.mqttOption);
  }
  publishSecretMsg(mqttMsg){
    if(this.trace0) {
      console.log('OtmcMqtt::publishSecretMsg::mqttMsg=:<',mqttMsg,'>');
    }
    if(this.trace0) {
      console.log('OtmcMqtt::publishSecretMsg::this.did=:<',this.did,'>');
    }    
    this.eeInternal.emit('otmc.mqtt.encrypt.channel.encrypt',mqttMsg);
  }
  broadcastSecretMsg(mqttMsg){
    if(this.trace0) {
      console.log('OtmcMqtt::broadcastSecretMsg::mqttMsg=:<',mqttMsg,'>');
    }
    if(this.trace10) {
      console.log('OtmcMqtt::broadcastSecretMsg::this.did=:<',this.did,'>');
    }    
    this.eeInternal.emit('otmc.mqtt.encrypt.channel.encrypt.broadcast',mqttMsg);
  }
  unicastSecretMsg(mqttMsg){
    if(this.trace0) {
      console.log('OtmcMqtt::unicastSecretMsg::mqttMsg=:<',mqttMsg,'>');
    }
    if(this.trace0) {
      console.log('OtmcMqtt::unicastSecretMsg::this.did=:<',this.did,'>');
    }    
    this.eeInternal.emit('otmc.mqtt.encrypt.channel.encrypt.unicast',mqttMsg);
  }  
  broadcastMsg(mqttMsg){
    if(this.trace0) {
      console.log('OtmcMqtt::publishMsg::mqttMsg=:<',mqttMsg,'>');
    }
    const msgPack = this.did.packBroadcastMessage(mqttMsg);
    if(this.trace0) {
      console.log('OtmcMqtt::publishMsg::msgPack=:<',msgPack,'>');
    }
    this.mqtt.publish(msgPack.topic,msgPack,this.mqttOption);
  }
  unicastMsg(mqttMsg){
    if(this.trace0) {
      console.log('OtmcMqtt::publishMsg::mqttMsg=:<',mqttMsg,'>');
    }
    const msgPack = this.did.packUnicastMessage(mqttMsg);
    if(this.trace0) {
      console.log('OtmcMqtt::publishMsg::msgPack=:<',msgPack,'>');
    }
    this.mqtt.publish(msgPack.topic,msgPack,this.mqttOption);
  }
}

import { EventEmitter } from 'eventemitter3';
import { DidDocument } from './otmc.did.document.js';
import { OtmcStateMachine } from './otmc.state.machine.js';
import { WebWorkerLoader } from './otmc.webworker.loader.js';
import { EdcryptKeyLoader } from './otmc.edcrypt.keyloader.js';
import { MqttMessager } from './otmc.mqtt.message.js';

/**
*
*/
export class OtmcMqtt extends EventEmitter {
  static trace = false;
  static debug = true;
  constructor(config) {
    super();
    this.trace0 = false;
    this.trace = true;
    this.debug = true;
    if(config) {
      this.config = config;
    } else {
      this.config = {};
    }
    this.eeInternal = new EventEmitter();
    if(this.trace) {
      console.log('OtmcTeam::constructor::this.eeInternal=:<',this.eeInternal,'>');
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
      self.mqtt = new MqttMessager(self.eeInternal);
    },1);
    this.mqttOption = {
      qos:0,
      nl:true
    };
  }
  switchDidKey(didKey) {
    const data = {
      keyId:didKey
    }
    this.eeInternal.emit('edCryptKey.loader.switchKey',data);
  }
  publishMsg(mqttMsg){
    if(this.trace0) {
      console.log('Otmc::publishMsg::mqttMsg=:<',mqttMsg,'>');
    }
    const msgPack = this.did.packMessage(mqttMsg);
    if(this.trace0) {
      console.log('Otmc::publishMsg::msgPack=:<',msgPack,'>');
    }
    this.mqtt.publish(msgPack.topic,msgPack,this.mqttOption);
  }
  broadcastMsg(mqttMsg){
    if(this.trace0) {
      console.log('Otmc::publishMsg::mqttMsg=:<',mqttMsg,'>');
    }
    const msgPack = this.did.packBroadcastMessage(mqttMsg);
    if(this.trace0) {
      console.log('Otmc::publishMsg::msgPack=:<',msgPack,'>');
    }
    this.mqtt.publish(msgPack.topic,msgPack,this.mqttOption);
  }
}

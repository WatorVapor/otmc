import { EventEmitter } from 'eventemitter3';

import { MqttMessager } from './otmc.mqtt.message.js';
import { DidDocument } from './otmc.did.document.js';
import { OtmcStateMachine } from './otmc.state.machine.js';
import { EdcryptKeyLoader } from './otmc.edcrypt.keyloader.js';

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
      this.isNode = config.node;
    } else {
      this.config = {};
    }
    this.ee = new EventEmitter();
    if(this.trace) {
      console.log('Otmc::constructor::this.ee=:<',this.ee,'>');
    }
    this.edCryptKey = new EdcryptKeyLoader(this.ee);
    this.did = new DidDocument(this.ee);
    this.mqtt = new MqttMessager(this.ee);
    const self = this;
    setTimeout(() => {
      self.edCryptKey.otmc = self;
      self.did.otmc = self;
      self.mqtt.otmc = self;
      self.ee.emit('edCryptKey.loader.runWorker',{});
      self.sm = new OtmcStateMachine(this.ee);
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
    this.ee.emit('edCryptKey.loader.switchKey',data);
  }
  startMining() {
    const data = {
      mine:{
        start:true,
      }
    }
    this.ee.emit('edCryptKey.loader.mining',data);
  }
  createDidTeamFromSeed() {
    return this.did.createSeed();
  }
  joinDidTeamAsAuth(id) {
    return this.did.createJoinAsAuth(id);
  }
  
  
  requestJoinDidTeam() {
    const joinRequest = this.did.requestJoinDid();
    if(this.trace) {
      console.log('Otmc::requestJoinDidTeam::joinRequest=:<',joinRequest,'>');
    }
    this.mqtt.publish(joinRequest.topic,joinRequest,this.mqttOption);
  }
  acceptInvitation(address){
    if(this.trace) {
      console.log('Otmc::acceptInvitation::new Date()=:<',new Date(),'>');
      console.log('Otmc::acceptInvitation::address=:<',address,'>');
    }
    const invitationReply = this.did.acceptInvitation(address);
    this.mqtt.publish(invitationReply.topic,invitationReply,this.mqttOption);
  }
  rejectInvitation(address){
    if(this.trace) {
      console.log('Otmc::rejectInvitation::new Date()=:<',new Date(),'>');
      console.log('Otmc::rejectInvitation::address=:<',address,'>');
    }
    const rejectInvitationReply = this.did.rejectInvitation(address);
    this.mqtt.publish(invitationReply.topic,invitationReply,this.mqttOption);
  }
  checkEvidenceChain(){
    if(this.trace) {
      console.log('Otmc::checkEvidenceChain::new Date()=:<',new Date(),'>');
    }
    this.did.checkDidEvidence_();
  }
  updateManifest(manifest){
    if(this.trace) {
      console.log('Otmc::updateManifest::manifest=:<',manifest,'>');
    }
    this.did.updateManifest(manifest);
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

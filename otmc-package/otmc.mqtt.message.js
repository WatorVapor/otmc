import { MqttJWTAgent } from './otmc.mqtt.jwt.js';
import { MqttEncryptChannel } from './otmc.mqtt.encrypt.channel.js';

const LEVEL_OPT = {
  keyEncoding: 'utf8',
  valueEncoding: 'utf8',
};


/**
*
*/
export class MqttMessager {
  constructor(ee) {
    this.trace0 = false;
    this.trace = false;
    this.debug = true;
    this.isRequestingJwt = false;
    this.ee = ee;
    this.jwt = new MqttJWTAgent(ee);
    this.encryptCh = new MqttEncryptChannel(ee);
    this.otmc = false;
    this.auth = false;
    this.base32 = false;
    this.util = false;
    this.ListenEventEmitter_();
    this.msgQueue = [];
    if(this.trace0) {
      console.log('MqttMessager::constructor::this.ee=:<',this.ee,'>');
    }    
  }
  ListenEventEmitter_() {
    if(this.trace0) {
      console.log('MqttMessager::ListenEventEmitter_::this.ee=:<',this.ee,'>');
    }
    const self = this;
    this.ee.on('sys.authKey.ready',(evt)=>{
      if(self.trace0) {
        console.log('MqttMessager::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.otmc = evt.otmc;
      self.auth = evt.auth;
      self.base32 = evt.base32;
      self.util = evt.util;
    });
    this.ee.on('mqtt.message.raw',(evt)=>{
      if(self.trace0) {
        console.log('MqttMessager::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.onMqttRawMessage_(evt.topic,evt.msgJson);
    });
  }


  onMqttRawMessage_(topic, msgJson) {
    if(this.trace0) {
      console.log('MqttMessager::onMqttRawMessage_:topic=<',topic,'>');
      console.log('MqttMessager::onMqttRawMessage_:msgJson=<',msgJson,'>');
    }
    if(this.trace0) {
      console.log('MqttMessager::onMqttRawMessage_:this.auth=<',this.auth,'>');
    }
    let goodMsg = this.auth.verify(msgJson);
    if(this.trace0) {
      console.log('MqttMessager::onMqttRawMessage_:goodMsg=<',goodMsg,'>');
    }
    if(!goodMsg) {
      if(!goodMsg) {
        console.log('MqttMessager::onMqttRawMessage_:goodMsg=<',goodMsg,'>');
        console.log('MqttMessager::onMqttRawMessage_:msgJson=<',msgJson,'>');
        return;
      }
    }
    const featureTopic = this.getFeatureTopic_(topic);
    if(this.trace0) {
      console.log('MqttMessager::onMqttRawMessage_:featureTopic=<',featureTopic,'>');
    }
    this.dispatchMessage_(featureTopic,topic,msgJson);
  }
  
  getFeatureTopic_(fullTopic) {
    if(this.trace0) {
      console.log('MqttMessager::getFeatureTopic_:fullTopic=<',fullTopic,'>');
    }
    const featureTopics = fullTopic.split('/');
    if(this.trace0) {
      console.log('MqttMessager::getFeatureTopic_:featureTopics=<',featureTopics,'>');
    }
    if(featureTopics.length > 4 && featureTopics[3] === 'broadcast') {
      const featureTopic = 'broadcast/' + featureTopics.slice(5).join('/');
      if(this.trace0) {
        console.log('MqttMessager::getFeatureTopic_:featureTopic=<',featureTopic,'>');
      }
      return featureTopic;
    }
    const featureTopic = featureTopics.slice(4).join('/');
    if(this.trace0) {
      console.log('MqttMessager::getFeatureTopic_:featureTopic=<',featureTopic,'>');
    }
    return featureTopic;
  }

  dispatchMessage_(featureTopic,fullTopic,msgJson) {
    if(this.trace0) {
      console.log('MqttMessager::dispatchMessage_:featureTopic=<',featureTopic,'>');
      console.log('MqttMessager::dispatchMessage_:fullTopic=<',fullTopic,'>');
      console.log('MqttMessager::dispatchMessage_:msgJson=<',msgJson,'>');
    }
    if(featureTopic.startsWith('teamspace/secret/encrypt/ecdh')) {
      this.ee.emit(featureTopic,msgJson);
    }
    if(featureTopic.startsWith('encrypt/channel')) {
      this.ee.emit('mqtt.encrypt.channel.decrypt.message',{msg:msgJson,sTopic:featureTopic});
      return;
    }
    if(this.trace0) {
      console.log('MqttMessager::dispatchMessage_::this.otmc.listenerCount(”otmc:mqtt:all“)=:<',this.otmc.listenerCount('otmc:mqtt:all'),'>');
      console.log('MqttMessager::dispatchMessage_::this.otmc.listenerCount(”otmc:mqtt:encrypt:channel“)=:<',this.otmc.listenerCount('otmc:mqtt:encrypt:channel'),'>');
    }
    const resultEmit = this.otmc.emit('otmc:mqtt:all',{msg:msgJson,sTopic:featureTopic});
    if(this.trace0) {
      console.log('MqttMessager::dispatchMessage_:resultEmit=<',resultEmit,'>');
    }

  }
}

import {MassStore} from './mass-store.js';
import {GravitonJWT} from './graviton-jwt.js';
export class Graviton {
  static trace = false;
  static debug = true;
  constructor(evidences,mass,resolve,cb) {
    if(Graviton.trace) {
      console.log('Graviton::constructor:evidences=<',evidences,'>');
    }
    this.evidences_ = evidences;
    this.mqttJwt_ = resolve;
    this.cb_ = cb;
    this.mass_ = mass;
    const self = this;
    this.jwtReq_ = new GravitonJWT(evidences,mass,resolve,(jwt)=>{
      self.createMqttConnection_(jwt.jwt,jwt.payload);
    });
  }
  publish(topic,msg) {
    if(Graviton.debug) {
      console.log('Graviton::publish:topic=<',topic,'>');
    }
    const msgSigned = this.mass_.sign(msg);
    if(Graviton.debug) {
      console.log('Graviton::publish:msgSigned=<',msgSigned,'>');
    }
    this.mqttClient_.publish(topic,JSON.stringify(msgSigned));
  }
  
  
  createMqttConnection_(jwt,payload) {
    if(Graviton.debug) {
      console.log('Graviton::createMqttConnection_:payload=<',payload,'>');
    }
    this.clientid_ = `${payload.clientid}@${this.mass_.randomId()}`;
    this.username_ = payload.username;
    this.did_ = payload.did;
    const options = {
      // Authentication
      clientId: this.clientid_,
      username: this.username_,
      password: jwt,
      protocolVersion:5,
      keepalive: 60*5,
      connectTimeout: 4000,
      clean: true,
      rejectUnauthorized: true
    }
    if(Graviton.debug) {
      console.log('Graviton::createMqttConnection_:options=<',options,'>');
    }
    this.mqttClient_ = mqtt.connect(payload.mqtt_uri,options);
    const self = this;
    this.mqttClient_.on('connect', () => {
      console.log('Graviton::createMqttConnection_ connect self.mqttClient_.connected:=<', self.mqttClient_.connected, '>');
    });
    this.mqttClient_.on('message', (channel, message) => {
      self.onMqttMessage_(channel, message);
    });
    const topics = [];
    if(payload.acl && payload.acl.all) {
      for(const topic of payload.acl.all) {
        topics.push(topic);
      }
    }
    if(payload.acl && payload.acl.sub) {
      for(const topic of payload.acl.sub) {
        topics.push(topic);
      }
    }
    this.mqttClient_.subscribe(topics,{qos:1,nl:true},(err, granted)=>{
      if(err) {
        console.error('Graviton::createMqttConnection_ subscribe err:=<', err, '>');
      }      
      console.log('Graviton::createMqttConnection_ subscribe granted:=<', granted, '>');      
    });
  }  

  onMqttMessage_(channel, message) {
    if(Graviton.debug) {
      console.log('Graviton::onMqttMessage_ channel:=<', channel, '>');
      console.log('Graviton::onMqttMessage_ message:=<', message, '>');
    }
    const msgStr = new TextDecoder().decode(message);
    if(Graviton.debug) {
      console.log('Graviton::onMqttMessage_ msgStr:=<', msgStr, '>');
    }
    try {
      const msgJson = JSON.parse(msgStr);
      if(Graviton.debug) {
        console.log('Graviton::onMqttMessage_ msgJson:=<', msgJson, '>');
      }
      const goodAuthed = this.mass_.verify(msgJson);
      if(Graviton.debug) {
        console.log('Graviton::onMqttMessage_ goodAuthed:=<', goodAuthed, '>');
      }
      if(goodAuthed && typeof this.onMQTTMsg === 'function') {
        this.onMQTTMsg(channel, msgJson);
      }
    } catch(err) {
      console.error('Graviton::onMqttMessage_ err:=<', err, '>');
      console.error('Graviton::onMqttMessage_ msgStr:=<', msgStr, '>');
    }
  }
    
  publish_(fullTopic,msg) {
    const signedMsg = this.mass_.sign(msg);
    if(Graviton.debug) {
      console.log('Graviton::publish_::signedMsg=<',signedMsg,'>');
    }
    if(Graviton.debug) {
      console.log('Graviton::publish_::fullTopic=<',fullTopic,'>');
    }
    this.mqttClient_.publish(fullTopic,JSON.stringify(signedMsg),{qos:1},(err) => {
      if(Graviton.debug) {
        console.log('Graviton::publish_::err=<',err,'>');
      }      
    });
    
  }
}


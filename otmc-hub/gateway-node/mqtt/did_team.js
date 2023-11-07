const fs = require('fs');
const mqtt = require('mqtt');
const MqttJWTAgent = require('./mqtt_jwt.js');
//console.log(':::MqttJWTAgent=<',MqttJWTAgent,'>');
const strConstMqttJwtPath = './.store/mqtt/jwt_cached.json';

class MqttJWTDidTeam {
  constructor(didDoc,edKey) {
    this.trace = true;
    this.debug = true;
    if(this.trace) {
      console.log('MqttJWTDidTeam::constructor:didDoc=<',didDoc,'>');
      console.log('MqttJWTDidTeam::constructor:edKey=<',edKey,'>');
    }
    this.didDoc_ = didDoc;
    this.edKey_ = edKey;
    this.requestMqttAgent_();
  }
  requestMqttAgent_() {
    const self = this;
    const jwtAgent = new MqttJWTAgent(this.didDoc_,this.edKey_,(jwtReply) => {
      if(this.trace) {
        console.log('MqttJWTDidTeam::requestMqttAgent_:jwtReply=<',jwtReply,'>');
      }
      self.onRemoteJwtRcved_(jwtReply);
    });
    if(this.trace) {
      console.log('MqttJWTDidTeam::requestMqttAgent_:jwtAgent=<',jwtAgent,'>');
    }
  }
  onRemoteJwtRcved_(jwtRcv) {
    if(this.trace) {
      console.log('MqttJWTDidTeam::onRemoteJwtRcved_:jwtRcv=<',jwtRcv,'>');
    }
    fs.mkdirSync('./.store/mqtt/', { recursive: true },);
    fs.writeFileSync(strConstMqttJwtPath, JSON.stringify(jwtRcv,undefined,2));
    this.createMqttConnection_(jwtRcv.jwt,jwtRcv.payload);
  }
  
  createMqttConnection_(jwt,payload) {
    if(this.trace) {
      console.log('MqttJWTDidTeam::createMqttConnection_:jwt=<',jwt,'>');
    }    
    const options = {
      // Authentication
      clientId: payload.clientid,
      username: payload.username,
      password: jwt,
      protocolVersion:5,
      keepalive: 60*5,
      connectTimeout: 4000,
      clean: true,
      rejectUnauthorized: true
    };
    const srvUrl = payload.mqtt.portal.tls;
    const mqttClient = mqtt.connect(srvUrl,options);
    mqttClient.on('connect', (connack) => {
      console.log('MqttJWTDidTeam::createMqttConnection_::connect connack=<',connack,'>');
      console.log('MqttJWTDidTeam::createMqttConnection_::mqttClient.connected=<',mqttClient.connected,'>');
    });
    mqttClient.on('disconnect', (connack) => {
      console.log('MqttJWTDidTeam::createMqttConnection_::disconnect connack=<',connack,'>');
    });
    mqttClient.on('reconnect', () => {
      console.log('MqttJWTDidTeam::createMqttConnection_ reconnect');
    });
    mqttClient.on('error', (err) => {
      console.log('MqttJWTDidTeam::createMqttConnection_::err=<',err,'>');
    });
    mqttClient.on('close', (evt) => {
      console.log('MqttJWTDidTeam::createMqttConnection_::close evt=<',evt,'>');
    });
    mqttClient.on('end', (evt) => {
      console.log(':MqttJWTDidTeam:createMqttConnection_::end evt=<',evt,'>');
    });
    mqttClient.on('offline', (evt) => {
      console.log('MqttJWTDidTeam::createMqttConnection_::offline evt=<',evt,'>');
    });
    mqttClient.on('message', (topic, message, packet) => {
      console.log('MqttJWTDidTeam::createMqttConnection_::message topic=<',topic,'>');
      console.log('MqttJWTDidTeam::createMqttConnection_::message message=<',message,'>');
    });
    mqttClient.on('packetsend', (packet) => {
      console.log('MqttJWTDidTeam::createMqttConnection_::packetsend packet=<',packet,'>');
    });
    mqttClient.on('packetreceive', (packet) => {
      console.log('MqttJWTDidTeam::createMqttConnection_::packetreceive packet=<',packet,'>');
    });
    this.mqttClient_ = mqttClient;
  }
}
module.exports = MqttJWTDidTeam;

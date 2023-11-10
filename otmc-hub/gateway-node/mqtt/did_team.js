const fs = require('fs');
const mqtt = require('mqtt');
const MqttJWTAgent = require('./mqtt_jwt.js');
//console.log(':::MqttJWTAgent=<',MqttJWTAgent,'>');
const EdAuth = require('../edcrypto/edauth.js');

class MqttJWTDidTeam {
  constructor(jwtCached,didDoc,manifest,edKey,jwtCB) {
    this.trace = true;
    this.debug = true;
    if(this.trace) {
      console.log('MqttJWTDidTeam::constructor:didDoc=<',didDoc,'>');
      console.log('MqttJWTDidTeam::constructor:edKey=<',edKey,'>');
    }
    this.didDoc_ = didDoc;
    this.didManifest_ = manifest;
    this.edKey_ = edKey;
    this.jwtCB_ = jwtCB;
    this.isRequestingJwt = false;
    this.auth_ = new EdAuth(edKey);
    if(jwtCached && jwtCached.jwt && jwtCached.payload) {
      this.createMqttConnection_(jwtCached.jwt,jwtCached.payload);
    } else {
      this.isRequestingJwt = true;
      this.requestMqttAgent_();
    }
  }
  requestMqttAgent_() {
    const self = this;
    const jwtAgent = new MqttJWTAgent(this.didDoc_,this.didManifest_,this.edKey_,(jwtReply) => {
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
    if(this.jwtCB_) {
      this.jwtCB_(jwtRcv);
    }
    this.isRequestingJwt = false;
    this.createMqttConnection_(jwtRcv.jwt,jwtRcv.payload);
  }
  
  createMqttConnection_(jwt,payload) {
    if(this.trace) {
      console.log('MqttJWTDidTeam::createMqttConnection_:jwt=<',jwt,'>');
    }
    this.jwt_ = jwt;
    this.payload_ = payload;
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
    const self = this;
    mqttClient.on('connect', (connack) => {
      //console.log('MqttJWTDidTeam::createMqttConnection_::connect connack=<',connack,'>');
      console.log('MqttJWTDidTeam::createMqttConnection_::mqttClient.connected=<',mqttClient.connected,'>');
      self.runSubscriber_();
      setTimeout(()=>{
        self.exchangeDidTeamInfo_();
      },10);
    });
    mqttClient.on('disconnect', (connack) => {
      //console.log('MqttJWTDidTeam::createMqttConnection_::disconnect connack=<',connack,'>');
      console.log('MqttJWTDidTeam::createMqttConnection_::mqttClient.connected=<',mqttClient.connected,'>');
    });
    mqttClient.on('reconnect', () => {
      console.log('MqttJWTDidTeam::createMqttConnection_ reconnect');
    });
    mqttClient.on('error', (err) => {
      self.mqttClient_ = null;
      console.log('MqttJWTDidTeam::createMqttConnection_::err.message=<',err.message,'>');
      console.log('MqttJWTDidTeam::createMqttConnection_::err.name=<',err.name,'>');
      console.log('MqttJWTDidTeam::createMqttConnection_::err.code=<',err.code,'>');
      const isJwtWrong = (err.code === 134 && err.message === 'Connection refused: Bad User Name or Password');
      console.log('MqttJWTDidTeam::createMqttConnection_::isJwtWrong=<',isJwtWrong,'>');
      if(isJwtWrong && self.isRequestingJwt === false) {
        self.isRequestingJwt = true;
        self.requestMqttAgent_();
      }
      mqttClient.end();
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
      if(this.trace) {
        console.log('MqttJWTDidTeam::createMqttConnection_::message topic=<',topic,'>');
        console.log('MqttJWTDidTeam::createMqttConnection_::message message=<',message,'>');
      }
      try {
        const msgUtf8 = message.toString('utf-8');
        const msgJson = JSON.parse(msgUtf8);
        self.onMqttMessage_(topic, msgJson);
      } catch( err ){
        console.log('MqttJWTDidTeam::createMqttConnection_::message err=<',err,'>');
      }
    });
    mqttClient.on('packetsend', (packet) => {
      //console.log('MqttJWTDidTeam::createMqttConnection_::packetsend packet=<',packet,'>');
    });
    mqttClient.on('packetreceive', (packet) => {
      //console.log('MqttJWTDidTeam::createMqttConnection_::packetreceive packet=<',packet,'>');
    });
    this.mqttClient_ = mqttClient;
  }
  
  runSubscriber_() {
    if(this.trace) {
      console.log('MqttJWTDidTeam::runSubscriber_:this.payload_=<',this.payload_,'>');
    }
    const subOpt = {qos: 0,nl:true};
    const subCallBack = (err, granted) => {
      if(this.trace) {
        console.log('MqttJWTDidTeam::runSubscriber_:err=<',err,'>');
        console.log('MqttJWTDidTeam::runSubscriber_:granted=<',granted,'>');
      }
      if(err) {
        console.log('MqttJWTDidTeam::runSubscriber_:granted=<',granted,'>');
      }
    }
    if(this.payload_ && this.payload_.acl.all ) {
      this.mqttClient_.subscribe(this.payload_.acl.all,subOpt,subCallBack);
    }
    if(this.payload_ && this.payload_.acl.sub ) {
      this.mqttClient_.subscribe(this.payload_.acl.sub,subOpt,subCallBack);
    }
  }
  
  onMqttMessage_(topic, message) {
    if(this.trace) {
      console.log('MqttJWTDidTeam::onMqttMessage_::topic=<',topic,'>');
      console.log('MqttJWTDidTeam::onMqttMessage_::message=<',message,'>');
    }
  }
  exchangeDidTeamInfo_() {
    if(this.trace) {
      console.log('MqttJWTDidTeam::exchangeDidTeamInfo_::this.didDoc_=<',this.didDoc_,'>');
      console.log('MqttJWTDidTeam::exchangeDidTeamInfo_::this.edKey_=<',this.edKey_,'>');
    }
    const topicRoot = this.didDoc_.id.replaceAll(':','/');
    const topic = `${topicRoot}/${this.edKey_.idOfKey}/sys/did/doc/cloud/store`;
    if(this.trace) {
      console.log('MqttJWTDidTeam::exchangeDidTeamInfo_::topic=<',topic,'>');
    }
    const syncMsg = {
      did:this.didDoc_,
      manifest:this.didManifest_
    };
    const signedSyncMsg = this.auth_.sign(syncMsg);
    if(this.trace) {
      console.log('MqttJWTDidTeam::exchangeDidTeamInfo_::signedSyncMsg=<',signedSyncMsg,'>');
    }
    const pubOpt = {qos: 0};
    this.mqttClient_.publish(topic,JSON.stringify(signedSyncMsg),pubOpt,(err) => {
      if(err) {
        console.log('MqttJWTDidTeam::exchangeDidTeamInfo_:err=<',err,'>');
      }      
    });
  }
  
}
module.exports = MqttJWTDidTeam;

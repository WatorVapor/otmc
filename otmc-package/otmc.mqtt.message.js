import { default as mqtt } from 'mqtt';
//console.log('::::mqtt=:<',mqtt,'>');
import { StoreKey, OtmcPortal } from './otmc.const.js';
import { MqttJWTAgent } from './otmc.mqtt.jwt.js';

/**
*
*/
export class MqttMessager {
  constructor(ee) {
    this.trace0 = false;
    this.trace = true;
    this.debug = true;
    this.isRequestingJwt = false;
    this.ee = ee;
    this.jwt = new MqttJWTAgent(ee);
    this.otmc = false;
    this.auth = false;
    this.base32 = false;
    this.util = false;
    this.ListenEventEmitter_();
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
    this.ee.on('sys.mqtt.jwt.agent.wsready',(evt)=>{
      if(self.trace) {
        console.log('MqttMessager::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.validateMqttJwt();
    });
    this.ee.on('mqtt:jwt.rental',(evt)=>{
      if(self.trace) {
        console.log('MqttMessager::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.storeMqttJwt(evt);
    });
    this.ee.on('mqtt.connectMqtt',(evt)=>{
      if(self.trace) {
        console.log('MqttMessager::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.connectMqtt();
    });
    this.ee.on('otmc.mqtt.publish',(evt)=>{
      if(self.trace) {
        console.log('MqttMessager::ListenEventEmitter_::evt=:<',evt,'>');
      }
      this.publish(evt.msg.topic,evt.msg,evt.option);
    });
  }
  async validateMqttJwt() {
    let fs = false;
    if(this.otmc.isNode) {
      fs = await import('fs');
    }
    if(this.trace0) {
      console.log('MqttMessager::validateMqttJwt::this.otmc=:<',this.otmc,'>');
    }
    try {
      let mqttJwtStr =  false;
      if(this.otmc.isNode) {
        mqttJwtStr = fs.readFileSync(this.otmc.config.mqttJwt);
      } else {
        mqttJwtStr = localStorage.getItem(StoreKey.mqttJwt);
      }
      if(mqttJwtStr) {
        this.mqttJwt = JSON.parse(mqttJwtStr);
        if(this.trace) {
          console.log('MqttMessager::validateMqttJwt::this.mqttJwt=:<',this.mqttJwt,'>');
        }
        const expDate = new Date();
        expDate.setTime(parseInt(this.mqttJwt.payload.exp) * 1000);
        if(this.trace) {
          console.log('MqttMessager::validateMqttJwt::expDate=:<',expDate,'>');
        }
        const exp_ms = expDate - new Date();
        if(this.trace) {
          console.log('MqttMessager::validateMqttJwt::exp_ms=:<',exp_ms,'>');
        }
        if(exp_ms < 0) {
          this.jwt.request();
          return;
        }
        this.otmc.emit('mqtt:jwt',this.mqttJwt);
        this.ee.emit('OtmcStateMachine.actor.send',{type:'mqtt:jwt'});
      } else {
        this.jwt.request();
      }
    } catch(err) {
      console.log('MqttMessager::validateMqttJwt::err=:<',err,'>');
      this.jwt.request();
    }
  }
  async storeMqttJwt(jwtData) {
    let fs = false;
    if(this.otmc.isNode) {
      fs = await import('fs');
    }
    if(this.trace) {
      console.log('MqttMessager::storeMqttJwt::jwtData=:<',jwtData,'>');
    }
    try {
      if(this.otmc.isNode) {
        fs.writeFileSync(this.otmc.config.mqttJwt,JSON.stringify(jwtData,undefined,2));
      } else {
        localStorage.setItem(StoreKey.mqttJwt,JSON.stringify(jwtData,undefined,2));
      }
    } catch(err) {
      console.error('MqttMessager::storeMqttJwt::err=:<',err,'>');
    }
    this.mqttJwt = JSON.parse(JSON.stringify(jwtData));
    this.otmc.emit('mqtt:jwt',this.mqttJwt);
    this.ee.emit('OtmcStateMachine.actor.send',{type:'mqtt:jwt'});
  }
  async freshMqttJwt() {
    let execSync = false;
    if(this.otmc.isNode) {
      execSync = await import('child_process');
    }
    if(this.trace) {
      console.log('MqttMessager::freshMqttJwt::this.otmc=:<',this.otmc,'>');
    }
    try {
      if(this.otmc.isNode) {
        localStorage.removeItem(StoreKey.mqttJwt);
        execSync(`rm -f ${this.otmc.config.mqttJwt}`);
      } else {
        localStorage.removeItem(StoreKey.mqttJwt);
      }
    } catch(err) {
      console.log('MqttMessager::freshMqttJwt::err=:<',err,'>');
    }
    this.validateMqttJwt();
  }
  connectMqtt() {
    if(this.trace0) {
      console.log('MqttMessager::connectMqtt::this.otmc=:<',this.otmc,'>');
    }
    if(!this.mqttJwt) {
      this.validateMqttJwt();
      return;
    }
    if(this.trace) {
      console.log('MqttMessager::connectMqtt::this.mqttJwt=:<',this.mqttJwt,'>');
    }
    this.createMqttConnection_(this.mqttJwt.jwt,this.mqttJwt.payload);
  }
  publish(topic,msgData,option) {
    if(this.trace) {
      console.log('MqttMessager::publish::topic=:<',topic,'>');
      console.log('MqttMessager::publish::msgData=:<',msgData,'>');
    }
    this.mqttClient_.publish(topic,JSON.stringify(msgData),option,(err) => {
      console.log('MqttMessager::publish::err=:<',err,'>');
    });
  }
  
  
  
  onMessage_(msg) {
    if(this.trace) {
      console.log('MqttMessager::onMessage_::msg=:<',msg,'>');
    }
  }
  
  createMqttConnection_(jwt,payload) {
    if(this.trace0) {
      console.log('MqttMessager::createMqttConnection_:jwt=<',jwt,'>');
      console.log('MqttMessager::createMqttConnection_:this.jwt=<',this.jwt,'>');
    }
    this.mqttjwt_ = jwt;
    this.payload_ = payload;
    const options = {
      // Authentication
      //clientId: `${this.util.randomAddress()}@${payload.clientid}`,
      clientId: `${payload.clientid}`,
      username: payload.username,
      password: jwt,
      protocolVersion:5,
      reconnectPeriod:1000*2,
      keepalive: 60*30,
      connectTimeout: 4000,
      clean: true,
      rejectUnauthorized: true
    };
    if(this.trace) {
      console.log('MqttMessager::createMqttConnection_:options=<',options,'>');
    }
    let srvUrl = false;
    if(this.otmc.isNode) {
      srvUrl = payload.mqtt.portal.tls;
    } else {
      srvUrl = payload.mqtt.portal.wss;
    }
    if(this.trace) {
      console.log('MqttMessager::createMqttConnection_:srvUrl=<',srvUrl,'>');
    }
    const mqttClient = mqtt.connect(srvUrl,options);
    const self = this;
    mqttClient.on('connect', (connack) => {
      if(self.trace) {
        console.log('MqttMessager::createMqttConnection_::connect connack=<',connack,'>');
      }
      if(self.trace) {
        console.log('MqttMessager::createMqttConnection_::mqttClient.connected=<',mqttClient.connected,'>');
      }
      self.isRequestingJwt = false;
      if(!self.firstConnected) { 
        this.otmc.emit('mqtt:connected');
        this.otmc.sm.actor.send({type:'mqtt:connected'});
        setTimeout(() => {
          self.runSubscriber_();
        },1);
        self.firstConnected = true;
      }
    });
    mqttClient.on('disconnect', (connack) => {
      if(self.trace) {
        console.log('MqttMessager::createMqttConnection_::disconnect connack=<',connack,'>');
      }
      if(self.trace) {
        console.log('MqttMessager::createMqttConnection_::mqttClient.connected=<',mqttClient.connected,'>');
      }
    });
    mqttClient.on('reconnect', () => {
      if(self.trace) {
        console.log('MqttMessager::createMqttConnection_ reconnect');
      }
    });
    mqttClient.on('error', (err) => {
      self.mqttClient_ = null;
      self.firstConnected = false;
      console.log('MqttMessager::createMqttConnection_::err.message=<',err.message,'>');
      console.log('MqttMessager::createMqttConnection_::err.name=<',err.name,'>');
      console.log('MqttMessager::createMqttConnection_::err.code=<',err.code,'>');
      const isJwtWrong = (err.name === 'ErrorWithReasonCode' && err.code === 134 
                          && err.message === 'Connection refused: Bad User Name or Password' );
      console.log('MqttMessager::createMqttConnection_::isJwtWrong=<',isJwtWrong,'>');
      if(isJwtWrong && self.isRequestingJwt === false) {
        self.isRequestingJwt = true;
        self.jwt.request();
      }
      mqttClient.end();
    });
    mqttClient.on('offline', () => {
      if(self.trace) {
        console.log('MqttMessager::createMqttConnection_::offline new Date() =<',new Date(),'>');
      }
    });
    mqttClient.on('close', () => {
      if(self.trace) {
        console.log('MqttMessager::createMqttConnection_::close new Date()=<',new Date(),'>');
      }
    });
    mqttClient.on('end', () => {
      if(self.trace) {
        console.log(':MqttMessager:createMqttConnection_::end new Date()=<',new Date(),'>');
      }
    });
    mqttClient.on('message', (topic, message, packet) => {
      if(this.trace) {
        console.log('MqttMessager::createMqttConnection_::message topic=<',topic,'>');
        console.log('MqttMessager::createMqttConnection_::message message=<',message,'>');
      }
      try {
        const msgUtf8 = message.toString('utf-8');
        const msgJson = JSON.parse(msgUtf8);
        self.onMqttMessage_(topic, msgJson);
      } catch( err ){
        console.error('MqttMessager::createMqttConnection_::message err=<',err,'>');
      }
    });
    mqttClient.on('packetsend', (packet) => {
      //console.log('MqttMessager::createMqttConnection_::packetsend packet=<',packet,'>');
    });
    mqttClient.on('packetreceive', (packet) => {
      if(this.trace) {
        console.log('MqttMessager::createMqttConnection_::packetreceive packet=<',packet,'>');
      }
    });
    this.mqttClient_ = mqttClient;
  }

  runSubscriber_() {
    if(this.trace) {
      console.log('MqttMessager::runSubscriber_::this.mqttClient_.connected=<',this.mqttClient_.connected,'>');
      console.log('MqttMessager::runSubscriber_:this.payload_=<',this.payload_,'>');
    }
    const subOpt = {qos: 0,nl:true};
    const subCallBack = (err, granted) => {
      if(this.trace) {
        console.log('MqttMessager::runSubscriber_:err=<',err,'>');
        console.log('MqttMessager::runSubscriber_:granted=<',granted,'>');
      }
      if(err) {
        console.log('MqttMessager::runSubscriber_:err=<',err,'>');
        console.log('MqttMessager::runSubscriber_:granted=<',granted,'>');
      }
    }
    if(this.payload_ && this.payload_.acl.all && this.payload_.acl.all.length > 0 ) {
      this.mqttClient_.subscribe(this.payload_.acl.all,subOpt,subCallBack);
    }
    if(this.payload_ && this.payload_.acl.sub && this.payload_.acl.sub.length > 0 ) {
      this.mqttClient_.subscribe(this.payload_.acl.sub,subOpt,subCallBack);
    }
    
    if(this.payload_ && this.payload_.acl && this.payload_.acl.length > 0 ) {
      for(const aclPart of this.payload_.acl) {
        if(this.trace) {
          console.log('MqttMessager::runSubscriber_:aclPart=<',aclPart,'>');
        }
        if(aclPart.action === 'all' || aclPart.action === 'subscribe') {
          const subOpt2 = {qos: 0,nl:true};
          if(aclPart.qos && aclPart.qos.length > 0) {
            for(const aclQos of aclPart.qos) {
              subOpt2.qos = aclQos;
              if(aclPart.permission === 'allow') {
                this.mqttClient_.subscribe(aclPart.topic,subOpt2,subCallBack);
              }              
            }
          } else {
            if(aclPart.permission === 'allow') {
              this.mqttClient_.subscribe(aclPart.topic,subOpt2,subCallBack);
            }
          }
        }
      }
    }    
  }
  onMqttMessage_(topic, msgJson) {
    if(this.trace) {
      console.log('MqttMessager::onMqttMessage_:topic=<',topic,'>');
      console.log('MqttMessager::onMqttMessage_:msgJson=<',msgJson,'>');
    }
    if(this.trace0) {
      console.log('MqttMessager::onMqttMessage_:this.auth=<',this.auth,'>');
    }
    let goodMsg = this.auth.verify(msgJson);
    if(this.trace) {
      console.log('MqttMessager::onMqttMessage_:goodMsg=<',goodMsg,'>');
    }
    if(!goodMsg) {
      if(topic.endsWith('/historyRelay')) {
        goodMsg = this.auth.verifyWithoutTS(msgJson);
      }
      if(topic.endsWith('/historyRelay4Invitation')) {
        goodMsg = this.auth.verifyWithoutTS(msgJson);
      }
      if(!goodMsg) {
        console.log('MqttMessager::onMqttMessage_:goodMsg=<',goodMsg,'>');
        console.log('MqttMessager::onMqttMessage_:msgJson=<',msgJson,'>');
        return;
      }
    }
    if(msgJson.topic !== topic) {
      if(topic.endsWith('/historyRelay') ||
        topic.endsWith('/historyRelay4Invitation')
      ) {
        const featureTopic = this.getFeatureTopic_(msgJson.topic);
        if(this.trace) {
          console.log('MqttMessager::onMqttMessage_:featureTopic=<',featureTopic,'>');
        }
        this.dispatchMessageHistory_(featureTopic,msgJson.topic,msgJson);
      } else {
        console.log('MqttMessager::onMqttMessage_:topic=<',topic,'>');
        console.log('MqttMessager::onMqttMessage_:msgJson.topic=<',msgJson.topic,'>');
      }
      return;
    }
    const featureTopic = this.getFeatureTopic_(topic);
    if(this.trace) {
      console.log('MqttMessager::onMqttMessage_:featureTopic=<',featureTopic,'>');
    }
    this.dispatchMessage_(featureTopic,topic,msgJson);
  }
  
  getFeatureTopic_(fullTopic) {
    if(this.trace) {
      console.log('MqttMessager::getFeatureTopic_:fullTopic=<',fullTopic,'>');
    }
    const featureTopics = fullTopic.split('/');
    if(this.trace) {
      console.log('MqttMessager::getFeatureTopic_:featureTopics=<',featureTopics,'>');
    }
    const featureTopic = featureTopics.slice(4).join('/');
    if(this.trace) {
      console.log('MqttMessager::getFeatureTopic_:featureTopic=<',featureTopic,'>');
    }
    return featureTopic;
  }

  dispatchMessage_(featureTopic,fullTopic,msgJson) {
    if(this.trace) {
      console.log('MqttMessager::dispatchMessage_:featureTopic=<',featureTopic,'>');
      console.log('MqttMessager::dispatchMessage_:fullTopic=<',fullTopic,'>');
      console.log('MqttMessager::dispatchMessage_:msgJson=<',msgJson,'>');
    }
    switch(featureTopic ) {
      case 'sys/did/seed/store': 
      case 'sys/did/auth/store': 
        this.otmc.did.onDidDocumentStore(msgJson.did,msgJson.auth_address);
        break;
      case 'sys/did/invitation/join':
        this.otmc.emit('didteam:joinLoaded',msgJson);
        this.otmc.did.onInvitationJoinRequest(msgJson.did,msgJson.auth_address);
        break;
      case 'sys/did/invitation/accept':
        this.otmc.emit('didteam:accept',msgJson);
        this.otmc.did.onInvitationAcceptReply(msgJson.did,msgJson.auth_address);
        break;
      default:
        break;
    }
  }
  
  dispatchMessageHistory_(featureTopic,fullTopic,msgJson) {
    if(this.trace) {
      console.log('MqttMessager::dispatchMessageHistory_:featureTopic=<',featureTopic,'>');
      console.log('MqttMessager::dispatchMessageHistory_:fullTopic=<',fullTopic,'>');
      console.log('MqttMessager::dispatchMessageHistory_:msgJson=<',msgJson,'>');
    }
    switch(featureTopic ) {
      case 'sys/did/document/seed/store': 
        this.otmc.did.storeDidDocumentHistory(msgJson.did,msgJson.auth_address);
        break;
      case 'sys/did/document/auth/store': 
        this.otmc.did.storeDidDocumentHistory(msgJson.did,msgJson.auth_address);
        break;
      case 'sys/did/manifest/seed/store': 
        this.otmc.did.storeDidManifestHistory(msgJson.manifest,msgJson.auth_address);
        break;
      case 'sys/did/manifest/auth/store': 
        this.otmc.did.storeDidManifestHistory(msgJson.manifest,msgJson.auth_address);
        break;
      case 'sys/did/invitation/store':
        this.otmc.emit('didteam:joinLoaded',msgJson);
        this.otmc.did.onInvitationJoinRequest(msgJson.did,msgJson.auth_address);
        break;
      case 'sys/did/invitation/join':
        this.otmc.emit('didteam:joinLoaded',msgJson);
        this.otmc.did.onInvitationJoinRequest(msgJson.did,msgJson.auth_address);
        break;
      default:
        console.log('MqttMessager::dispatchMessageHistory_:featureTopic=<',featureTopic,'>');
        break;
    }
    if(this.trace) {
      console.log('MqttMessager::dispatchMessageHistory_:featureTopic=<',featureTopic,'>');
    }
  }
}

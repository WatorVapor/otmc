import { default as mqtt } from 'mqtt';
//console.log('::::mqtt=:<',mqtt,'>');
import { StoreKey, OtmcPortal } from './otmc.const.js';
import { Base32 } from './edcrypto/base32.js';
import { EdUtil } from './edcrypto/edutils.js';
import { EdAuth } from './edcrypto/edauth.js';
import { MqttJWTAgent } from './otmc.mqtt.jwt.js';

/**
*
*/
export class MqttMessager {
  constructor(parentRef) {
    this.trace = true;
    this.debug = true;
    this.isRequestingJwt = false;
    this.otmc = parentRef.otmc;
    this.jwt = new MqttJWTAgent(parentRef);
    this.util = new EdUtil(new Base32());
  }
  validateMqttJwt() {
    if(this.trace) {
      console.log('MqttMessager::validateMqttJwt::this.otmc=:<',this.otmc,'>');
    }
    try {
      const mqttJwtStr = localStorage.getItem(StoreKey.mqttJwt);
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
        this.otmc.sm.actor.send({type:'mqtt:jwt'});
      } else {
        this.jwt.request();
      }
    } catch(err) {
      console.log('MqttMessager::validateMqttJwt::err=:<',err,'>');
      this.jwt.request();
    }
  }
  freshMqttJwt() {
    if(this.trace) {
      console.log('MqttMessager::freshMqttJwt::this.otmc=:<',this.otmc,'>');
    }
    try {
      localStorage.removeItem(StoreKey.mqttJwt);
    } catch(err) {
      console.log('MqttMessager::freshMqttJwt::err=:<',err,'>');
    }
    this.validateMqttJwt();
  }
  connectMqtt() {
    if(this.trace) {
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
    if(this.trace) {
      console.log('MqttMessager::createMqttConnection_:jwt=<',jwt,'>');
      console.log('MqttMessager::createMqttConnection_:this.jwt=<',this.jwt,'>');
    }
    this.mqttjwt_ = jwt;
    this.payload_ = payload;
    const options = {
      // Authentication
      clientId: `${this.util.randomAddress()}@${payload.clientid}`,
      username: payload.username,
      password: jwt,
      protocolVersion:5,
      keepalive: 60*30,
      connectTimeout: 4000,
      clean: true,
      rejectUnauthorized: true
    };
    if(this.trace) {
      console.log('MqttMessager::createMqttConnection_:options=<',options,'>');
    }
    const srvUrl = payload.mqtt.portal.wss;
    const mqttClient = mqtt.connect(srvUrl,options);
    const self = this;
    mqttClient.on('connect', (connack) => {
      //console.log('MqttMessager::createMqttConnection_::connect connack=<',connack,'>');
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
      //console.log('MqttMessager::createMqttConnection_::disconnect connack=<',connack,'>');
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
        console.log('MqttMessager::createMqttConnection_::message err=<',err,'>');
      }
    });
    mqttClient.on('packetsend', (packet) => {
      //console.log('MqttMessager::createMqttConnection_::packetsend packet=<',packet,'>');
    });
    mqttClient.on('packetreceive', (packet) => {
      //console.log('MqttMessager::createMqttConnection_::packetreceive packet=<',packet,'>');
    });
    this.mqttClient_ = mqttClient;
    this.tryCreateAuth_();
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
  }
  onMqttMessage_(topic, msgJson) {
    if(this.trace) {
      console.log('MqttMessager::onMqttMessage_:topic=<',topic,'>');
      console.log('MqttMessager::onMqttMessage_:msgJson=<',msgJson,'>');
      console.log('MqttMessager::onMqttMessage_:this.auth=<',this.auth,'>');
    }
    const goodMsg = this.auth.verify(msgJson);
    if(this.trace) {
      console.log('MqttMessager::onMqttMessage_:goodMsg=<',goodMsg,'>');
    }
    if(!goodMsg) {
      console.log('MqttMessager::onMqttMessage_:goodMsg=<',goodMsg,'>');
      console.log('MqttMessager::onMqttMessage_:msgJson=<',msgJson,'>');
      return;
    }
    if(msgJson.topic !== topic) {
      console.log('MqttMessager::onMqttMessage_:topic=<',topic,'>');
      console.log('MqttMessager::onMqttMessage_:msgJson.topic=<',msgJson.topic,'>');
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
  
  
  tryCreateAuth_() {
    if(this.trace) {
      console.log('MqttMessager::tryCreateAuth_::this.otmc.edcrypt=:<',this.otmc.edcrypt,'>');
    }
    if(this.otmc.edcrypt && this.otmc.edcrypt.authKey) {
      this.base32 = new Base32();
      this.util = new EdUtil(this.base32);
      this.auth = new EdAuth(this.otmc.edcrypt.authKey,this.util);
    } else {
      console.log('MqttMessager::tryCreateAuth_::this.otmc.edcrypt=:<',this.otmc.edcrypt,'>');      
    }
  }

}

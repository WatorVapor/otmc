import { default as mqtt } from 'mqtt';
//console.log('::::mqtt=:<',mqtt,'>');
import { StoreKey, OtmcPortal } from './otmc.const.js';
import { Base32 } from './edcrypto/base32.js';
import { EdUtil } from './edcrypto/edutils.js';
import { EdAuth } from './edcrypto/edauth.js';

/**
*
*/
export class MqttMessager {
  constructor(parentRef) {
    this.trace = true;
    this.debug = true;
    this.otmc = parentRef.otmc;
    this.jwt = new MqttJWTAgent(parentRef);
    //this.client = mqtt.connect();
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
        this.otmc.sm.actor.send('mqtt:jwt');
      } else {
        this.jwt.request();
      }
    } catch(err) {
      console.log('MqttMessager::validateMqttJwt::err=:<',err,'>');
      this.jwt.request();
    }
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
  send(data) {
  }
  onMessage_(msg) {
    if(this.trace) {
      console.log('MqttMessager::onMessage_::msg=:<',msg,'>');
    }
  }
  
  createMqttConnection_(jwt,payload) {
    if(this.trace) {
      console.log('MqttMessager::createMqttConnection_:jwt=<',jwt,'>');
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
    const srvUrl = payload.mqtt.portal.wss;
    const mqttClient = mqtt.connect(srvUrl,options);
    const self = this;
    mqttClient.on('connect', (connack) => {
      //console.log('MqttMessager::createMqttConnection_::connect connack=<',connack,'>');
      console.log('MqttMessager::createMqttConnection_::mqttClient.connected=<',mqttClient.connected,'>');
      self.runSubscriber_();
      setTimeout(()=>{
        self.exchangeDidTeamInfo_();
      },10);
    });
    mqttClient.on('disconnect', (connack) => {
      //console.log('MqttMessager::createMqttConnection_::disconnect connack=<',connack,'>');
      console.log('MqttMessager::createMqttConnection_::mqttClient.connected=<',mqttClient.connected,'>');
    });
    mqttClient.on('reconnect', () => {
      console.log('MqttMessager::createMqttConnection_ reconnect');
    });
    mqttClient.on('error', (err) => {
      self.mqttClient_ = null;
      console.log('MqttMessager::createMqttConnection_::err.message=<',err.message,'>');
      console.log('MqttMessager::createMqttConnection_::err.name=<',err.name,'>');
      console.log('MqttMessager::createMqttConnection_::err.code=<',err.code,'>');
      const isJwtWrong = (err.code === 134 && err.message === 'Connection refused: Bad User Name or Password');
      console.log('MqttMessager::createMqttConnection_::isJwtWrong=<',isJwtWrong,'>');
      if(isJwtWrong && self.isRequestingJwt === false) {
        self.isRequestingJwt = true;
        self.requestMqttAgent_();
      }
      mqttClient.end();
    });
    mqttClient.on('close', (evt) => {
      console.log('MqttMessager::createMqttConnection_::close evt=<',evt,'>');
    });
    mqttClient.on('end', (evt) => {
      console.log(':MqttMessager:createMqttConnection_::end evt=<',evt,'>');
    });
    mqttClient.on('offline', (evt) => {
      console.log('MqttMessager::createMqttConnection_::offline evt=<',evt,'>');
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
  }  
}

/**
*
*/
class MqttJWTAgent {
  constructor(parentRef) {
    this.trace = true;
    this.debug = true;
    this.otmc = parentRef.otmc;
    this.tryCreateAuth_();
    this.socket = new WebSocket(OtmcPortal.jwt.did.wss);
    if(this.trace) {
      console.log('MqttJWTAgent::constructor::this.socket=:<',this.socket,'>');
    }
    const self = this;
    this.socket.addEventListener('open', (evt) => {
      if(this.trace) {
        console.log('MqttJWTAgent::constructor::evt=:<',evt,'>');
      }
    });
    this.socket.addEventListener('message', (evt) => {
      if(this.trace) {
        console.log('MqttJWTAgent::constructor::evt=:<',evt,'>');
      }
      try {
        const msgJson = JSON.parse(evt.data);
        self.onMsg_(msgJson);
      } catch (err) {
        console.log('MqttJWTAgent::constructor::evt=:<',evt,'>');
      }
    })
  }
  
  request() {
    if(this.trace) {
      console.log('MqttJWTAgent::request::this.socket.readyState=:<',this.socket.readyState,'>');
      console.log('MqttJWTAgent::request::this.otmc=:<',this.otmc,'>');
    }
    this.tryCreateAuth_();
    const jwtReq = {
      jwt:{
        browser:true,
        username:this.auth.address(),
        clientid:`${this.auth.randomAddress()}@${this.auth.address()}`,
        did:this.otmc.did.didDoc_,
        manifest:this.otmc.did.didManifest_,
      },
    }
    if(this.trace) {
      console.log('MqttJWTAgent::request::jwtReq=<',jwtReq,'>');
    }
    const signedJwtReq = this.auth.sign(jwtReq,this.edkey_);
    if(this.trace) {
      console.log('MqttJWTAgent::request:signedJwtReq=<',signedJwtReq,'>');
    }
    this.socket.send(JSON.stringify(signedJwtReq));
  }
  
  onMsg_(msgData) {
    if(this.trace) {
      console.log('MqttJWTAgent::onMsg_::msgData=:<',msgData,'>');
    }
    if(msgData.jwt && msgData.payload) {
      localStorage.setItem(StoreKey.mqttJwt,JSON.stringify(msgData));
      this.otmc.emit('mqtt:jwt',msgData);
    }
  }
  
  tryCreateAuth_() {
    if(this.trace) {
      console.log('MqttJWTAgent::tryCreateAuth_::this.otmc.edcrypt=:<',this.otmc.edcrypt,'>');
    }
    if(this.otmc.edcrypt && this.otmc.edcrypt.authKey) {
      this.base32 = new Base32();
      this.util = new EdUtil(this.base32);
      this.auth = new EdAuth(this.otmc.edcrypt.authKey,this.util);
    } else {
      console.log('MqttJWTAgent::tryCreateAuth_::this.otmc.edcrypt=:<',this.otmc.edcrypt,'>');      
    }
  }
}
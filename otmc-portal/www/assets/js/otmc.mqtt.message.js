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
        const mqttJwt = JSON.parse(mqttJwtStr);
        if(this.trace) {
          console.log('MqttMessager::validateMqttJwt::mqttJwt=:<',mqttJwt,'>');
        }
      } else {
        this.jwt.request();
      }
    } catch(err) {
      console.log('MqttMessager::validateMqttJwt::err=:<',err,'>');
      this.jwt.request();
    }
  }
  send(data) {
  }
  onMessage_(msg) {
    if(this.trace) {
      console.log('MqttMessager::onMessage_::msg=:<',msg,'>');
    }
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
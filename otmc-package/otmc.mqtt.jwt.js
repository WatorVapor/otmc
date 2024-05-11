import { StoreKey, OtmcPortal } from './otmc.const.js';
/**
*
*/
export class MqttJWTAgent {
  constructor(ee) {
    this.trace0 = false;
    this.trace = true;
    this.debug = true;
    this.ee = ee;
    this.otmc = false;
    this.auth = false;
    this.base32 = false;
    this.util = false;
    this.ListenEventEmitter_();
  }
  ListenEventEmitter_() {
    if(this.trace) {
      console.log('MqttJWTAgent::ListenEventEmitter_::this.ee=:<',this.ee,'>');
    }
    const self = this;
    this.ee.on('sys.authKey.ready',(evt)=>{
      if(self.trace) {
        console.log('MqttJWTAgent::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.otmc = evt.otmc;
      self.auth = evt.auth;
      self.base32 = evt.base32;
      self.util = evt.util;
      self.connectOtmcPortal_();
    });
  }
  
  request() {
    if(this.trace) {
      console.log('MqttJWTAgent::request::this.socket.readyState=:<',this.socket.readyState,'>');
    }
    if(this.trace0) {
      console.log('MqttJWTAgent::request::this.otmc=:<',this.otmc,'>');
      console.log('MqttJWTAgent::request::this.otmc.isNode=:<',this.otmc.isNode,'>');
    }
    const jwtReq = {
      jwt:{
        browser:true,
        username:this.auth.address(),
        clientid:`${this.auth.randomAddress()}@${this.auth.address()}`,
        did:this.otmc.did.didDoc_,
        manifest:this.otmc.did.didManifest_,
      },
    }
    if(this.otmc.isNode) {
      delete jwtReq.jwt.browser;
      jwtReq.jwt.node = true;
    }
    if(this.trace) {
      console.log('MqttJWTAgent::request::jwtReq=<',jwtReq,'>');
    }
    const signedJwtReq = this.auth.sign(jwtReq,this.edkey_);
    if(this.trace) {
      console.log('MqttJWTAgent::request:signedJwtReq=<',signedJwtReq,'>');
    }
    this.retryRequest_(signedJwtReq);
  }
  retryRequest_(signedJwtReq) {
    if(this.socket && this.socket.readyState ) {
      this.socket.send(JSON.stringify(signedJwtReq));
    } else {
      const self = this;
      setTimeout(() => {
        self.retryRequest_(signedJwtReq);
      },1000)
    }
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
  connectOtmcPortal_() {
    this.socket = new WebSocket(OtmcPortal.jwt.did.wss);
    if(this.trace) {
      console.log('MqttJWTAgent::connectOtmcPortal_::this.socket=:<',this.socket,'>');
    }
    const self = this;
    this.socket.addEventListener('open', (evt) => {
      if(this.trace) {
        console.log('MqttJWTAgent::connectOtmcPortal_::evt=:<',evt,'>');
      }
      this.ee.emit('sys.mqtt.jwt.agent.wsready',evt);
    });
    this.socket.addEventListener('message', (evt) => {
      if(this.trace) {
        console.log('MqttJWTAgent::connectOtmcPortal_::evt=:<',evt,'>');
      }
      try {
        const msgJson = JSON.parse(evt.data);
        self.onMsg_(msgJson);
      } catch (err) {
        console.log('MqttJWTAgent::connectOtmcPortal_::evt=:<',evt,'>');
      }
    })    
  }
}
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
    if(OtmcPortal && OtmcPortal.jwt && OtmcPortal.jwt.did && OtmcPortal.jwt.did.wss) {
      this.wss = true;
    }
    if(OtmcPortal && OtmcPortal.jwt && OtmcPortal.jwt.did && OtmcPortal.jwt.did.rest) {
      this.rest = true;
    }
  }
  ListenEventEmitter_() {
    if(this.trace0) {
      console.log('MqttJWTAgent::ListenEventEmitter_::this.ee=:<',this.ee,'>');
    }
    const self = this;
    this.ee.on('sys.authKey.ready',(evt)=>{
      if(self.trace0) {
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
    if(this.wss) {
      if(this.socket && this.socket.readyState ) {
        this.socket.send(JSON.stringify(signedJwtReq));
      } else {
        if(this.trace) {
          console.log('MqttJWTAgent::retryRequest_:this.socket.readyState=<',this.socket.readyState,'>');
        }
        const self = this;
        setTimeout(() => {
          self.retryRequest_(signedJwtReq);
        },1000)
      }
    } else {
      if(this.trace) {
        console.log('MqttJWTAgent::retryRequest_:this.socket=<',this.socket,'>');
      }
    }
    if(this.rest) {
      this.requestOtmcJWTRestApi_(OtmcPortal.jwt.did.rest,signedJwtReq);
    }
  }
  
  onMsg_(msgData) {
    if(this.trace) {
      console.log('MqttJWTAgent::onMsg_::msgData=:<',msgData,'>');
    }
    if(msgData.jwt && msgData.payload) {
      if(this.trace) {
        console.log('MqttJWTAgent::onMsg_::msgData.payload=:<',msgData.payload,'>');
      }
      this.ee.emit('mqtt:jwt.rental',msgData);
    }
  }
  connectOtmcPortal_() {
    if(this.wss) {
      this.connectOtmcPortalWss_(OtmcPortal.jwt.did.wss);
    }
    if(this.rest) {
      this.ee.emit('sys.mqtt.jwt.agent.restapi');
    }
  }
  connectOtmcPortalWss_(wssUrl) {
    this.socket = new WebSocket(wssUrl);
    if(this.trace0) {
      console.log('MqttJWTAgent::connectOtmcPortalWss_::this.socket=:<',this.socket,'>');
    }
    const self = this;
    this.socket.addEventListener('open', (evt) => {
      if(this.trace) {
        console.log('MqttJWTAgent::connectOtmcPortalWss_::evt=:<',evt,'>');
      }
      this.ee.emit('sys.mqtt.jwt.agent.wsready',evt);
    });
    this.socket.addEventListener('message', (evt) => {
      if(this.trace) {
        console.log('MqttJWTAgent::connectOtmcPortalWss_::evt=:<',evt,'>');
      }
      try {
        const msgJson = JSON.parse(evt.data);
        self.onMsg_(msgJson);
      } catch (err) {
        console.log('MqttJWTAgent::connectOtmcPortalWss_::evt=:<',evt,'>');
      }
    })
    this.socket.addEventListener('error', (err) => {
      if(this.trace) {
        console.log('MqttJWTAgent::connectOtmcPortalWss_::err=:<',err,'>');
      }
      setTimeout(()=>{
        self.connectOtmcPortal_();
      },5*1000)
    });
  }
  requestOtmcJWTRestApi_(apiUrl,request) {
    if(this.trace) {
      console.log('MqttJWTAgent::requestOtmcJWTRestApi_::apiUrl=:<',apiUrl,'>');
      console.log('MqttJWTAgent::requestOtmcJWTRestApi_::request=:<',request,'>');
    }
    const encoder = new TextEncoder();
    const reqStr = JSON.stringify(request);
    if(this.trace) {
      console.log('MqttJWTAgent::requestOtmcJWTRestApi_::reqStr=:<',reqStr,'>');
    }
    const reqBin = encoder.encode(reqStr);
    if(this.trace) {
      console.log('MqttJWTAgent::requestOtmcJWTRestApi_::reqBin=:<',reqBin,'>');
    }
    const reqB32 = this.base32.encode(reqBin).toLowerCase();
    if(this.trace) {
      console.log('MqttJWTAgent::requestOtmcJWTRestApi_::reqB32=:<',reqB32,'>');
    }
    const fetchURl = `${apiUrl}/${reqB32}`;
    if(this.trace) {
      console.log('MqttJWTAgent::requestOtmcJWTRestApi_::fetchURl=:<',fetchURl,'>');
    }
    const self = this;
    fetch(fetchURl,{})
    .then(response => {
    })
    .catch(err => {
      if(self.trace) {
        console.log('MqttJWTAgent::requestOtmcJWTRestApi_::err=:<',err,'>');
      }
    });
  
  }
}
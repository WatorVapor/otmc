const WebSocket = require('ws');
const EdAuth = require('../edcrypto/edauth.js');
const auth = new EdAuth();

class MqttJWTAgent {
  constructor(didDoc,edkey,cb) {
    this.trace = true;
    this.debug = true;    
    if(this.trace) {
      console.log('MqttJWTAgent::constructor::didDoc=<',didDoc,'>');
    }
    this.didDoc_ = didDoc;
    this.edkey_ = edkey;
    this.readyCB_ = cb;
    this.createJwt_();
  }
  
  async createJwt_() {
    const self = this;
    const jwtUrl = `${this.didDoc_.service[0].serviceEndpoint}`;
    if(this.trace) {
      console.log('MqttJWTAgent::createJwt_::jwtUrl=<',jwtUrl,'>');
    }
    const wss = new WebSocket(jwtUrl);
    wss.on('error', (err)=>{
      console.log('MqttJWTAgent::createJwt_::jwtUrl=<',jwtUrl,'>');
      console.log('MqttJWTAgent::createJwt_::err=<',err,'>');
      process.exit(0);
    });
    wss.on('open', (evt) => {
      if(this.trace) {
        console.log('MqttJWTAgent::createJwt_::evt=<',evt,'>');
      }
      self.onWSOpened_(wss);
    });
    wss.on('message', (data) => {
      if(this.trace) {
        console.log('MqttJWTAgent::createJwt_::data=<',data,'>');
      }
      self.onMessage_(data);
    });
  }
  onWSOpened_(wss) {
    const jwtReq = {
      jwt:{
        node:true,
        username:this.edkey_.idOfKey,
        clientid:`${auth.randomAddress()}@${this.edkey_.idOfKey}`,
        secret:this.secret_,
      },
    }    
    if(this.trace) {
      console.log('MqttJWTAgent::onWSOpened_::jwtReq=<',jwtReq,'>');
    }
    const signedJwtReq = auth.sign(jwtReq,this.edkey_);
    if(this.trace) {
      console.log('MqttJWTAgent::onWSOpened_:signedJwtReq=<',signedJwtReq,'>');
    }
    wss.send(JSON.stringify(signedJwtReq));
  }
  onMessage_(data) {
    if(this.trace) {
      console.log('MqttJWTAgent::onMessage_::data=<',data,'>');
    }
    try {
      const jMsg = JSON.parse(data);
      if(this.trace) {
        console.log('MqttJWTAgent::onMessage_::jMsg=<',jMsg,'>');
        console.log('MqttJWTAgent::onMessage_::jMsg.payload=<',jMsg.payload,'>');
      }
      if(typeof this.readyCB_ ==='function') {
        this.readyCB_(jMsg);
      }
    } catch(err) {
      console.log('MqttJWTAgent::onMessage_::err=<',err,'>');      
    }
  }
  
}
module.exports = MqttJWTAgent;

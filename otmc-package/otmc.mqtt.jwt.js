import { StoreKey, OtmcPortal } from './otmc.const.js';
/**
*
*/
export class MqttJWTAgent {
  /**
   * Constructs an instance of MqttJWTAgent.
   * 
   * @param {EventEmitter} ee - An instance of EventEmitter.
   * 
   * @property {boolean} trace0 - Flag for initial trace logging.
   * @property {boolean} trace - Flag for trace logging.
   * @property {boolean} debug - Flag for debug logging.
   * @property {EventEmitter} ee - EventEmitter instance.
   * @property {boolean} otmc - Flag for OTMC status.
   * @property {boolean} auth - Flag for authentication status.
   * @property {boolean} base32 - Flag for base32 status.
   * @property {boolean} util - Flag for utility status.
   * @property {boolean} wss - Flag indicating if WebSocket Secure is enabled.
   * @property {boolean} rest - Flag indicating if REST is enabled.
   * 
   * @method ListenEventEmitter_ - Initializes the event emitter listener.
   */
  constructor(ee) {
    this.trace0 = true;
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
    if(this.trace0) {
      console.log('MqttJWTAgent::constructor::this=:<',this,'>');
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
    });
    this.ee.on('did:document',(evt)=>{
      if(self.trace0) {
        console.log('MqttJWTAgent::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.didDoc = evt.didDoc;
      self.connectOtmcJWT_();
    });
    this.ee.on('sys.mqtt.jwt.agent.restapi',(evt)=>{
      if(self.trace0) {
        console.log('MqttJWTAgent::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.requestOtmcJWTRestApi_();
    });
  }

 
  request() {
    this.connectOtmcJWT_();
  }

  

  connectOtmcJWT_() {
    if(this.trace0) {
      console.log('MqttJWTAgent::connectOtmcJWT_::this=:<',this,'>');
    }
    this.ee.emit('sys.mqtt.jwt.agent.restapi');
  }

  
  async requestOtmcJWTRestApi_(apiUrl,reqBody) {
    if(this.trace) {
      console.log('MqttJWTAgent::requestOtmcJWTRestApi_::apiUrl=:<',apiUrl,'>');
      console.log('MqttJWTAgent::requestOtmcJWTRestApi_::reqBody=:<',reqBody,'>');
    }
    const authentication = this.accessToken_();
    if(this.trace) {
      console.log('MqttJWTAgent::requestOtmcJWTRestApi_::authentication=:<',authentication,'>');
    }
    const reqHeader = new Headers();
    reqHeader.append('Content-Type', 'application/json');
    reqHeader.append('Authorization', `Bearer ${authentication}`);
    const reqOption = {
      method: 'POST',
      headers:reqHeader,
      body:JSON.stringify(reqBody)
    };
    const apiReq = new Request(`${apiUrl}/otmc`, reqOption);
    if(this.trace) {
      console.log('MqttJWTAgent::requestOtmcJWTRestApi_::apiReq=:<',apiReq,'>');
    }
    try {
      const apiResp = await fetch(apiReq);
      if(this.trace) {
        console.log('MqttJWTAgent::requestOtmcJWTRestApi_::apiResp=:<',apiResp,'>');
      }
      if(apiResp.ok) {
        const resultJson = await apiResp.json();
        if(this.trace) {
          console.log('MqttJWTAgent::requestOtmcJWTRestApi_::resultJson=:<',resultJson,'>');
        }
        return resultJson;
      } else {
        const resultJson = {
          ok:apiResp.ok,
          status:apiResp.status
        }
        return resultJson;
      }
    }
    catch(err) {
      if(this.trace) {
        console.log('MqttJWTAgent::requestOtmcJWTRestApi_::err=:<',err,'>');
      }
    }
  }

  accessToken_() {
    if(this.trace) {
      console.log('MqttJWTAgent::accessToken_::this.auth=:<',this.auth,'>');
    }
    const token = {};
    const signedToken = this.auth.sign(token);
    if(this.trace) {
      console.log('MqttJWTAgent::accessToken_::signedToken=:<',signedToken,'>');
    }
    const tokenB64 = this.util.encodeBase64Str(JSON.stringify(signedToken));
    if(this.trace) {
      console.log('MqttJWTAgent::accessToken_::tokenB64=:<',tokenB64,'>');
    }
    return tokenB64;
  }
}
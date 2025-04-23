import Dexie from 'dexie';
import { StoreKey, OtmcPortal } from './otmc.const.js';
const JWT_ERROR_RETRY_MS = 1000*60*1;
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
    this.version = '1.0';
    this.ee = ee;
    this.otmc = false;
    this.auth = false;
    this.base32 = false;
    this.util = false;
    this.retry = false;
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
    this.db = new Dexie(StoreKey.secret.mqtt.jwt.dbName);
    this.db.version(this.version).stores({
      jwt: 'did,authKey,updated,jwt,payload'
    });
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
      if(self.trace0) {
        console.log('MqttJWTAgent::ListenEventEmitter_::self.didDoc=:<',self.didDoc,'>');
      }
      if(self.didDoc) {
        self.validateMqttJwt();
      }
    });
    this.ee.on('sys.mqtt.jwt.agent.recieved',(evt)=>{
      self.validateMqttJwt();
    })
    this.ee.on('sys.mqtt.jwt.agent.fetch',(evt)=>{
      if(self.trace0) {
        console.log('MqttJWTAgent::ListenEventEmitter_::evt=:<',evt,'>');
      }
      const jwtReq = {
        jwt:{
          username:self.auth.address(),
          clientid:`${self.auth.randomAddress()}@${self.auth.address()}`,
          did:self.didDoc
        },
      }
      const signedJwtReq = this.auth.sign(jwtReq);
      self.requestOtmcJWTRestApi_(OtmcPortal.jwt.did.rest,signedJwtReq);
    });
  }


  async validateMqttJwt() {
    if(this.trace0) {
      console.log('MqttJWTAgent::validateMqttJwt::this.otmc=:<',this.otmc,'>');
    }
    try {
      const mqttJwt = await this.getJwt_();
      if(this.trace) {
        console.log('MqttJWTAgent::validateMqttJwt::mqttJwt=:<',mqttJwt,'>');
      }
      if(mqttJwt && mqttJwt.updated && mqttJwt.payload && mqttJwt.payload.ok === false) {
        if(this.trace) {
          console.log('MqttJWTAgent::validateMqttJwt::mqttJwt.payload=:<',mqttJwt.payload,'>');
        }
        const freshDate = new Date(mqttJwt.updated);
        const exp_ms = new Date() - freshDate
        if(this.trace) {
          console.log('MqttJWTAgent::validateMqttJwt::exp_ms=:<',exp_ms,'>');
        }
        if(exp_ms > JWT_ERROR_RETRY_MS || this.retry === false) {
          this.retry = true;
          const self = this;
          setTimeout(() => {
            self.ee.emit('sys.mqtt.jwt.agent.fetch',{});
          },1);
        }
        return;
      }
      const expDate = new Date();
      expDate.setTime(parseInt(mqttJwt.payload.exp) * 1000);
      if(this.trace) {
        console.log('MqttJWTAgent::validateMqttJwt::expDate=:<',expDate,'>');
      }
      const exp_ms = expDate - new Date();
      if(this.trace) {
        console.log('MqttJWTAgent::validateMqttJwt::exp_ms=:<',exp_ms,'>');
      }
      if(exp_ms < 0 || isNaN(exp_ms)) {
        this.ee.emit('sys.mqtt.jwt.agent.fetch',{});
        return;
      }
      this.ee.emit('mqtt.jwt.ready',mqttJwt);
      this.otmc.emit('mqtt:jwt',mqttJwt);
    } catch(err) {
      console.error('MqttJWTAgent::validateMqttJwt::err=:<',err,'>');
      this.ee.emit('sys.mqtt.jwt.agent.fetch',{});
    }
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
        const storeJwt = {
          did:this.didDoc.id,
          authKey:this.auth.address(),
          jwt:resultJson.jwt,
          payload:resultJson.payload
        };
        await this.putJWT_(storeJwt);
        this.ee.emit('sys.mqtt.jwt.agent.recieved',{});
        return resultJson;
      } else {
        const storeJwt = {
          did:this.didDoc.id,
          authKey:this.auth.address(),
          jwt:'empty',
          payload:{
            ok:apiResp.ok,
            status:apiResp.status,
          }
        };
        await this.putJWT_(storeJwt);
      }
    }
    catch(err) {
      if(this.trace) {
        console.log('MqttJWTAgent::requestOtmcJWTRestApi_::err=:<',err,'>');
      }
    }
  }

  async getJwt_() {
    const filter = {
      did: this.didDoc.id,
      authKey: this.auth.address()
    };
    const storeObject = await this.db.jwt.where(filter).first();
    if(this.trace) {
      console.log('MqttJWTAgent::getJwt_::storeObject=:<',storeObject,'>');
    }
    if(!storeObject) {
      return {jwt:'empty',payload:{empty:true,ok:false,status:404,updated:false}};
    }
    return {jwt:storeObject.jwt,payload:storeObject.payload,updated:storeObject.updated};
  }

  async putJWT_(jwtStore) {
    if(this.trace) {
      console.log('MqttJWTAgent::putJWT_::jwtStore=:<',jwtStore,'>');
    }
    const filter = {
      did: jwtStore.did,
      authKey: jwtStore.authKey
    };
    const storeObject = await this.db.jwt.where(filter).first();
    if(this.trace) {
      console.log('MqttJWTAgent::putJWT_::storeObject=:<',storeObject,'>');
    }
    jwtStore.updated = new Date().toISOString();
    if(!storeObject) {
      await this.db.jwt.put(jwtStore);
    } else {
      await this.db.jwt.update(jwtStore.did,jwtStore);
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
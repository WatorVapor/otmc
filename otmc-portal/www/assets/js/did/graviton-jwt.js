import {Level} from 'https://cdn.jsdelivr.net/npm/level@8.0.0/+esm'
import {MassStore} from './mass-store.js';
const iConstOneHourInMs  = 1000 * 3600;

const cfConstLevelOption = {
  createIfMissing: true,
  keyEncoding: 'utf8',
  valueEncoding: 'utf8',
};

export class GravitonJWT {
  static trace = false;
  static debug = true;

  static storeDb_ = false;
  constructor(evidences,mass,resolve,cb) {
    if(GravitonJWT.trace) {
      console.log('GravitonJWT::constructor:evidences=<',evidences,'>');
    }
    this.evidences_ = evidences;
    this.mqttJwt_ = resolve;
    this.mass_ = mass;
    this.cb_ = cb;
    this.addressEvid_ = this.mass_.calcAddress(evidences);
    this.jwtLSKey_ = `${constDIDTeamAuthGravitonJwtPrefix}/${this.addressEvid_}/${this.mass_.address_}`;
    if(!GravitonJWT.storeDb_) {
      GravitonJWT.storeDb_ = new Level('maap_store_graviton', cfConstLevelOption);
      if(GravitonJWT.debug) {
        console.log('GravitonJWT::constructor::GravitonJWT.storeDb_=<',GravitonJWT.storeDb_,'>');
      }
    }
    this.checkLocalStorageOfMqttJwt_();
  }

  async checkLocalStorageOfMqttJwt_() {
    if(GravitonJWT.debug) {
      console.log('GravitonJWT::checkLocalStorageOfMqttJwt_:this.mass_=<',this.mass_,'>');
    }
    try {
      const jwtStr = await GravitonJWT.storeDb_.get(this.jwtLSKey_);
      const jwt = JSON.parse(jwtStr);
      if(GravitonJWT.debug) {
        console.log('GravitonJWT::checkLocalStorageOfMqttJwt_:jwt=<',jwt,'>');
      }
      if(jwt.payload && jwt.payload.exp ) {
        const jwtExpDate = new Date();
        const timeInMs = parseInt(jwt.payload.exp) *1000;
        jwtExpDate.setTime(timeInMs);
        if(GravitonJWT.debug) {
          console.log('GravitonJWT::checkLocalStorageOfMqttJwt_:jwtExpDate=<',jwtExpDate,'>');
        }
        const exp_remain_ms = jwtExpDate - new Date();
        if(GravitonJWT.debug) {
          console.log('GravitonJWT::checkLocalStorageOfMqttJwt_:exp_remain_ms=<',exp_remain_ms,'>');
        }
        if(exp_remain_ms > iConstOneHourInMs) {
          if(typeof this.cb_ === 'function') {
            this.cb_(jwt);
          }
          return;
        }
      }
    } catch(err) {
      console.log('GravitonJWT::checkLocalStorageOfMqttJwt_:err=<',err,'>');
    }
    this.reqMqttAuthOfJwt_();
  }
 
  reqMqttAuthOfJwt_() {
    if(GravitonJWT.trace) {  
      console.log('GravitonJWT::reqMqttAuthOfJwt_:this.evidences_=<',this.evidences_,'>');
    }
    this.createMqttAuthOfJwtConnection_();
  }
  
  createMqttAuthOfJwtConnection_() {
    if(GravitonJWT.trace) {
      console.log('GravitonJWT::createMqttAuthOfJwtConnection_:this.mqttJwt_=<',this.mqttJwt_,'>');
    }    
    const wsClient = new WebSocket(this.mqttJwt_);
    if(GravitonJWT.debug) {
      console.log('GravitonJWT::wsClient=<',wsClient,'>');
    }
    const self = this;
    wsClient.onopen = (evt)=> {
      if(GravitonJWT.debug) {
        console.log('GravitonJWT::createMqttAuthOfJwtConnection_::onopen:evt=<',evt,'>');
      }
      setTimeout(()=>{
        self.onMqttJwtChannelOpened_(wsClient);
      },100)
    }
    wsClient.onclose = (evt)=> {
      if(GravitonJWT.debug) {
        console.log('GravitonJWT::createMqttAuthOfJwtConnection_::onclose:evt=<',evt,'>');
      }
    }
    wsClient.onerror = (err)=> {
      console.error('GravitonJWT::createMqttAuthOfJwtConnection_::onerror:err=<',err,'>');
    }
    wsClient.onmessage = (evt)=> {
      if(GravitonJWT.debug) {
        console.log('GravitonJWT::createMqttAuthOfJwtConnection_::onmessage:evt=<',evt,'>');
      }
      try {
        const msg = JSON.parse(evt.data);
        if(GravitonJWT.debug) {
          console.log('GravitonJWT::createMqttAuthOfJwtConnection_::onmessage:msg=<',msg,'>');
        }
        if(msg.jwt && msg.payload) {
          self.onMqttJwtReply_(msg,msg.payload,evt.data);
        }
      } catch(err) {
        console.error('GravitonJWT::createMqttAuthOfJwtConnection_::onmessage:err=<',err,'>');
      }
    }

  }
  onMqttJwtChannelOpened_ (wsClient) {
    if(GravitonJWT.debug) {
      console.log('onMqttJwtChannelOpened_::wsClient=<',wsClient,'>');
      console.log('onMqttJwtChannelOpened_::this.evidences_=<',this.evidences_,'>');
      console.log('GravitonJWT::reqMqttAuthOfJwt_:this.mass_=<',this.mass_,'>');
    }
    const jwtReq = {
      jwt:{
        browser:true,
        addressKey:this.mass_.address_,
        addressReq:this.addressEvid_,
      },
      evidences:this.evidences_
    }
    const signedJwtReq = this.mass_.sign(jwtReq);
    if(GravitonJWT.debug) {
      console.log('onMqttJwtChannelOpened_::signedJwtReq=<',signedJwtReq,'>');
    }
    wsClient.send(JSON.stringify(signedJwtReq));
  }
  async onMqttJwtReply_(jwt,payload,origData) {
    if(GravitonJWT.debug) {
      console.log('onMqttJwtReply_::jwt=<',jwt,'>');
      console.log('onMqttJwtReply_::payload=<',payload,'>');
    }
    if(payload.keyid) {
      const jwtLSKey = `${constDIDTeamAuthGravitonJwtPrefix}/${payload.reqid}/${payload.keyid}`;
      await GravitonJWT.storeDb_.put(jwtLSKey,origData);
    }
    if(typeof this.cb_ === 'function') {
      this.cb_(jwt);
    }
  }
}


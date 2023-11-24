import { default as mqtt } from 'mqtt';
console.log('::::mqtt=:<',mqtt,'>');
import { StoreKey, OtmcPortal } from './otmc.const.js';

/**
*
*/
export class MqttMessager {
  constructor(parentRef) {
    this.trace = true;
    this.debug = true;
    this.otmc = parentRef.otmc;
    this.jwt = new MqttJwtRequest(parentRef);
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

class MqttJwtRequest {
  constructor(parentRef) {
    this.trace = true;
    this.debug = true;
    this.otmc = parentRef.otmc;
    this.socket = new WebSocket(OtmcPortal.jwt.did.wss); 
    if(this.trace) {
      console.log('MqttJwtRequest::constructor::this.socket=:<',this.socket,'>');
    }
    this.socket.addEventListener('open', (evt) => {
      if(this.trace) {
        console.log('MqttJwtRequest::constructor::evt=:<',evt,'>');
      }
    });

  }
  request() {
    if(this.trace) {
      console.log('MqttJwtRequest::request::this.socket=:<',this.socket,'>');
    }
  }
}
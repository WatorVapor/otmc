import { default as mqtt } from 'mqtt';
console.log('::::mqtt=:<',mqtt,'>');
/**
*
*/
export class MqttMessager {
  constructor(otmc) {
    this.trace = true;
    this.debug = true;
    this.otmc = otmc;
    //this.client = mqtt.connect();
  }
  validateMqttJwt() {
    if(this.trace) {
      console.log('MqttMessager::validateMqttJwt::this.otmc=:<',this.otmc,'>');
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

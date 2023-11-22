/**
*
*/
export class MqttMessager {
  constructor(otmc) {
    this.trace = true;
    this.debug = true;
    this.otmc = otmc;
    //this.mqtt = mqtt.connect();
  }
  send(data) {
  }
  onMessage_(msg) {
    if(this.trace) {
      console.log('MqttMessager::onMessage_::msg=:<',msg,'>');
    }
  }
}

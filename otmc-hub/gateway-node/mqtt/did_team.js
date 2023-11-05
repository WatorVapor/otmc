const MqttJWTAgent = require('./mqtt_jwt.js');
//console.log(':::MqttJWTAgent=<',MqttJWTAgent,'>');
class MqttJWTDidTeam {
  constructor(didDoc,edKey) {
    this.trace = false;
    this.debug = true;
    if(this.trace) {
      console.log('MqttJWTDidTeam::constructor:didDoc=<',didDoc,'>');
      console.log('MqttJWTDidTeam::constructor:edKey=<',edKey,'>');
    }
    this.didDoc_ = didDoc;
    this.edKey_ = edKey;
    this.startMqttAgent_();
  }
  startMqttAgent_() {
    const jwtAgent = new MqttJWTAgent(this.didDoc_,this.edKey_,(jwtReply) => {
      if(this.trace) {
        console.log('MqttJWTDidTeam::startMqttAgent_:jwtReply=<',jwtReply,'>');
      }
    });
    if(this.trace) {
      console.log('MqttJWTDidTeam::startMqttAgent_:jwtAgent=<',jwtAgent,'>');
    }
  }
}
module.exports = MqttJWTDidTeam;

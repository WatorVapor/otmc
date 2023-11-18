import { EventEmitter } from 'eventemitter3';
console.log('::::EventEmitter=:<',EventEmitter,'>');
const packPath = `${constAppPrefix}/assets/js`;

/**
*
*/
export class Otmc extends EventEmitter {
  constructor() {
    super();
    this.trace = true;
    this.debug = true;
    this.edcrypt = new EdcryptWorker(this);
    const self = this;
    setTimeout(()=>{
      self.edcrypt.loadKey();
    },1);
    this.mqtt = new MqttWorker(this);
  }
  startMining() {
    const data = {
      path:packPath,
      cmd:'mine'
    }
    this.edcrypt.postMessage(data);
  }
}


/**
*
*/
class EdcryptWorker {
  constructor(evtEmitter) {
    this.trace = true;
    this.debug = true;
    this.evtEmitter = evtEmitter;
    this.edcrypt = new Worker(`${packPath}/otmc.worker.edcrypt.js`);
    if(this.trace) {
      console.log('EdcryptWorker::constructor::this.edcrypt=:<',this.edcrypt,'>');
    }
    const self = this;
    this.edcrypt.onmessage = (e) => {
      self.onEdCryptMessage_(e.data);
    }
    const initMsg = {
      init:{
        path:packPath,
      }
    };
    this.edcrypt.postMessage(initMsg);
  }
  postMessage(data) {
    this.edcrypt.postMessage(data);
  }
  loadKey() {
    try {
      const authKeyStr = localStorage.getItem(constAuthKey);
      this.authKey = JSON.parse(authKeyStr);
      const recoveryKeyStr = localStorage.getItem(constRecoveryKey);
      this.recoveryKey = JSON.parse(recoveryKeyStr);
      const addressMsg = {
        auth:this.authKey.idOfKey,
        recovery:this.recoveryKey.idOfKey,
      };
      this.evtEmitter.emit('edcrypt:address',addressMsg);
    } catch(err) {
      console.log('EdcryptWorker::loadKey::err=:<',err,'>');
    }
  }
  onEdCryptMessage_(msg) {
    if(this.trace) {
      console.log('EdcryptWorker::onEdCryptMessage_::msg=:<',msg,'>');
    }
    if(msg.auth && msg.recovery) {
      localStorage.setItem(constAuthKey,JSON.stringify(msg.auth));
      localStorage.setItem(constRecoveryKey,JSON.stringify(msg.recovery));
      this.authKey = msg.auth;
      this.recoveryKey = msg.recovery;
      const addressMsg = {
        auth:this.authKey.idOfKey,
        recovery:this.recoveryKey.idOfKey,
      };
      this.evtEmitter.emit('edcrypt:address',addressMsg);
    }
    if(msg.mining) {
      this.evtEmitter.emit('edcrypt:mining',msg.mining);
    }
  }
}

/**
*
*/
class MqttWorker {
  constructor(evtEmitter) {
    this.trace = true;
    this.debug = true;
    this.evtEmitter = evtEmitter;
    this.mqtt = new Worker(`${packPath}/otmc.worker.mqtt.js`);
    if(this.trace) {
      console.log('MqttWorker::constructor::this.mqtt=:<',this.mqtt,'>');
    }
    const self = this;
    this.mqtt.onmessage = (e) => {
      self.onMqttMessage_(e.data);
    }
    const initMsg = {
      init:{
      }
    };
    this.mqtt.postMessage(initMsg);
  }
  postMessage(data) {
    this.mqtt.postMessage(data);
  }
  onMqttMessage_(msg) {
    if(this.trace) {
      console.log('MqttWorker::onMqttMessage_::msg=:<',msg,'>');
    }
  }
}

import { EventEmitter } from 'eventemitter3';
console.log('::::EventEmitter=:<',EventEmitter,'>');
const packPath = `${constAppPrefix}/assets/js`;
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
  }
  startMining() {
    const data = {
      path:packPath,
      cmd:'mine'
    }
    this.edcrypt.postMessage(data);
  }
}

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
      this.evtEmitter.emit('address',addressMsg);
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
    }
    if(msg.mining) {
      this.evtEmitter.emit('mining',msg.mining);
    }
  }
}

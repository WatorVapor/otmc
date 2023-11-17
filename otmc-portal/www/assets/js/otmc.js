import { EventEmitter } from 'eventemitter3';
console.log('::::EventEmitter=:<',EventEmitter,'>');
const packPath = `${constAppPrefix}/assets/js`;
export class Otmc extends EventEmitter {
  constructor() {
    super();
    this.trace = true;
    this.debug = true;
    this.edcrypt = new EdcryptWorker(this);
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
  onEdCryptMessage_(msg) {
    if(this.trace) {
      console.log('EdcryptWorker::onEdCryptMessage_::msg=:<',msg,'>');
    }
    if(msg.auth && msg.recovery) {
      localStorage.setItem(constAuthKey,JSON.stringify(msg.auth));
      localStorage.setItem(constRecoveryKey,JSON.stringify(msg.recovery));
    }
  }
}

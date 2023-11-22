import { EventEmitter } from 'eventemitter3';
import { MqttMessager } from './otmc.mqtt.message.js';
import { DidDocument } from './otmc.did.document.js';
/**
*
*/
export class Otmc extends EventEmitter {
  static trace = false;
  static debug = true;
  constructor() {
    super();
    this.trace = true;
    this.debug = true;
    this.scriptPath = getScriptPath();
    if(this.trace) {
      console.log('EdcryptWorker::constructor::this.scriptPath=:<',this.scriptPath,'>');
    }
    this.edcrypt = new EdcryptWorker(this);
    setTimeout(() => {
      self.edcrypt.loadKey();
    },0);
    
    this.did = new DidDocument(this);
    this.mqtt = new MqttMessager(this);
    const self = this;
  }
  startMining() {
    const data = {
      mine:{
        start:true,
      }
    }
    this.edcrypt.postMessage(data);
  }
  createDidTeamFromSeed() {
    return this.did.createSeed();
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
    this.edcrypt = new Worker(`${evtEmitter.scriptPath}/otmc.worker.edcrypt.js`);
    if(this.trace) {
      console.log('EdcryptWorker::constructor::this.edcrypt=:<',this.edcrypt,'>');
    }
    const self = this;
    this.edcrypt.onmessage = (e) => {
      self.onEdCryptMessage_(e.data);
    }
    const initMsg = {
      init:{
        path:evtEmitter.scriptPath,
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


const getScriptPath = () => {
  const errorDummy = new Error();
  if(Otmc.trace) {
    console.log('::getScriptPath::errorDummy.stack.trim()=:<',errorDummy.stack.trim(),'>');
  }
  const stackParams = errorDummy.stack.trim().split('\n    at ');
  if(Otmc.trace) {
    console.log('::getScriptPath::stackParams=:<',stackParams,'>');
  }  
  if(stackParams.length > 0 ) {
    const fileStack = stackParams[1];
    if(Otmc.trace) {
      console.log('::getScriptPath::fileStack=:<',fileStack,'>');
    }
    const fileLine = fileStack.replace('getScriptPath (','').replace(')','');
    if(Otmc.trace) {
      console.log('::getScriptPath::fileLine=:<',fileLine,'>');
    }
    const fileLineParams = fileLine.split('/');
    if(Otmc.trace) {
      console.log('::getScriptPath::fileLineParams=:<',fileLineParams,'>');
    }
    const scriptPath = fileLineParams.slice(0,fileLineParams.length -1).join('/');
    if(Otmc.trace) {
      console.log('::getScriptPath::scriptPath=:<',scriptPath,'>');
    }
    return scriptPath;
  }
  return '';
}

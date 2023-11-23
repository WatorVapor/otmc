import { EventEmitter } from 'eventemitter3';
import { MqttMessager } from './otmc.mqtt.message.js';
import { DidDocument } from './otmc.did.document.js';
import { OtmcStateMachine } from './otmc.state.machine.js';
import { StoreKey } from './otmc.const.js';

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
    const thisRefer = {otmc:this};
    this.edcrypt = new EdcryptWorker(thisRefer);
    this.did = new DidDocument(thisRefer);
    this.mqtt = new MqttMessager(thisRefer);
    const self = this;
    setTimeout(() => {
      self.sm = new OtmcStateMachine(thisRefer);
    },10);
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
  constructor(parentRef) {
    this.trace = true;
    this.debug = true;
    this.otmc = parentRef.otmc;
    this.edcrypt = new Worker(`${this.otmc.scriptPath}/otmc.worker.edcrypt.js`);
    if(this.trace) {
      console.log('EdcryptWorker::constructor::this.edcrypt=:<',this.edcrypt,'>');
    }
    const self = this;
    this.edcrypt.onmessage = (e) => {
      self.onEdCryptMessage_(e.data);
    }
    const initMsg = {
      init:{
        path:this.otmc.scriptPath,
      }
    };
    this.edcrypt.postMessage(initMsg);
  }
  postMessage(data) {
    this.edcrypt.postMessage(data);
  }
  loadKey() {
    try {
      const authKeyStr = localStorage.getItem(StoreKey.auth);
      this.authKey = JSON.parse(authKeyStr);
      const recoveryKeyStr = localStorage.getItem(StoreKey.recovery);
      this.recoveryKey = JSON.parse(recoveryKeyStr);
      const addressMsg = {
        auth:this.authKey.idOfKey,
        recovery:this.recoveryKey.idOfKey,
      };
      this.otmc.emit('edcrypt:address',addressMsg);
      this.otmc.sm.actor.send('edcrypt:address');
    } catch(err) {
      console.log('EdcryptWorker::loadKey::err=:<',err,'>');
    }
  }
  onEdCryptMessage_(msg) {
    if(this.trace) {
      console.log('EdcryptWorker::onEdCryptMessage_::msg=:<',msg,'>');
    }
    if(msg.auth && msg.recovery) {
      localStorage.setItem(StoreKey.auth,JSON.stringify(msg.auth));
      localStorage.setItem(StoreKey.recovery,JSON.stringify(msg.recovery));
      this.authKey = msg.auth;
      this.recoveryKey = msg.recovery;
      const addressMsg = {
        auth:this.authKey.idOfKey,
        recovery:this.recoveryKey.idOfKey,
      };
      this.otmc.emit('edcrypt:address',addressMsg);
    }
    if(msg.mining) {
      this.otmc.emit('edcrypt:mining',msg.mining);
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

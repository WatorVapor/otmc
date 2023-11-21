import { EventEmitter } from 'eventemitter3';
import { default as mqtt }   from 'mqtt';
console.log('::::EventEmitter=:<',EventEmitter,'>');
console.log('::::mqtt=:<',mqtt,'>');
const packPath = `${constAppPrefix}/assets/js`;

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
    this.mqtt = new MqttMessager(this);
    this.did = new DidDocument(this);
    const self = this;
    setTimeout(() => {
      self.edcrypt.loadKey();
    },0);
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



/**
*
*/
class MqttMessager {
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


/**
*
*/
class DidDocument {
  constructor(otmc) {
    this.trace = true;
    this.debug = true;
    this.otmc = otmc;
    const self = this;
    setTimeout(() => {
      self.createMoudles_();
    },1);
  }
  createSeed() {
    if(this.trace) {
      console.log('DidDocument::createSeed::this.otmc=:<',this.otmc,'>');
    }
    const address = this.seed.address();
    if(this.trace) {
      console.log('DidDocument::createSeed::address=:<',address,'>');
    }
    const documentObj = this.seed.document();
    if(this.trace) {
      console.log('DidDocument::createSeed::documentObj=:<',documentObj,'>');
    }
    return documentObj;
  }
  
  async createMoudles_() {
    const base32Path = `${this.otmc.scriptPath}/edcrypto/base32.js`;
    if(this.trace) {
      console.log('DidDocument::createMoudles_::base32Path=:<',base32Path,'>');
    }
    const { Base32 } = await import(base32Path);
    if(this.trace) {
      console.log('DidDocument::createMoudles_::Base32=:<',Base32,'>');
    }
    this.base32 = new Base32();

    const edutilsPath = `${this.otmc.scriptPath}/edcrypto/edutils.js`;
    if(this.trace) {
      console.log('DidDocument::createMoudles_::edutilsPath=:<',edutilsPath,'>');
    }
    const { EdUtil } = await import(edutilsPath);
    if(this.trace) {
      console.log('DidDocument::createMoudles_::EdUtil=:<',EdUtil,'>');
    }
    this.util = new EdUtil(this.base32);
    
    const edauthPath = `${this.otmc.scriptPath}/edcrypto/edauth.js`;
    if(this.trace) {
      console.log('DidDocument::createMoudles_::edauthPath=:<',edauthPath,'>');
    }
    const { EdAuth } = await import(edauthPath);
    if(this.trace) {
      console.log('DidDocument::createMoudles_::EdAuth=:<',EdAuth,'>');
    }
    this.auth = new EdAuth(this.otmc.edcrypt.authKey,this.util);
    this.recovery = new EdAuth(this.otmc.edcrypt.recoveryKey,this.util);
    if(this.trace) {
      console.log('DidDocument::createMoudles_::this.auth=:<',this.auth,'>');
    }
    if(this.trace) {
      console.log('DidDocument::createMoudles_::this.recovery=:<',this.recovery,'>');
    }

    const docPath = `${this.otmc.scriptPath}/did/document.js`;
    if(this.trace) {
      console.log('DidDocument::createMoudles_::docPath=:<',docPath,'>');
    }
    const { DIDSeedDocument } = await import(docPath);
    if(this.trace) {
      console.log('DidDocument::createMoudles_::DIDSeedDocument=:<',DIDSeedDocument,'>');
    }
    this.seed = new DIDSeedDocument(this.auth,this.recovery);
    if(this.trace) {
      console.log('DidDocument::createMoudles_::this.seed=:<',this.seed,'>');
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

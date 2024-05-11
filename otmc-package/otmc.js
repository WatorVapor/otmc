import { EventEmitter } from 'eventemitter3';
import { default as mqtt } from 'mqtt';

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
  constructor(config) {
    super();
    this.trace = true;
    this.debug = true;
    if(config) {
      this.config = config;
      this.isNode = config.node;
    } else {
      this.config = {};
    }
    this.ee = new EventEmitter();
    if(this.trace) {
      console.log('Otmc::constructor::this.ee=:<',this.ee,'>');
    }
    if(this.isNode) {
      this.edcrypt = new EdcryptWithNode(this.ee);
    } else {
      this.scriptPath = getScriptPath();
      if(this.trace) {
        console.log('Otmc::constructor::this.scriptPath=:<',this.scriptPath,'>');
      }
      this.edcrypt = new EdcryptBrowserWorker(this.ee);
    }
    this.did = new DidDocument(this.ee);
    this.mqtt = new MqttMessager(this.ee);
    const self = this;
    setTimeout(() => {
      self.edcrypt.otmc = self;
      self.did.otmc = self;
      self.mqtt.otmc = self;
      self.ee.emit('edcrypt.runWorker',{});
      self.sm = new OtmcStateMachine(this.ee);
    },1);
    this.mqttOption = {
      qos:0,
      nl:true
    };
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
  joinDidTeamAsAuth(id) {
    return this.did.createJoinAsAuth(id);
  }
  
  
  requestJoinDidTeam() {
    const joinRequest = this.did.requestJoinDid();
    if(this.trace) {
      console.log('Otmc::requestJoinDidTeam::joinRequest=:<',joinRequest,'>');
    }
    this.mqtt.publish(joinRequest.topic,joinRequest,this.mqttOption);
  }
  acceptInvitation(address){
    if(this.trace) {
      console.log('Otmc::acceptInvitation::new Date()=:<',new Date(),'>');
      console.log('Otmc::acceptInvitation::address=:<',address,'>');
    }
    const invitationReply = this.did.acceptInvitation(address);
    this.mqtt.publish(invitationReply.topic,invitationReply,this.mqttOption);
  }
  rejectInvitation(address){
    if(this.trace) {
      console.log('Otmc::rejectInvitation::new Date()=:<',new Date(),'>');
      console.log('Otmc::rejectInvitation::address=:<',address,'>');
    }
    const rejectInvitationReply = this.did.rejectInvitation(address);
    this.mqtt.publish(invitationReply.topic,invitationReply,this.mqttOption);
  }
  checkEvidenceChain(){
    if(this.trace) {
      console.log('Otmc::checkEvidenceChain::new Date()=:<',new Date(),'>');
    }
    this.did.checkDidEvidence_();
  }
}




/**
*
*/
class EdcryptBrowserWorker {
  constructor(ee) {
    this.trace = true;
    this.debug = true;
    this.otmc = false;
    this.ee = ee;
    this.ListenEventEmitter_();
  }
  ListenEventEmitter_() {
    const self = this;
    this.ee.on('edcrypt.runWorker',(evt)=>{
      if(this.trace) {
        console.log('EdcryptBrowserWorker::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.runWorker();
    });
    this.ee.on('edcrypt.loadKey',(evt)=>{
      if(this.trace) {
        console.log('EdcryptBrowserWorker::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.loadKey();
    });
  }

  runWorker() {
    const self = this;
    fetch(`${this.otmc.scriptPath}/otmc.worker.edcrypt.js`)
    .then((response) => response.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      if(self.trace) {
        console.log('EdcryptBrowserWorker::runWorker::url=:<',url,'>');
      }
      self.cryptWorker = new Worker(url);
      if(self.trace) {
        console.log('EdcryptBrowserWorker::runWorker::self.cryptWorker=:<',self.cryptWorker,'>');
      }
      self.cryptWorker.onmessage = (e) => {
        self.onEdCryptMessage_(e.data);
      }
      self.cryptWorker.onerror = (err) => {
        console.log('EdcryptBrowserWorker::runWorker::err=:<',err,'>');
      }
      const initMsg = {
        init:{
          path:self.otmc.scriptPath,
        }
      };    
      self.cryptWorker.postMessage(initMsg);
      if(self.trace) {
        console.log('EdcryptBrowserWorker::runWorker::self.cryptWorker=:<',self.cryptWorker,'>');
      }
    });
  }

  postMessage(data) {
    this.cryptWorker.postMessage(data);
  }
  loadKey() {
    try {
      const authKeyStr = localStorage.getItem(StoreKey.auth);
      this.authKey = JSON.parse(authKeyStr);
      if(this.trace) {
        console.log('EdcryptBrowserWorker::loadKey::this.authKey=:<',this.authKey,'>');
      }
      this.ee.emit('did.edcrypt.authKey',this.authKey);
      const recoveryKeyStr = localStorage.getItem(StoreKey.recovery);
      this.recoveryKey = JSON.parse(recoveryKeyStr);
      if(this.trace) {
        console.log('EdcryptBrowserWorker::loadKey::this.recoveryKey=:<',this.recoveryKey,'>');
      }
      this.ee.emit('did.edcrypt.recoveryKey',this.recoveryKey);
      const addressMsg = {
        auth:this.authKey.idOfKey,
        recovery:this.recoveryKey.idOfKey,
      };
      if(this.trace) {
        console.log('EdcryptBrowserWorker::loadKey::addressMsg=:<',addressMsg,'>');
      }
      this.otmc.emit('edcrypt:address',addressMsg);
      this.ee.emit('OtmcStateMachine.actor.send',{type:'edcrypt:address'});
    } catch(err) {
      console.error('EdcryptBrowserWorker::loadKey::err=:<',err,'>');
    }
  }
  onEdCryptMessage_(msg) {
    if(this.trace) {
      console.log('EdcryptBrowserWorker::onEdCryptMessage_::msg=:<',msg,'>');
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
  const browserName = () => {
    const agent = window.navigator.userAgent.toLowerCase();
    if(Otmc.trace) {
      console.log('::browserName::agent:=:<',agent,'>');
    }
    if (agent.indexOf('chrome') != -1) {
      return 'chrome';
    }
    if (agent.indexOf('safari') != -1) {
      return 'safari';
    }
    if (agent.indexOf('firefox') != -1) {
      return 'firefox';
    }
    return 'chrome'
  }

  const browser = browserName();
  if(Otmc.trace) {
    console.log('::getScriptPath::browser=:<',browser,'>');
  }
  const errorDummy = new Error();
  if(Otmc.trace) {
    console.log('::getScriptPath::errorDummy.stack.trim()=:<',errorDummy.stack.trim(),'>');
  }
  let sepStackLine = '\n    at ';
  let indexOfStack = 1;
  let replacePartern = 'getScriptPath (';
  if(browser === 'firefox') {
    sepStackLine = '\n';
    indexOfStack = 0;
    replacePartern = 'getScriptPath@';
  }
  let stackParams = errorDummy.stack.trim().split(sepStackLine);
  if(Otmc.trace) {
    console.log('::getScriptPath::stackParams=:<',stackParams,'>');
    console.log('::getScriptPath::stackParams.length=:<',stackParams.length,'>');
  }
  if(stackParams.length > indexOfStack + 1) {
    const fileStack = stackParams[indexOfStack];
    if(Otmc.trace) {
      console.log('::getScriptPath::fileStack=:<',fileStack,'>');
    }
    const fileLine = fileStack.replace(replacePartern,'').replace(')','');
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


/**
*
*/
class EdcryptWithNode {
  constructor(ee) {
    this.trace = true;
    this.debug = true;
    this.otmc = false;
    this.ee = ee;
    this.ListenEventEmitter_();
  }
  ListenEventEmitter_() {
    const self = this;
    this.ee.on('sys.env.config',(evt)=>{
      if(this.trace) {
        console.log('EdcryptWithNode::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.authKeyPath = evt.authKey;
      self.recoveryKeyPath = evt.recoveryKey;
      self.mqttJwt = evt.mqttJwt;
    });
    this.ee.on('edcrypt.loadKey',(evt)=>{
      if(this.trace) {
        console.log('EdcryptWithNode::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.loadKey();
    });
  }

  async loadKey() {
    const fs = await import('fs');
    if(this.trace) {
      console.log('EdcryptWithNode::loadKey::this=:<',this,'>');
    }
    try {
      const authKeyStr = fs.readFileSync(this.otmc.config.authKey);
      this.authKey = JSON.parse(authKeyStr);
      if(this.trace) {
        console.log('EdcryptWithNode::loadKey::this.authKey=:<',this.authKey,'>');
      }
      this.ee.emit('did.edcrypt.authKey',this.authKey);
      const recoveryKeyStr = fs.readFileSync(this.otmc.config.recoveryKey);
      this.recoveryKey = JSON.parse(recoveryKeyStr);
      if(this.trace) {
        console.log('EdcryptWithNode::loadKey::this.recoveryKey=:<',this.recoveryKey,'>');
      }
      this.ee.emit('did.edcrypt.recoveryKey',this.recoveryKey);
      const addressMsg = {
        auth:this.authKey.idOfKey,
        recovery:this.recoveryKey.idOfKey,
      };
      if(this.trace) {
        console.log('EdcryptWithNode::loadKey::addressMsg=:<',addressMsg,'>');
      }
      this.otmc.emit('edcrypt:address',addressMsg);
      this.ee.emit('OtmcStateMachine.actor.send',{type:'edcrypt:address'});
    } catch(err) {
      console.error('EdcryptWithNode::loadKey::err=:<',err,'>');
    }
  }
}

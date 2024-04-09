import { EventEmitter } from 'eventemitter3';
import { MqttMessager } from './otmc.mqtt.message.js';
import { DidDocument } from './otmc.did.document.js';
import { OtmcStateMachine } from './otmc.state.machine.js';
import { StoreKey } from './otmc.const.js';
import { default as mqtt } from 'mqtt';

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
      console.log('Otmc::constructor::this.scriptPath=:<',this.scriptPath,'>');
    }
    this.ee = {
      edcrypt:new EventEmitter(),
      mqtt : new EventEmitter(),
      did : new EventEmitter(),
      sm : new EventEmitter(),
    }
    if(this.trace) {
      console.log('Otmc::constructor::this.ee=:<',this.ee,'>');
    }
    const thisRefer = {otmc:this};
    this.edcrypt = new EdcryptWorker(thisRefer,this.ee);
    this.did = new DidDocument(this.ee);
    this.mqtt = new MqttMessager(thisRefer,this.ee);
    const self = this;
    setTimeout(() => {
      self.edcrypt.otmc = self;
      self.did.otmc = self;
      self.mqtt.otmc = self;
      self.sm = new OtmcStateMachine(thisRefer);
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
  
  syncDidDocument(){
    if(this.trace) {
      console.log('Otmc::syncDidDocument::new Date()=:<',new Date(),'>');
    }

    const uploadManifest = this.did.createSyncUploadManifest();
    if(this.trace) {
      console.log('Otmc::syncDidDocument::uploadManifest=:<',uploadManifest,'>');
    }
    if(uploadManifest) {
      this.mqtt.publish(uploadManifest.topic,uploadManifest,this.mqttOption);
    }    
    const uploadDoc = this.did.createSyncUploadDid();
    if(this.trace) {
      console.log('Otmc::syncDidDocument::uploadDoc=:<',uploadDoc,'>');
    }
    this.mqtt.publish(uploadDoc.topic,uploadDoc,this.mqttOption);


    const downloadManifest = this.did.createSyncDownloadManifest();
    if(this.trace) {
      console.log('Otmc::syncDidDocument::downloadManifest=:<',downloadManifest,'>');
    }
    if(downloadManifest) {
      this.mqtt.publish(downloadManifest.topic,downloadManifest,this.mqttOption);
    }
    
    const downloadDoc = this.did.createSyncDownloadDid();
    if(this.trace) {
      console.log('Otmc::syncDidDocument::downloadDoc=:<',downloadDoc,'>');
    }
    this.mqtt.publish(downloadDoc.topic,downloadDoc,this.mqttOption);

    const downloadInvitation = this.did.createSyncDownloadInvitation();
    if(this.trace) {
      console.log('Otmc::syncDidDocument::downloadInvitation=:<',downloadInvitation,'>');
    }
    if(downloadInvitation) {
      this.mqtt.publish(downloadInvitation.topic,downloadInvitation,this.mqttOption);
    }

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
class EdcryptWorker {
  constructor(parentRef,ee) {
    this.trace = true;
    this.debug = true;
    this.otmc = parentRef.otmc;
    this.ee = ee;
    this.cryptWorker = new Worker(`${this.otmc.scriptPath}/otmc.worker.edcrypt.js`);
    if(this.trace) {
      console.log('EdcryptWorker::constructor::this.cryptWorker=:<',this.cryptWorker,'>');
    }
    const self = this;
    this.cryptWorker.onmessage = (e) => {
      self.onEdCryptMessage_(e.data);
    }
    const initMsg = {
      init:{
        path:this.otmc.scriptPath,
      }
    };
    this.cryptWorker.postMessage(initMsg);
  }
  postMessage(data) {
    this.cryptWorker.postMessage(data);
  }
  loadKey() {
    try {
      const authKeyStr = localStorage.getItem(StoreKey.auth);
      this.authKey = JSON.parse(authKeyStr);
      this.ee.did.emit('edcrypt:authKey',this.authKey);
      const recoveryKeyStr = localStorage.getItem(StoreKey.recovery);
      this.recoveryKey = JSON.parse(recoveryKeyStr);
      this.ee.did.emit('edcrypt:recoveryKey',this.recoveryKey);
      const addressMsg = {
        auth:this.authKey.idOfKey,
        recovery:this.recoveryKey.idOfKey,
      };
      if(this.trace) {
        console.log('EdcryptWorker::loadKey::addressMsg=:<',addressMsg,'>');
      }
      this.otmc.emit('edcrypt:address',addressMsg);
      this.otmc.sm.actor.send({type:'edcrypt:address'});
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

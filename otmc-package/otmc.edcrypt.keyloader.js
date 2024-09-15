import * as Level from 'level';
import { StoreKey } from './otmc.const.js';

class OtmcEdcrypt {
  static trace = false;
  static debug = true;
  constructor() {
    
  }
}
const LEVEL_OPT = {
  keyEncoding: 'utf8',
  valueEncoding: 'utf8',
};

/**
*
*/
export class EdcryptKeyLoaderBrowser {
  constructor(ee) {
    this.trace = true;
    this.debug = true;
    this.otmc = false;
    this.ee = ee;
    this.scriptPath = getScriptPath();
    if(this.trace) {
      console.log('EdcryptKeyLoaderBrowser::constructor::this.scriptPath=:<',this.scriptPath,'>');
    }
    this.ListenEventEmitter_();
  }
  ListenEventEmitter_() {

    const self = this;
    this.ee.on('edCryptKey.loader.runWorker',(evt)=>{
      if(this.trace) {
        console.log('EdcryptKeyLoaderBrowser::ListenEventEmitter_::evt=:<',evt,'>');
      }
      if(this.trace) {
        console.log('EdcryptKeyLoaderBrowser::ListenEventEmitter_::this.otmc=:<',this.otmc,'>');
      }
      if(this.otmc.isNode) {
        this.didKeyStore = new Level.Level(this.otmc.config.didKeys,LEVEL_OPT);
      } else {
        this.didKeyStore = new Level.Level(StoreKey.secret.authKey,LEVEL_OPT);
      }
      if(this.trace) {
        console.log('EdcryptKeyLoaderBrowser::ListenEventEmitter_::this.didKeyStore=:<',this.didKeyStore,'>');
      }

      self.runWorker();
    });
    this.ee.on('edCryptKey.loader.loadKey',(evt)=>{
      if(this.trace) {
        console.log('EdcryptKeyLoaderBrowser::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.loadKey();
    });
    this.ee.on('edCryptKey.loader.switchKey',(evt)=>{
      if(this.trace) {
        console.log('EdcryptKeyLoaderBrowser::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.switchKey(evt.keyId);
    });
    this.ee.on('edCryptKey.loader.mining',(evt)=>{
      if(this.trace) {
        console.log('EdcryptKeyLoaderBrowser::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.postMessage(evt);
    });
  }

  runWorker() {
    const self = this;
    fetch(`${this.scriptPath}/otmc.edcrypt.keyloader.worker.js`)
    .then((response) => response.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      if(self.trace) {
        console.log('EdcryptKeyLoaderBrowser::runWorker::url=:<',url,'>');
      }
      self.cryptWorker = new Worker(url);
      if(self.trace) {
        console.log('EdcryptKeyLoaderBrowser::runWorker::self.cryptWorker=:<',self.cryptWorker,'>');
      }
      self.cryptWorker.onmessage = (e) => {
        self.onEdCryptMessage_(e.data);
      }
      self.cryptWorker.onerror = (err) => {
        console.log('EdcryptKeyLoaderBrowser::runWorker::err=:<',err,'>');
      }
      const initMsg = {
        init:{
          path:self.scriptPath,
        }
      };    
      self.cryptWorker.postMessage(initMsg);
      if(self.trace) {
        console.log('EdcryptKeyLoaderBrowser::runWorker::self.cryptWorker=:<',self.cryptWorker,'>');
      }
    });
  }

  postMessage(data) {
    this.cryptWorker.postMessage(data);
  }
  async loadKey() {
    try {
      const didKeyListStr = await this.didKeyStore.get(StoreKey.didKeyList);
      if(this.trace) {
        console.log('EdcryptKeyLoaderBrowser::loadKey::didKeyListStr=:<',didKeyListStr,'>');
      }
      if(didKeyListStr) {
        const didKeyList = JSON.parse(didKeyListStr);
        this.otmc.emit('edcrypt:didKeyList',didKeyList);
      } else {
        this.otmc.emit('edcrypt:didKeyList',[]);
      }
    } catch(errDidKey) {
      if(this.trace) {
        console.error('EdcryptKeyLoaderBrowser::loadKey::errDidKey.message=:<',errDidKey.message,'>');
      }
      if(errDidKey.message === 'Entry not found') {
        this.otmc.emit('edcrypt:didKeyList',[]);
      } else {
        console.error('EdcryptKeyLoaderBrowser::loadKey::errDidKey=:<',errDidKey,'>');
      }
    }
  }
  async switchKey(keyId) {
    try {
      const didKeyListStr = await this.didKeyStore.get(StoreKey.didKeyList);
      if(this.trace) {
        console.log('EdcryptKeyLoaderBrowser::switchKey::didKeyListStr=:<',didKeyListStr,'>');
      }
      if(didKeyListStr) {
        const didKeyList = JSON.parse(didKeyListStr);
        if(this.trace) {
          console.log('EdcryptKeyLoaderBrowser::switchKey::didKeyList=:<',didKeyList,'>');
        }
        for(const didKey of didKeyList) {
          if(didKey.auth.idOfKey === keyId) {
            console.log('EdcryptKeyLoaderBrowser::switchKey::didKey=:<',didKey,'>');
            this.authKey = didKey.auth;
            this.recoveryKey = didKey.recovery;
            const addressMsg = {
              auth:this.authKey.idOfKey,
              recovery:this.recoveryKey.idOfKey,
            };
            if(this.trace) {
              console.log('EdcryptKeyLoaderBrowser::switchKey::addressMsg=:<',addressMsg,'>');
            }
            this.ee.emit('did.edcrypt.authKey',this.authKey);
            this.ee.emit('did.edcrypt.recoveryKey',this.recoveryKey);
            this.otmc.emit('edcrypt:address',addressMsg);
            this.ee.emit('OtmcStateMachine.actor.send',{type:'edcrypt:address'});
            break;
          }
        }
      } else {
      }
    } catch(errDidKey) {
      if(this.trace) {
        console.error('EdcryptKeyLoaderBrowser::switchKey::errDidKey.message=:<',errDidKey.message,'>');
      }
      if(errDidKey.message === 'Entry not found') {
      } else {
        console.error('EdcryptKeyLoaderBrowser::switchKey::errDidKey=:<',errDidKey,'>');
      }
    }
  }


  async onEdCryptMessage_(msg) {
    if(this.trace) {
      console.log('EdcryptKeyLoaderBrowser::onEdCryptMessage_::msg=:<',msg,'>');
    }
    if(msg.ready) {
      this.ee.emit('edCryptKey.loader.loadKey',{});
    }
    if(msg.auth && msg.recovery) {
      let didKeyList = [];
      try {
        const didKeyListStr = await this.didKeyStore.get(StoreKey.didKeyList);
        if(this.trace) {
          console.log('EdcryptKeyLoaderBrowser::loadKey::didKeyListStr=:<',didKeyListStr,'>');
        }
        if(didKeyListStr) {
          didKeyList = JSON.parse(didKeyListStr);
        }
      } catch(errDidKey) {
        if(this.trace) {
          console.error('EdcryptKeyLoaderBrowser::loadKey::errDidKey.message=:<',errDidKey.message,'>');
        }
      }
      if(this.trace) {
        console.log('EdcryptKeyLoaderBrowser::loadKey::didKeyList=:<',didKeyList,'>');
      }
      didKeyList.push(msg);
      if(this.trace) {
        console.log('EdcryptKeyLoaderBrowser::loadKey::didKeyList=:<',didKeyList,'>');
      }
      const result = await this.didKeyStore.put(StoreKey.didKeyList,JSON.stringify(didKeyList));
      this.otmc.emit('edcrypt:didKeyList',didKeyList);
    }
    if(msg.mining) {
      this.otmc.emit('edcrypt:mining',msg.mining);
    }
  }
}

const getScriptPath = () => {
  const browserName = () => {
    const agent = window.navigator.userAgent.toLowerCase();
    if(OtmcEdcrypt.trace) {
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
  if(OtmcEdcrypt.trace) {
    console.log('::getScriptPath::browser=:<',browser,'>');
  }
  const errorDummy = new Error();
  if(OtmcEdcrypt.trace) {
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
  if(OtmcEdcrypt.trace) {
    console.log('::getScriptPath::stackParams=:<',stackParams,'>');
    console.log('::getScriptPath::stackParams.length=:<',stackParams.length,'>');
  }
  if(stackParams.length > indexOfStack + 1) {
    const fileStack = stackParams[indexOfStack];
    if(OtmcEdcrypt.trace) {
      console.log('::getScriptPath::fileStack=:<',fileStack,'>');
    }
    const fileLine = fileStack.replace(replacePartern,'').replace(')','');
    if(OtmcEdcrypt.trace) {
      console.log('::getScriptPath::fileLine=:<',fileLine,'>');
    }
    const fileLineParams = fileLine.split('/');
    if(OtmcEdcrypt.trace) {
      console.log('::getScriptPath::fileLineParams=:<',fileLineParams,'>');
    }
    const scriptPath = fileLineParams.slice(0,fileLineParams.length -1).join('/');
    if(OtmcEdcrypt.trace) {
      console.log('::getScriptPath::scriptPath=:<',scriptPath,'>');
    }
    return scriptPath;
  }
  return '';
}


/**
*
*/
export class EdcryptKeyLoaderNode {
  constructor(ee) {
    this.trace0 = false;
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
        console.log('EdcryptKeyLoaderNode::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.authKeyPath = evt.authKey;
      self.recoveryKeyPath = evt.recoveryKey;
      self.mqttJwt = evt.mqttJwt;
    });
    this.ee.on('edCryptKey.loader.loadKey',(evt)=>{
      if(this.trace) {
        console.log('EdcryptKeyLoaderNode::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.loadKey();
    });
  }

  async loadKey() {
    const fs = await import('fs');
    if(this.trace0) {
      console.log('EdcryptKeyLoaderNode::loadKey::this=:<',this,'>');
    }
    try {
      const authKeyStr = fs.readFileSync(this.otmc.config.authKey);
      this.authKey = JSON.parse(authKeyStr);
      if(this.trace) {
        console.log('EdcryptKeyLoaderNode::loadKey::this.authKey=:<',this.authKey,'>');
      }
      this.ee.emit('did.edcrypt.authKey',this.authKey);
      const recoveryKeyStr = fs.readFileSync(this.otmc.config.recoveryKey);
      this.recoveryKey = JSON.parse(recoveryKeyStr);
      if(this.trace) {
        console.log('EdcryptKeyLoaderNode::loadKey::this.recoveryKey=:<',this.recoveryKey,'>');
      }
      this.ee.emit('did.edcrypt.recoveryKey',this.recoveryKey);
      const addressMsg = {
        auth:this.authKey.idOfKey,
        recovery:this.recoveryKey.idOfKey,
      };
      if(this.trace) {
        console.log('EdcryptKeyLoaderNode::loadKey::addressMsg=:<',addressMsg,'>');
      }
      this.otmc.emit('edcrypt:address',addressMsg);
      this.ee.emit('OtmcStateMachine.actor.send',{type:'edcrypt:address'});
    } catch(err) {
      console.error('EdcryptKeyLoaderNode::loadKey::err=:<',err,'>');
    }
  }
}

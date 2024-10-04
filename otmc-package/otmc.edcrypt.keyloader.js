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
  constructor(eeInternal,eeOut) {
    this.trace = true;
    this.debug = true;
    this.otmc = false;
    this.eeInternal = eeInternal;
    this.eeOut = eeOut;
    this.ListenEventEmitter_();
  }
  ListenEventEmitter_() {

    const self = this;
    this.eeInternal.on('webwoker.crypt.worker',(evt)=>{
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
      self.runWorker(evt.worker);
    });
    this.eeInternal.on('edCryptKey.loader.loadKey',(evt)=>{
      if(this.trace) {
        console.log('EdcryptKeyLoaderBrowser::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.loadKey();
    });
    this.eeInternal.on('edCryptKey.loader.switchKey',(evt)=>{
      if(this.trace) {
        console.log('EdcryptKeyLoaderBrowser::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.switchKey(evt.keyId);
    });
    this.eeInternal.on('edCryptKey.loader.mining',(evt)=>{
      if(this.trace) {
        console.log('EdcryptKeyLoaderBrowser::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.postMessage(evt);
    });
  }

  runWorker(worker) {
    this.cryptWorker = worker;
    if(this.trace) {
      console.log('EdcryptKeyLoaderBrowser::runWorker::this.cryptWorker=:<',this.cryptWorker,'>');
    }
    this.cryptWorker.onerror = (err) => {
      console.log('EdcryptKeyLoaderBrowser::runWorker::err=:<',err,'>');
    }
    const self = this;
    this.cryptWorker.onmessage = (e) => {
      self.onEdCryptMessage_(e.data);
    }
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
        this.eeOut.emit('edcrypt:didKeyList',didKeyList);
      } else {
        this.eeOut.emit('edcrypt:didKeyList',[]);
      }
    } catch(errDidKey) {
      if(this.trace) {
        console.error('EdcryptKeyLoaderBrowser::loadKey::errDidKey.message=:<',errDidKey.message,'>');
      }
      if(errDidKey.message === 'Entry not found') {
        this.eeOut.emit('edcrypt:didKeyList',[]);
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
            this.eeInternal.emit('did.edcrypt.authKey',this.authKey);
            this.eeInternal.emit('did.edcrypt.recoveryKey',this.recoveryKey);
            this.eeOut.emit('edcrypt:address',addressMsg);
            this.eeInternal.emit('OtmcStateMachine.actor.send',{type:'edcrypt:address'});
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
      this.eeInternal.emit('edCryptKey.loader.loadKey',{});
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
      this.eeOut.emit('edcrypt:didKeyList',didKeyList);
    }
    if(msg.mining) {
      this.eeOut.emit('edcrypt:mining',msg.mining);
    }
  }
}

/**
*
*/
export class EdcryptKeyLoaderNode {
  constructor(eeInternal,eeOut) {
    this.trace0 = false;
    this.trace = true;
    this.debug = true;
    this.otmc = false;
    this.eeInternal = eeInternal;
    this.eeOut = eeOut;
    this.ListenEventEmitter_();
  }
  ListenEventEmitter_() {
    const self = this;
    this.eeInternal.on('sys.env.config',(evt)=>{
      if(this.trace) {
        console.log('EdcryptKeyLoaderNode::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.authKeyPath = evt.authKey;
      self.recoveryKeyPath = evt.recoveryKey;
      self.mqttJwt = evt.mqttJwt;
    });
    this.eeInternal.on('edCryptKey.loader.loadKey',(evt)=>{
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
      this.eeInternal.emit('did.edcrypt.authKey',this.authKey);
      const recoveryKeyStr = fs.readFileSync(this.otmc.config.recoveryKey);
      this.recoveryKey = JSON.parse(recoveryKeyStr);
      if(this.trace) {
        console.log('EdcryptKeyLoaderNode::loadKey::this.recoveryKey=:<',this.recoveryKey,'>');
      }
      this.eeInternal.emit('did.edcrypt.recoveryKey',this.recoveryKey);
      const addressMsg = {
        auth:this.authKey.idOfKey,
        recovery:this.recoveryKey.idOfKey,
      };
      if(this.trace) {
        console.log('EdcryptKeyLoaderNode::loadKey::addressMsg=:<',addressMsg,'>');
      }
      this.otmc.emit('edcrypt:address',addressMsg);
      this.eeInternal.emit('OtmcStateMachine.actor.send',{type:'edcrypt:address'});
    } catch(err) {
      console.error('EdcryptKeyLoaderNode::loadKey::err=:<',err,'>');
    }
  }
}

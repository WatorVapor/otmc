import { base16, base32, base64, base58 } from '@scure/base';
import Dexie from 'dexie';
import { StoreKey } from './otmc.const.js';
import { StoreNodeWrapper } from './otmc.store.node.wrapper.js';
const isNode = typeof global !== 'undefined' && typeof window === 'undefined';

class OtmcEdcrypt {
  static trace = false;
  static debug = true;
  constructor() {
  }
}


/**
*
*/
export class EdcryptKeyLoader {
  constructor(eeInternal,eeOut) {
    this.version = '1.0';
    this.trace = true;
    this.debug = true;
    this.eeInternal = eeInternal;
    this.eeOut = eeOut;
    this.ListenEventEmitter_();
    if(this.trace) {
      console.log('EdcryptKeyLoader::constructor::base58=:<',base58,'>');
    }
  }
  ListenEventEmitter_() {
    const self = this;
    this.eeInternal.on('webwoker.crypt.worker',(evt)=>{
      if(self.trace) {
        console.log('EdcryptKeyLoader::ListenEventEmitter_::evt=:<',evt,'>');
      }
      if(isNode) {
        StoreNodeWrapper.addIndexedDBDependencies(Dexie);
      }
      self.tryOpenDB_();
      if(isNode) {
        self.wrapper = new StoreNodeWrapper(self.db);
        self.wrapper.importData();
      }
      self.runWorker(evt.worker);
    });
    this.eeInternal.on('edCryptKey.loader.loadKey',(evt)=>{
      if(self.trace) {
        console.log('EdcryptKeyLoader::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.loadKey();
    });
    this.eeInternal.on('edCryptKey.loader.switchKey',(evt)=>{
      if(self.trace) {
        console.log('EdcryptKeyLoader::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.switchKey(evt.keyId);
    });
    this.eeInternal.on('edCryptKey.loader.mining',(evt)=>{
      if(self.trace) {
        console.log('EdcryptKeyLoader::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.postMessage(evt);
    });
  }

  runWorker(worker) {
    this.cryptWorker = worker;
    if(this.trace) {
      console.log('EdcryptKeyLoader::runWorker::this.cryptWorker=:<',this.cryptWorker,'>');
    }
    this.cryptWorker.onerror = (err) => {
      console.log('EdcryptKeyLoader::runWorker::err=:<',err,'>');
    }
    const self = this;
    if(isNode) {
      this.cryptWorker.on('message', (msg) => {
        self.onEdCryptMessage_(msg);
      });
    } else {
      this.cryptWorker.onmessage = (e) => {
        self.onEdCryptMessage_(e.data);
      }  
    }
  }

  postMessage(data) {
    this.cryptWorker.postMessage(data);
  }
  async loadKey() {
    if(this.trace) {
      console.log('EdcryptKeyLoader::loadKey::this.db=:<',this.db,'>');
      console.log('EdcryptKeyLoader::loadKey::this.db.edKey=:<',this.db.edKey,'>');
    }
    const edKeys = await this.db.edKey.toArray();
    if(this.trace) {
      console.log('EdcryptKeyLoader::loadKey::edKeys=:<',edKeys,'>');
    }
    this.eeOut.emit('edcrypt:didKeyList',edKeys);
  }
  async switchKey(keyId) {
    try {
      const edKeys = await this.db.edKey.toArray();
      if(this.trace) {
        console.log('EdcryptKeyLoader::switchKey::edKeys=:<',edKeys,'>');
      }
      for(const didKey of edKeys) {
        if(didKey.auth.idOfKey === keyId) {
          console.log('EdcryptKeyLoader::switchKey::didKey=:<',didKey,'>');
          this.authKey = didKey.auth;
          this.recoveryKey = didKey.recovery;
          const addressMsg = {
            auth:this.authKey.idOfKey,
            recovery:this.recoveryKey.idOfKey,
          };
          if(this.trace) {
            console.log('EdcryptKeyLoader::switchKey::addressMsg=:<',addressMsg,'>');
          }
          this.eeInternal.emit('did.edcrypt.authKey',this.authKey);
          this.eeInternal.emit('did.edcrypt.recoveryKey',this.recoveryKey);
          this.eeOut.emit('edcrypt:address',addressMsg);
          this.eeInternal.emit('OtmcStateMachine.actor.send',{type:'edcrypt:address'});
          break;
        }
      }
    } catch(errDidKey) {
      if(this.trace) {
        console.error('EdcryptKeyLoader::switchKey::errDidKey.message=:<',errDidKey.message,'>');
      }
      if(errDidKey.message === 'Entry not found') {
      } else {
        console.error('EdcryptKeyLoader::switchKey::errDidKey=:<',errDidKey,'>');
      }
    }
  }


  async onEdCryptMessage_(msg) {
    if(this.trace) {
      console.log('EdcryptKeyLoader::onEdCryptMessage_::msg=:<',msg,'>');
    }
    if(msg.ready) {
      this.eeInternal.emit('edCryptKey.loader.loadKey',msg);
    }
    if(msg.auth && msg.recovery) {
      const resultStore = await this.db.edKey.add(msg);
      if(this.trace) {
        console.log('EdcryptKeyLoader::onEdCryptMessage_::resultStore=:<',resultStore,'>');
      }
      const edKeys = await this.db.edKey.toArray();
      if(this.trace) {
        console.log('EdcryptKeyLoader::onEdCryptMessage_::edKeys=:<',edKeys,'>');
      }
      this.eeOut.emit('edcrypt:didKeyList',edKeys);
    }
    if(msg.mining) {
      this.eeOut.emit('edcrypt:mining',msg.mining);
    }
  }
  tryOpenDB_() {
    this.db = new Dexie(StoreKey.secret.authKey.dbName);
    this.db.version(this.version).stores({
      edKey: '++autoId,authKey,recoveryKey'
    });
    if(this.trace) {
      console.log('EdcryptKeyLoader::tryOpenDB_::this.db=:<',this.db,'>');
    }
  }
}


import { base16, base32, base64, base58 } from '@scure/base';
import { indexedDB, IDBKeyRange } from 'fake-indexeddb';
import fs from 'fs';
import path from 'path';
import Dexie from 'dexie';
import { StoreKey } from './otmc.const.js';
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
        self.addIndexedDBDependenciesInNode_();
      }
      self.tryOpenDB_();
      if(isNode) {
        self.importDataInNode_();
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
  addIndexedDBDependenciesInNode_() {
    Dexie.dependencies.indexedDB = indexedDB;
    Dexie.dependencies.IDBKeyRange = IDBKeyRange;
  }
  async importDataInNode_() {
    if(this.trace) {
      console.log('EdcryptKeyLoader::importDataInNode_::this.db.name=:<',this.db.name,'>');
    }
    const data = await this.loadDataFromStorage_();
    if(this.trace) {
      console.log('EdcryptKeyLoader::importDataInNode_::data=:<',data,'>');
      console.log('EdcryptKeyLoader::importDataInNode_::this.db=:<',this.db,'>');
    }
    await this.db.transaction('rw', this.db.tables, async () => {
      for (const [tableName, records] of Object.entries(data.tables)) {
        await this.db[tableName].clear();
        await this.db[tableName].bulkAdd(records);
      }
    });
  }
  async loadDataFromStorage_() {
    const rootDir = '/opt/otmc';
    try {
      const dataFilename = `${rootDir}/${this.db.name}.json`;
      if(this.trace) {
        console.log('EdcryptKeyLoader::loadDataFromStorage_::dataFilename=:<',dataFilename,'>');
      }
      const dataRaw = fs.readFileSync(dataFilename, 'utf8');
      const data = JSON.parse(dataRaw);
      if(this.trace) {
        console.log('EdcryptKeyLoader::loadDataFromStorage_::data=:<',data,'>');
      }
      return data;
    }
    catch(err) {
      if(this.trace) {
        console.log('EdcryptKeyLoader::loadDataFromStorage_::err=:<',err,'>');
      }
      const emptyData = await this.exportData();
      if(this.trace) {
        console.log('EdcryptKeyLoader::loadDataFromStorage_::emptyData=:<',emptyData,'>');
      }
      const dataFileName = `${rootDir}/${this.db.name}.json`;
      const dataFilePath = path.dirname(dataFileName);
      if(this.trace) {
        console.log('EdcryptKeyLoader::loadDataFromStorage_::dataFilePath=:<',dataFilePath,'>');
      }
      fs.mkdirSync(dataFilePath, { recursive: true });
      fs.writeFileSync(dataFileName, JSON.stringify(emptyData, null, 2), 'utf8');
      return emptyData;
    }
    return {};
  }
  async exportData() {
    const tables = {};
    const tableNames = this.db.tables.map(table => table.name);
    
    for (const tableName of tableNames) {
      tables[tableName] = await this.db[tableName].toArray();
    }
    const ret = {
      dbName: this.db.name,
      exportedAt: new Date().toISOString(),
      tables
    };
    if(this.trace) {
      console.log('EdcryptKeyLoader::exportData::ret=:<',ret,'>');
    }
    return ret;
  }
}


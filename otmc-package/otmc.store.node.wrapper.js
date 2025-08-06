import { indexedDB, IDBKeyRange } from 'fake-indexeddb';
import fs from 'fs';
import path from 'path';
const isNode = typeof global !== 'undefined' && typeof window === 'undefined';

/**
*
*/
export class StoreNodeWrapper {
  constructor(db,config) {
    this.trace = true;
    this.debug = true;
    if(config && config.store) {
      this.rootDir = `${config.store}/dexie_indexed_db`;
    } else {
      this.rootDir = `/opt/otmc/dexie_indexed_db`;
    }
    this.db = db;
    if(this.trace) {
      console.log('StoreNodeWrapper::constructor::this.db.name=:<',this.db.name,'>');
      console.log('StoreNodeWrapper::constructor::config=:<',config,'>');
      console.log('StoreNodeWrapper::constructor::this.rootDir=:<',this.rootDir,'>');
    }
  }

  static addIndexedDBDependencies(dexie) {
    dexie.dependencies.indexedDB = indexedDB;
    dexie.dependencies.IDBKeyRange = IDBKeyRange;
  }
  async importData() {
    if(this.trace) {
      console.log('StoreNodeWrapper::importData::this.db.name=:<',this.db.name,'>');
    }
    const data = await this.loadDataFromStorage_();
    if(this.trace) {
      console.log('StoreNodeWrapper::importData::data=:<',data,'>');
      console.log('StoreNodeWrapper::importData::this.db=:<',this.db,'>');
    }
    await this.db.transaction('rw', this.db.tables, async () => {
      for (const [tableName, records] of Object.entries(data.tables)) {
        if(this.trace) {
          console.log('StoreNodeWrapper::importData::tableName=:<',tableName,'>');
        }
        if(this.debug) {
          console.log('StoreNodeWrapper::importData::records=:<',records,'>');
        }
        if(!this.db[tableName]) {
          if(this.debug) {
            console.log('StoreNodeWrapper::importData::this.db=:<',this.db,'>');
          }
        }
        await this.db[tableName].clear();
        await this.db[tableName].bulkAdd(records);
      }
    });
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
      console.log('StoreNodeWrapper::exportData::ret=:<',ret,'>');
    }
    this.saveDataToStorage_(ret);
    return ret;
  }

  async loadDataFromStorage_() {
    try {
      const dataFilename = `${this.rootDir}/${this.db.name}.json`;
      if(this.trace) {
        console.log('StoreNodeWrapper::loadDataFromStorage_::dataFilename=:<',dataFilename,'>');
      }
      const dataRaw = fs.readFileSync(dataFilename, 'utf8');
      const data = JSON.parse(dataRaw);
      if(this.trace) {
        console.log('StoreNodeWrapper::loadDataFromStorage_::data=:<',data,'>');
      }
      return data;
    }
    catch(err) {
      if(this.trace) {
        console.log('StoreNodeWrapper::loadDataFromStorage_::err=:<',err,'>');
      }
      const emptyData = await this.exportData();
      if(this.trace) {
        console.log('StoreNodeWrapper::loadDataFromStorage_::emptyData=:<',emptyData,'>');
      }
      this.saveDataToStorage_(emptyData);
      return emptyData;
    }
  }
  saveDataToStorage_(data) {
    const dataFileName = `${this.rootDir}/${this.db.name}.json`;
    const dataFilePath = path.dirname(dataFileName);
    if(this.trace) {
      console.log('StoreNodeWrapper::loadDataFromStorage_::dataFilePath=:<',dataFilePath,'>');
    }
    fs.mkdirSync(dataFilePath, { recursive: true });
    fs.writeFileSync(dataFileName, JSON.stringify(data, null, 2), 'utf8');
  }

}


import * as Level from 'level';
import * as jsDiff from 'json-diff';


const LEVEL_OPT = {
  keyEncoding: 'utf8',
  valueEncoding: 'utf8',
};

/**
*
*/
export class DidStore {
  constructor(dbName) {
    this.trace0 = true;
    this.trace1 = false;
    this.trace2 = false;
    this.trace = true;;
    this.debug = true;
    this.store = new Level.Level(dbName,LEVEL_OPT);
  }
  put(key,value,option,cb) {
    this.store.put(key,value,option,cb);
  }
  async getTop(address) {
    const storeKeyPrefix = `did:otmc:${address}.`;
    if(this.trace) {
      console.log('DidStore::getTop::storeKeyPrefix=:<',storeKeyPrefix,'>');
    }
    const storeKeys = await this.store.keys(LEVEL_OPT).all();
    if(this.trace) {
      console.log('DidStore::getTop::storeKeys=:<',storeKeys,'>');
    }
    const myDidKeys = [];
    for(const storeKey of storeKeys) {
      if(storeKey.startsWith(storeKeyPrefix)) {
        myDidKeys.push(storeKey); 
      }
    }
    if(this.trace) {
      console.log('DidStore::getTop::myDidKeys=:<',myDidKeys,'>');
    }
    const didValues = await this.store.getMany(myDidKeys,LEVEL_OPT);
    if(this.trace) {
      console.log('DidStore::getTop::didValues=:<',didValues,'>');
    }
    const didValuesJson = [];
    for(const didValue of didValues) {
      const didValueJson = JSON.parse(didValue);
      didValuesJson.push(didValueJson);
    }
    if(this.trace) {
      console.log('DidStore::getTop::didValuesJson=:<',didValuesJson,'>');
    }
    const sorted = didValuesJson.sort( this.compare_ );
    if(this.trace) {
      console.log('DidStore::getTop::sorted=:<',sorted,'>');
    }
    if(sorted.length > 0) {
      return sorted[0];
    } else {
      return null;
    }
  }
  async getAll(address) {
    const storeKeyPrefix = `did:otmc:${address}.`;
    if(this.trace) {
      console.log('DidStore::getTop::storeKeyPrefix=:<',storeKeyPrefix,'>');
    }
    const storeKeys = await this.store.keys(LEVEL_OPT).all();
    if(this.trace) {
      console.log('DidStore::getTop::storeKeys=:<',storeKeys,'>');
    }
    const myDidKeys = [];
    for(const storeKey of storeKeys) {
      if(storeKey.startsWith(storeKeyPrefix)) {
        myDidKeys.push(storeKey); 
      }
    }
    if(this.trace) {
      console.log('DidStore::getTop::myDidKeys=:<',myDidKeys,'>');
    }
    const didValues = await this.store.getMany(myDidKeys,LEVEL_OPT);
    if(this.trace) {
      console.log('DidStore::getTop::didValues=:<',didValues,'>');
    }
    const didValuesJson = [];
    for(const didValue of didValues) {
      const didValueJson = JSON.parse(didValue);
      didValuesJson.push(didValueJson);
    }
    if(this.trace) {
      console.log('DidStore::getTop::didValuesJson=:<',didValuesJson,'>');
    }
    return didValuesJson;
  }
  
  compare_(a,b) {
    if ( a.updated < b.updated ){
      return -1;
    }
    if ( a.updated > b.updated ){
      return 1;
    }
    return 0;
  }

}
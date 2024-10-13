import * as Level from 'level';
import * as jsDiff from 'json-diff';
import Dexie from 'dexie';
import { StoreKey } from './otmc.const.js';


const LEVEL_OPT = {
  keyEncoding: 'utf8',
  valueEncoding: 'utf8',
};

const LEVEL_OPT2 = {
  prefix:'',
  keyEncoding: 'utf8',
  valueEncoding: 'utf8',
};

/**
*
*/
export class DidStoreDocument {
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
    const didValuesJson = await this.getAll(address);
    if(this.trace) {
      console.log('DidStoreDocument::getTop::didValuesJson=:<',didValuesJson,'>');
    }
    
    const sorted = didValuesJson.sort( this.compare_ );
    if(this.trace) {
      console.log('DidStoreDocument::getTop::sorted=:<',sorted,'>');
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
      console.log('DidStoreDocument::getAll::storeKeyPrefix=:<',storeKeyPrefix,'>');
    }
    const storeKeys = await this.store.keys(LEVEL_OPT).all();
    if(this.trace) {
      console.log('DidStoreDocument::getAll::storeKeys=:<',storeKeys,'>');
    }
    const storeValuesJson = [];
    for(const storeKey of storeKeys) {
      const storeValueStr = await this.store.get(storeKey,LEVEL_OPT);
      if(this.trace) {
        console.log('DidStoreDocument::getAll::storeValueStr=:<',storeValueStr,'>');
      }
      const storeValue = JSON.parse(storeValueStr);
      if(this.trace) {
        console.log('DidStoreDocument::getAll::storeValue=:<',storeValue,'>');
      }
      const isMine = this.isAddressUsedDid_(storeValue,address);
      if(this.trace) {
        console.log('DidStoreDocument::getAll::isMine=:<',isMine,'>');
      }
      if(isMine) {
        storeValuesJson.push(storeValue);
      }
    }
    if(this.trace) {
      console.log('DidStoreDocument::getAll::storeValuesJson=:<',storeValuesJson,'>');
    }
    return storeValuesJson;
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
  
  isAddressUsedDid_(didDoc,address) {
    if(this.trace) {
      console.log('DidStoreDocument::isAddressUsedDid_::didDoc=:<',didDoc,'>');
      console.log('DidStoreDocument::isAddressUsedDid_::address=:<',address,'>');
    }
    const addressSuffix = `#${address}`;
    if(this.trace) {
      console.log('DidStoreDocument::isAddressUsedDid_::addressSuffix=:<',addressSuffix,'>');
    }
    for(const auth of didDoc.authentication) {
      if(this.trace) {
        console.log('DidStoreDocument::isAddressUsedDid_::auth=:<',auth,'>');
      }
      if(auth.endsWith(addressSuffix)) {
        return true;
      }
    }
    return false;
  }
}

/**
*
*/
export class DidStoreManifest {
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
  async getTop(didAddress) {
    const didValuesJson = await this.getAll(didAddress);
    if(this.trace) {
      console.log('DidStoreManifest::getTop::didValuesJson=:<',didValuesJson,'>');
    }
    
    const sorted = didValuesJson.sort( this.compare_ );
    if(this.trace) {
      console.log('DidStoreManifest::getTop::sorted=:<',sorted,'>');
    }
    if(sorted.length > 0) {
      return sorted[0];
    } else {
      return null;
    }
  }
  async getAll(didAddress) {
    const storeKeyPrefix = `${didAddress}.`;
    if(this.trace) {
      console.log('DidStoreManifest::getAll::storeKeyPrefix=:<',storeKeyPrefix,'>');
    }
    const storeKeys = await this.store.keys(LEVEL_OPT).all();
    if(this.trace) {
      console.log('DidStoreManifest::getAll::storeKeys=:<',storeKeys,'>');
    }
    const didMyKeyJson = [];
    for(const storeKey of storeKeys) {
      if(this.trace) {
        console.log('DidStoreManifest::getAll::storeKey=:<',storeKey,'>');
      }
      if(storeKey.startsWith(storeKeyPrefix)) {
        didMyKeyJson.push(storeKey);
      }
    }
    if(this.trace) {
      console.log('DidStoreManifest::getAll::didMyKeyJson=:<',didMyKeyJson,'>');
    }
    const storeValuesStr = await this.store.getMany(didMyKeyJson,LEVEL_OPT);
    if(this.trace) {
      console.log('DidStoreManifest::getAll::storeValuesStr=:<',storeValuesStr,'>');
    }
    const storeValuesJson = [];
    for(const storeValueStr of storeValuesStr) {
      const storeValue = JSON.parse(storeValueStr);
      if(this.trace) {
        console.log('DidStoreManifest::getAll::storeValue=:<',storeValue,'>');
      }
      storeValuesJson.push(storeValue);
    }
    if(this.trace) {
      console.log('DidStoreManifest::getAll::storeValuesJson=:<',storeValuesJson,'>');
    }
    return storeValuesJson;
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

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
    const didValuesJson = await this.getAll(address);
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
      console.log('DidStore::getAll::storeKeyPrefix=:<',storeKeyPrefix,'>');
    }
    const storeKeys = await this.store.keys(LEVEL_OPT).all();
    if(this.trace) {
      console.log('DidStore::getAll::storeKeys=:<',storeKeys,'>');
    }
    const didValuesJson = [];
    for(const storeKey of storeKeys) {
      const storeValueStr = await this.store.get(storeKey,LEVEL_OPT);
      if(this.trace) {
        console.log('DidStore::getAll::storeValueStr=:<',storeValueStr,'>');
      }
      const storeValue = JSON.parse(storeValueStr);
      if(this.trace) {
        console.log('DidStore::getAll::storeValue=:<',storeValue,'>');
      }
      const isMine = this.isAddressUsedDid_(storeValue,address);
      if(this.trace) {
        console.log('DidStore::getAll::isMine=:<',isMine,'>');
      }
      if(isMine) {
        didValuesJson.push(storeValue);
      }
    }
    if(this.trace) {
      console.log('DidStore::getAll::didValuesJson=:<',didValuesJson,'>');
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
  
  isAddressUsedDid_(didDoc,address) {
    if(this.trace) {
      console.log('DidStore::isAddressUsedDid_::didDoc=:<',didDoc,'>');
      console.log('DidStore::isAddressUsedDid_::address=:<',address,'>');
    }
    const addressSuffix = `#${address}`;
    if(this.trace) {
      console.log('DidStore::isAddressUsedDid_::addressSuffix=:<',addressSuffix,'>');
    }
    for(const auth of didDoc.authentication) {
      if(this.trace) {
        console.log('DidStore::isAddressUsedDid_::auth=:<',auth,'>');
      }
      if(auth.endsWith(addressSuffix)) {
        return true;
      }
    }
    return false;
  }

}

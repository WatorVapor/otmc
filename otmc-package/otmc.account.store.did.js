import Dexie from 'dexie';
import { StoreKey } from './otmc.const.js';
/**
*
*/
export class AccountStoreDid {
  constructor() {
    this.version = '1.0';
    this.trace0 = true;
    this.trace1 = false;
    this.trace2 = false;
    this.trace = true;;
    this.debug = true;
    this.db = new Dexie(StoreKey.secret.did.dbName);
    this.db.version(this.version).stores({
      property: '++autoId,did,hash'
    });
  }
  async putProperty(accountStore) {
    if(this.trace) {
      console.log('AccountStoreDid::putProperty::accountStore=:<',accountStore,'>');
    }
    const filter = {
      did: accountStore.did,
      hash: accountStore.hash
    };
    const storeObject = await this.db.property.where(filter).first();
    if(this.trace) {
      console.log('AccountStoreDid::putProperty::storeObject=:<',storeObject,'>');
    }
    if(!storeObject) {
      await this.db.property.put(accountStore);
    }
  }

  async getAllProperty(address) {
    const didAddress = `did:otmc:${address}`;
    if(this.trace) {
      console.log('AccountStoreDid::getAllProperty::didAddress=:<',didAddress,'>');
    }
    const storeObjects = await this.db.property.where('did').equals(didAddress).toArray();
    return storeObjects;
  }
}

import Dexie from 'dexie';
import { StoreNodeWrapper } from '../core.utils/store.node.wrapper.mjs';
const isNode = typeof global !== 'undefined' && typeof window === 'undefined';
/**
*
*/
export class AccountStore {
  constructor(config) {
    this.version = '1.0';
    this.trace0 = true;
    this.trace1 = false;
    this.trace2 = false;
    this.trace = true;;
    this.debug = true;
    this.config = config;
    if(this.trace) {
      console.log('AccountStore::constructor::config=:<',config,'>');
    }
    StoreNodeWrapper.addIndexedDBDependencies(Dexie);
    this.db = new Dexie(config.secret.dbName);
    this.db.version(this.version).stores({
      property: 'did,updated,team.name,member.name,members'
    });
    this.wrapper = new StoreNodeWrapper(this.db,this.config);
    this.wrapper.importData();
    if(this.trace) {
      console.log('AccountStore::constructor::this.db=:<',this.db,'>');
    }
  }
  async putProperty(accountStore) {
    if(this.trace) {
      console.log('AccountStore::putProperty::accountStore=:<',accountStore,'>');
    }
    const filter = {
      did: accountStore.did,
    };
    const storeObject = await this.db.property.where(filter).first();
    if(this.trace) {
      console.log('AccountStore::putProperty::storeObject=:<',storeObject,'>');
    }
    accountStore.updated = new Date().toISOString();
    if(!storeObject) {
      await this.db.property.put(accountStore);
    } else {
      await this.db.property.update(accountStore.did,accountStore);
    }
    await this.wrapper.exportData();
  }

  async getProperty(didAddress) {
    if(this.trace) {
      console.log('AccountStore::getAllProperty::didAddress=:<',didAddress,'>');
    }
    const filter = {
      did: didAddress,
    };
    if(this.trace) {
      console.log('AccountStore::getAllProperty::filter=:<',filter,'>');
    }
    const storeObjects = await this.db.property.where(filter).first();
    if(this.trace) {
      console.log('AccountStore::getAllProperty::storeObjects=:<',storeObjects,'>');
    }
    return storeObjects;
  }
}

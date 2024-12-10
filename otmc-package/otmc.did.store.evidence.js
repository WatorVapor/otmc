import Dexie from 'dexie';
import { StoreKey } from './otmc.const.js';
/**
*
*/
export class DidStoreEvidence {
  constructor() {
    this.version = '1.0';
    this.trace0 = true;
    this.trace1 = true;
    this.trace2 = true;
    this.trace = true;;
    this.debug = true;
    this.db = new Dexie(StoreKey.open.did.chain.dbName);
    this.db.version(this.version).stores({
      chain: '++autoId,didId,proofAddress,authAddress,ctrler,ctrlee,seed,bud'
    });
  }
  async getAllStable() {
    const stable = {};
    const allAuthed = await this.db.chain.toArray();
    if(this.trace0) {
      console.log('DidStoreEvidence::getAllStable::allAuthed=<',allAuthed,'>');
    }
    for(const authed of allAuthed) {
      if(this.trace0) {
        console.log('DidStoreEvidence::getAllStable::authed=<',authed,'>');
      }
      const authedKeyId = authed.authAddress;
      const filter =  {
        authAddress: authedKeyId
      };
      const storedAuthedKey = await this.db.chain.where(filter).toArray();
      if(this.trace0) {
        console.log('DidStoreEvidence::getAllStable::storedAuthedKey=<',storedAuthedKey,'>');
      }
      stable[authedKeyId] = storedAuthedKey;
    }
    return stable;
  }
  async getAddressStable(concernAddress) {
    if(this.trace0) {
      console.log('DidStoreEvidence::getAddressStable::concernAddress=<',concernAddress,'>');
    }
    const stable = {};
      for(const didAddress of concernAddress) {
      const filterAddress =  {
        didId: didAddress
      };
      const allAuthed = await this.db.chain.where(filterAddress).toArray();
      if(this.trace0) {
        console.log('DidStoreEvidence::getAddressStable::allAuthed=<',allAuthed,'>');
      }
      for(const authed of allAuthed) {
        if(this.trace0) {
          console.log('DidStoreEvidence::getAddressStable::authed=<',authed,'>');
        }
        const authedKeyId = authed.authAddress;
        const filter =  {
          didId: didAddress,
          authAddress: authedKeyId
        };
        const storedAuthedKey = await this.db.chain.where(filter).toArray();
        if(this.trace0) {
          console.log('DidStoreEvidence::getAddressStable::storedAuthedKey=<',storedAuthedKey,'>');
        }
        if(stable[authedKeyId]) {
          stable[authedKeyId] = stable[authedKeyId].concat(storedAuthedKey);
        } else {
          stable[authedKeyId] = storedAuthedKey;
        }
      }
    }
    return stable;
  }  
  async putStable(chainId,proofKeyId,authedKeyId,authedKeyState) {
    if(this.trace0) {
      console.log('DidStoreEvidence::putStable::chainId=<',chainId,'>');
      console.log('DidStoreEvidence::putStable::proofKeyId=<',proofKeyId,'>');
      console.log('DidStoreEvidence::putStable::authedKeyId=<',authedKeyId,'>');
      console.log('DidStoreEvidence::putStable::authedKeyState=<',authedKeyState,'>');
    }
    const filter =  {
      didId: chainId,
      proofAddress: proofKeyId,
      authAddress: authedKeyId
    };
    const storedAuthedKey = await this.db.chain.where(filter).first();
    if(this.trace0) {
      console.log('DidStoreEvidence::putStable::storedAuthedKey=<',storedAuthedKey,'>');
    }
    if(storedAuthedKey) {
      const updateResult = await this.db.chain.update(storedAuthedKey.autoId, {
        ctrler: authedKeyState.ctrler,
        ctrlee: authedKeyState.ctrlee,
        seed: authedKeyState.seed,
        leaf: authedKeyState.leaf
      });
      if(this.trace0) {
        console.log('DidStoreEvidence::putStable::updateResult=<',updateResult,'>');
      }
    } else {
      const evidStore = {
        didId: chainId,
        proofAddress: proofKeyId,
        authAddress: authedKeyId,
        ctrler: authedKeyState.ctrler,
        ctrlee: authedKeyState.ctrlee,
        seed: authedKeyState.seed,
        bud: authedKeyState.bud
      };
      const putResult = await this.db.chain.put(evidStore);  
      if(this.trace0) {
        console.log('DidStoreEvidence::putStable::putResult=<',putResult,'>');
      }
    }
  }
}
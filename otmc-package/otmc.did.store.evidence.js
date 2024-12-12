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
      chain: '++autoId,didId,proofer,proofee'
    });
  }
  async getAllProofLinks() {
    const stable = {};
    const allInProof = await this.db.chain.toArray();
    if(this.trace0) {
      console.log('DidStoreEvidence::getAllProofLinks::allInProof=<',allInProof,'>');
    }
    return allInProof;
  }
  async getAllStable() {
    const stable = {};
    const allInProof = await this.db.chain.toArray();
    if(this.trace0) {
      console.log('DidStoreEvidence::getAllStable::allInProof=<',allInProof,'>');
    }
    return allInProof;
    /*
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
    */
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
  async putStable(chainId,proofer,proofee) {
    if(this.trace0) {
      console.log('DidStoreEvidence::putStable::chainId=<',chainId,'>');
      console.log('DidStoreEvidence::putStable::proofer=<',proofer,'>');
      console.log('DidStoreEvidence::putStable::proofee=<',proofee,'>');
    }
    const filter =  {
      didId: chainId,
      proofer: proofer,
      proofee: proofee
    };
    const storedAuthedKey = await this.db.chain.where(filter).first();
    if(this.trace0) {
      console.log('DidStoreEvidence::putStable::storedAuthedKey=<',storedAuthedKey,'>');
    }
    if(!storedAuthedKey) {
      const evidStore = {
        didId: chainId,
        proofer: proofer,
        proofee: proofee,
      };
      const putResult = await this.db.chain.put(evidStore);  
      if(this.trace0) {
        console.log('DidStoreEvidence::putStable::putResult=<',putResult,'>');
      }
    }
  }
}

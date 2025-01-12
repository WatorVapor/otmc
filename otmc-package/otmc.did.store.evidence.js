import Dexie from 'dexie';
import { StoreKey } from './otmc.const.js';
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
  /**
   * Retrieves all proof links from the database.
   *
   * @async
   * @returns {Promise<Array>} A promise that resolves to an array of all proof links.
   */
  async getAllProofLinks() {
    const stable = {};
    const allInProof = await this.db.chain.toArray();
    if(this.trace0) {
      console.log('DidStoreEvidence::getAllProofLinks::allInProof=<',allInProof,'>');
    }
    return allInProof;
  }
  /**
   * Retrieves all stable records from the database.
   *
   * @async
   * @returns {Promise<Array>} A promise that resolves to an array of all records in the proof chain.
   */
  async getAllStable() {
    const stable = {};
    const allInProof = await this.db.chain.toArray();
    if(this.trace0) {
      console.log('DidStoreEvidence::getAllStable::allInProof=<',allInProof,'>');
    }
    return allInProof;
  }
  /**
   * Retrieves a stable list of authenticated addresses for the given concern addresses.
   *
   * @param {Array<string>} concernAddress - An array of DID addresses to retrieve the stable addresses for.
   * @returns {Promise<Object>} A promise that resolves to an object where the keys are authenticated key IDs and the values are arrays of stored authenticated keys.
   */
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
  /**
   * Stores evidence in the database if it does not already exist.
   *
   * @async
   * @param {string} chainId - The ID of the chain.
   * @param {string} proofer - The identifier of the proofer.
   * @param {string} proofee - The identifier of the proofee.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
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

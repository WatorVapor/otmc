import Dexie from 'dexie';
import { StoreKey } from './otmc.const.js';
import { StoreNodeWrapper } from './otmc.store.node.wrapper.js';
const isNode = typeof global !== 'undefined' && typeof window === 'undefined';

/**
*
*/
export class DidStoreDocument {
  constructor(config) {
    this.version = '1.0';
    this.trace0 = true;
    this.trace1 = true;
    this.trace2 = true;
    this.trace = true;;
    this.debug = true;
    this.config = config;
    if(isNode) {
      StoreNodeWrapper.addIndexedDBDependencies(Dexie);
    }
    this.db = new Dexie(StoreKey.open.did.document.dbName);
    this.db.version(this.version).stores({
      stable: '++autoId,did,controller,authentication,updated,hashDid,hashCore,b64Did'
    });
    this.db.version(this.version).stores({
      fickle: '++autoId,did,controller,authentication,updated,hashDid,hashCore,b64Did'
    });
    this.db.version(this.version).stores({
      tentative: '++autoId,did,controller,authentication,updated,hashDid,hashCore,b64Did'
    });
    if(isNode) {
      this.wrapper = new StoreNodeWrapper(this.db,this.config);
      this.wrapper.importData();
    }
  }
  async putStable(didStore) {
    if(this.trace) {
      console.log('DidStoreDocument::putStable::didStore=:<',didStore,'>');
    }
    const filter = {
      did: didStore.did,
      hashDid: didStore.hashDid
    };
    const storeObject = await this.db.stable.where(filter).first();
    if(this.trace) {
      console.log('DidStoreDocument::putStable::storeObject=:<',storeObject,'>');
    }
    if(!storeObject) {
      await this.db.stable.put(didStore);
    }
    if(isNode) {
      await this.wrapper.exportData();
    }
  }
  async putFickle(didStore) {
    if(this.trace) {
      console.log('DidStoreDocument::putFickle::didStore=:<',didStore,'>');
    }
    const filter = {
      did: didStore.did,
      hashDid: didStore.hashDid
    };
    if(this.trace) {
      console.log('DidStoreDocument::putFickle::filter=:<',filter,'>');
    }
    const storeObject = await this.db.fickle.where(filter).first();
    if(this.trace) {
      console.log('DidStoreDocument::putFickle::storeObject=:<',storeObject,'>');
    }
    if(!storeObject) {  
      await this.db.fickle.put(didStore);
    }
    if(isNode) {
      await this.wrapper.exportData();
    }
  }
  /**
   * Asynchronously puts a tentative DID store document into the database.
   * If a document with the same DID and hashDid already exists, it will not be added again.
   *
   * @param {Object} didStore - The DID store document to be added.
   * @param {string} didStore.did - The DID of the store document.
   * @param {string} didStore.hashDid - The hash of the DID of the store document.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  async putTentative(didStore) {
    if(this.trace) {
      console.log('DidStoreDocument::putTentative::didStore=:<',didStore,'>');
    }
    const filter = {
      did: didStore.did,
      hashDid: didStore.hashDid
    };
    const storeObject = await this.db.tentative.where(filter).first();
    if(this.trace) {
      console.log('DidStoreDocument::putTentative::storeObject=:<',storeObject,'>');
    }
    if(!storeObject) { 
      await this.db.tentative.put(didStore);
    }
    if(isNode) {
      await this.wrapper.exportData();
    }
  }
  /**
   * Retrieves the top document associated with a given address.
   *
   * @param {string} address - The address to retrieve the top document for.
   * @returns {Promise<Object|null>} A promise that resolves to the top document object if found, otherwise null.
   */
  async getTop(address) {
    const didAddress = `did:otmc:${address}`;
    if(this.trace) {
      console.log('DidStoreDocument::getTop::didAddress=:<',didAddress,'>');
    }
    const didValuesJson = await this.getAllByDidAddress_(didAddress);
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
  
  /**
   * Retrieves all stable documents associated with the given address.
   *
   * @param {string} address - The address to retrieve stable documents for.
   * @returns {Promise<Object>} A promise that resolves to the JSON object containing all stable documents.
   */
  async getAllStable(address) {
    const didAddress = `did:otmc:${address}`;
    if(this.trace) {
      console.log('DidStoreDocument::getAllStable::didAddress=:<',didAddress,'>');
    }
    const storeValuesJson = await this.getAllByDidAddress_(didAddress,this.db.stable);
    if(this.trace) {
      console.log('DidStoreDocument::getAllStable::storeValuesJson=:<',storeValuesJson,'>');
    }
    return storeValuesJson;
  }
  /**
   * Retrieves all fickle values associated with a given address.
   *
   * @param {string} address - The address to retrieve fickle values for.
   * @returns {Promise<Object>} A promise that resolves to the JSON object containing all fickle values.
   */
  async getAllFickle(address) {
    const didAddress = `did:otmc:${address}`;
    if(this.trace) {
      console.log('DidStoreDocument::getAllFickle::didAddress=:<',didAddress,'>');
    }
    const storeValuesJson = await this.getAllByDidAddress_(didAddress,this.db.fickle);
    if(this.trace) {
      console.log('DidStoreDocument::getAllFickle::storeValuesJson=:<',storeValuesJson,'>');
    }
    return storeValuesJson;
  }

  /**
   * Retrieves all tentative documents associated with a given address.
   *
   * @param {string} address - The address to retrieve tentative documents for.
   * @returns {Promise<Object>} A promise that resolves to the JSON object containing all tentative documents.
   */
  async getAllTentative(address) {
    const didAddress = `did:otmc:${address}`;
    if(this.trace) {
      console.log('DidStoreDocument::getAllTentative::didAddress=:<',didAddress,'>');
    }
    const storeValuesJson = await this.getAllByDidAddress_(didAddress,this.db.tentative);
    if(this.trace) {
      console.log('DidStoreDocument::getAllTentative::storeValuesJson=:<',storeValuesJson,'>');
    }
    return storeValuesJson;
  }  
  /**
   * Retrieves all stable member data for a given address.
   *
   * @param {string} address - The address of the member.
   * @returns {Promise<Object>} A promise that resolves to the JSON object containing all stable member data.
   */
  async getMemberAllStable(address) {
    const storeValuesJson = await this.getAllAuthMember_(address,this.db.stable);
    if(this.trace) {
      console.log('DidStoreDocument::getMemberAllStable::storeValuesJson=:<',storeValuesJson,'>');
    }
    return storeValuesJson;
  }
  /**
   * Retrieves all fickle member data for a given address.
   *
   * @param {string} address - The address to retrieve member data for.
   * @returns {Promise<Object>} A promise that resolves to the JSON object containing all fickle member data.
   */
  async getMemberAllFickle(address) {
    const storeValuesJson = await this.getAllAuthMember_(address,this.db.fickle);
    if(this.trace) {
      console.log('DidStoreDocument::getMemberAllFickle::storeValuesJson=:<',storeValuesJson,'>');
    }
    return storeValuesJson;
  }
  
  /**
   * Retrieves the unique controllers for a given DID.
   *
   * @param {string} did - The decentralized identifier (DID) to retrieve controllers for.
   * @returns {Promise<string[]>} A promise that resolves to an array of unique controllers.
   */
  async getControll(did) {
    if(this.trace) {
      console.log('DidStoreDocument::getControll::did=:<',did,'>');
    }
    const didAllJson = await this.getAllByDidAddress_(did,this.db.stable);
    if(this.trace) {
      console.log('DidStoreDocument::getControll::didAllJson=:<',didAllJson,'>');
    }
    const didControls = [];
    for(const didJson of didAllJson) {
      if(this.trace) {
        console.log('DidStoreDocument::getControll::didJson=:<',didJson,'>');
      }
      didControls.push(didJson.controller);
    }
    if(this.trace) {
      console.log('DidStoreDocument::getControll::didControls=:<',didControls,'>');
    }
    const flatControls = didControls.flat();
    if(this.trace) {
      console.log('DidStoreDocument::getControll::flatControls=:<',flatControls,'>');
    }
    const uniqueControls = [...new Set(flatControls)];
    if(this.trace) {
      console.log('DidStoreDocument::getControll::uniqueControls=:<',uniqueControls,'>');
    }
    return uniqueControls;
  }
  /**
   * Retrieves a list of unique DID addresses from the database.
   * 
   * This method fetches data from two database tables (`stable` and `fickle`), 
   * combines the results, and extracts the `controller` and `did` fields from 
   * each entry. It then returns a deduplicated list of these addresses.
   * 
   * @returns {Promise<string[]>} A promise that resolves to an array of unique DID addresses.
   */
  async getConcernDidAddress() {
    const storeValuesJson = [];
    storeValuesJson.push(await this.db.stable.toArray());
    storeValuesJson.push(await this.db.fickle.toArray());
    if(this.trace) {
      console.log('DidStoreDocument::getConcernDidAddress::storeValuesJson=:<',storeValuesJson,'>');
    }
    const storeValuesJsonFlat = storeValuesJson.flat();
    if(this.trace) {
      console.log('DidStoreDocument::getConcernDidAddress::storeValuesJsonFlat=:<',storeValuesJsonFlat,'>');
    }
    const didAdresses = [];
    for(const didJson of storeValuesJsonFlat) {
      didAdresses.push(didJson.controller);
      didAdresses.push(didJson.did);
    }
    if(this.trace) {
      console.log('DidStoreDocument::getConcernDidAddress::didAdresses=:<',didAdresses,'>');
    }
    const uniquedDidAdresses = [...new Set(didAdresses.flat())];
    if(this.trace) {
      console.log('DidStoreDocument::getConcernDidAddress::uniquedDidAdresses=:<',uniquedDidAdresses,'>');
    }
    return uniquedDidAdresses;
  }
  /**
   * Retrieves a list of hashes associated with a given DID address from the stable store.
   *
   * @param {string} didAddress - The DID address to query for.
   * @returns {Promise<string[]>} A promise that resolves to an array of hash strings.
   */
  async getHashListOfStable(didAddress) {
    if(this.trace) {
      console.log('DidStoreDocument::getHashListOfStable::didAddress=:<',didAddress,'>');
    }
    const storeObjects = await this.db.stable.where('did').equals(didAddress).toArray();
    if(this.trace) {
      console.log('DidStoreDocument::getAllByDidAddress_::storeObjects=:<',storeObjects,'>');
    }
    const hashList = [];
    for(const storeValue of storeObjects) {
      if(this.trace) {
        console.log('DidStoreDocument::getHashListOfStable::storeValue=:<',storeValue,'>');
      }
      hashList.push(storeValue.hashDid);
    }
    if(this.trace) {
      console.log('DidStoreDocument::getHashListOfStable::hashList=:<',hashList,'>');
    }
    return hashList;
  }
  /**
   * Retrieves a stable DID document from the database based on the provided DID and hash.
   *
   * @param {string} didUL - The DID (Decentralized Identifier) to search for.
   * @param {string} hashUL - The hash of the DID to search for.
   * @returns {Promise<Object|null>} A promise that resolves to the stable DID document object if found, or null if not found.
   */
  async getStableDidDocument (didUL,hashUL) {
    if(this.trace) {
      console.log('DidStoreDocument::getStableDidDocument::didUL=:<',didUL,'>');
      console.log('DidStoreDocument::getStableDidDocument::hashUL=:<',hashUL,'>');
    }
    const filter = {
      did: didUL,
      hashDid: hashUL
    };
    const storeObject = await this.db.stable.where(filter).first();
    if(this.trace) {
      console.log('DidStoreDocument::getStableDidDocument::storeObject=:<',storeObject,'>');
    }
    return storeObject;
  }
  async getTentativeAll () {
    const storeObjects = await this.db.tentative.toArray();
    if(this.trace) {
      console.log('DidStoreDocument::getTentativeDidDocument::storeObjects=:<',storeObjects,'>');
    }
    return storeObjects;
  }
  /**
   * Moves a document from the tentative collection to the stable collection if it does not already exist in the stable collection.
   * 
   * @param {Object} moveDid - The DID object containing the identifiers for the document to be moved.
   * @param {string} moveDid.did - The DID of the document.
   * @param {string} moveDid.hashDid - The hash of the DID of the document.
   * @returns {Promise<void>} - A promise that resolves when the operation is complete.
   */
  async moveTentative2Stable (moveDid) {
    if(this.trace) {
      console.log('DidStoreDocument::moveTentative2Stable::moveDid=:<',moveDid,'>');
    }
    const filter = {
      did: moveDid.did,
      hashDid: moveDid.hashDid
    };
    const storeObject1 = await this.db.stable.where(filter).first();
    if(this.trace) {
      console.log('DidStoreDocument::moveTentative2Stable::storeObject1=:<',storeObject1,'>');
    }
    if(!storeObject1) {
      const storeObject2 = await this.db.tentative.where(filter).first();
      if(this.trace) {
        console.log('DidStoreDocument::moveTentative2Stable::storeObject2=:<',storeObject2,'>');
      }
      delete storeObject2.autoId;
      await this.db.stable.put(storeObject2);
    }
    await this.db.tentative.where('hashDid').equals(moveDid.hashDid).delete(); 
    if(isNode) {
      await this.wrapper.exportData();
    }
  }

  /**
   * Retrieves any DID (Decentralized Identifier) document from the database.
   * 
   * This function fetches data from three different database tables: stable, fickle, and tentative.
   * It combines the data from these tables into a single array and returns it.
   * 
   * @returns {Promise<Array>} A promise that resolves to an array containing the combined data from the stable, fickle, and tentative tables.
   */
  async getAnyDidDocument () {
    const storeValuesJson = [];
     storeValuesJson.push(await this.db.stable.toArray());
    storeValuesJson.push(await this.db.fickle.toArray());
    storeValuesJson.push(await this.db.tentative.toArray());
    if(this.trace) {
      console.log('DidStoreDocument::getAnyDidDocument::storeValuesJson=:<',storeValuesJson,'>');
    }
    const flatStoreValuesJson = storeValuesJson.flat();
    if(this.trace) {
      console.log('DidStoreDocument::getAnyDidDocument::flatStoreValuesJson=:<',flatStoreValuesJson,'>');
    }
    return flatStoreValuesJson;
  }  

  /**
   * Retrieves all documents by DID address from the specified store collection.
   *
   * @param {string} didAddress - The DID address to search for.
   * @param {Object} storeCollection - The store collection to query.
   * @returns {Promise<Array>} A promise that resolves to an array of store objects.
   */
  async getAllByDidAddress_(didAddress,storeCollection) {
    if(this.trace) {
      console.log('DidStoreDocument::getAllByDidAddress_::didAddress=:<',didAddress,'>');
    }
    const storeObjects = await storeCollection.where('did').equals(didAddress).toArray();
    if(this.trace) {
      console.log('DidStoreDocument::getAllByDidAddress_::storeObjects=:<',storeObjects,'>');
    }
    return storeObjects;
  }

  /**
   * Retrieves all authorized members from the store collection.
   *
   * @param {string} authAddress - The authorization address to check against.
   * @param {Object} storeCollection - The collection of store objects to search through.
   * @returns {Promise<Array>} A promise that resolves to an array of authorized member objects.
   */
  async getAllAuthMember_(authAddress,storeCollection) {
    const storeObjects = await storeCollection.toArray();
    if(this.trace) {
      console.log('DidStoreDocument::getAllAuthMember_::storeObjects=:<',storeObjects,'>');
    }
    const storeValuesJson = [];
    for(const storeValue of storeObjects) {
      if(this.isAuthMember_(storeValue,authAddress)){
        storeValuesJson.push(storeValue);
      }
    }
    if(this.trace) {
      console.log('DidStoreDocument::getAllAuthMember_::storeValuesJson=:<',storeValuesJson,'>');
    }
    return storeValuesJson;
  }
  /**
   * Checks if the given address is an authenticated member in the store value.
   *
   * @param {Object} storeValue - The store value containing authentication information.
   * @param {string} address - The address to check for authentication.
   * @returns {boolean} - Returns true if the address is an authenticated member, otherwise false.
   */
  isAuthMember_(storeValue,address) {
    if(this.trace) {
      console.log('DidStoreDocument::isAuthMember_::storeValue=:<',storeValue,'>');
      console.log('DidStoreDocument::isAuthMember_::address=:<',address,'>');
    }
    try {
      for(const auth of storeValue.authentication) {
        if(this.trace) {
          console.log('DidStoreDocument::isAuthMember_::auth=:<',auth,'>');
        }
        if(auth.endsWith(`#${address}`)) {
          return true;
        }
      }
    } catch (err) {
      console.error('DidStoreDocument::isAuthMember_::err=:<',err,'>');
    }
    return false;
  }
  
  /**
   * Compares two objects based on their `updated` property.
   *
   * @param {Object} a - The first object to compare.
   * @param {Object} a.updated - The updated timestamp of the first object.
   * @param {Object} b - The second object to compare.
   * @param {Object} b.updated - The updated timestamp of the second object.
   * @returns {number} - Returns -1 if `a.updated` is less than `b.updated`, 1 if `a.updated` is greater than `b.updated`, and 0 if they are equal.
   */
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
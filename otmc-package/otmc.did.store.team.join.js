import Dexie from 'dexie';
import { StoreKey } from './otmc.const.js';
import { StoreNodeWrapper } from './otmc.store.node.wrapper.js';
const isNode = typeof global !== 'undefined' && typeof window === 'undefined';

/**
 * The DidStoreTeamJoin class provides methods to manage and store credential requests and verifiable credentials (VCs) 
 * in a Dexie database. It supports operations for storing, retrieving, and moving credential requests and VCs 
 * between different states such as in-progress, done, tentative, and verified.
 * 
 * @class
 * @property {string} version - The version of the database schema.
 * @property {boolean} trace0 - Flag for trace level 0.
 * @property {boolean} trace1 - Flag for trace level 1.
 * @property {boolean} trace2 - Flag for trace level 2.
 * @property {boolean} trace - Flag to enable tracing.
 * @property {boolean} debug - Flag to enable debugging.
 * @property {Dexie} db - The Dexie database instance.
 * 
 * @method constructor - Initializes the database with different stores for in-progress, done, tentative, and verified states.
 * 
 * @method putCredReq - Stores a credential request in the database if it does not already exist.
 * @param {Object} credReqStore - The credential request object to be stored.
 * @param {string} credReqStore.hashCR - The hash of the credential request.
 * @param {string} credReqStore.did - The decentralized identifier (DID) associated with the credential request.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * 
 * @method putTentativeCredReq - Stores a tentative credential request in the database if it does not already exist.
 * @param {Object} credReqStore - The credential request store object.
 * @param {string} credReqStore.hashCR - The hash of the credential request.
 * @param {string} credReqStore.did - The decentralized identifier (DID) associated with the credential request.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * 
 * @method putTentativeVC - Stores a tentative verifiable credential (VC) in the database if it does not already exist.
 * @param {Object} vcStore - The verifiable credential store object.
 * @param {string} vcStore.hashVC - The hash of the verifiable credential.
 * @param {string} vcStore.did - The decentralized identifier (DID) associated with the verifiable credential.
 * @param {string} vcStore.hashCR - The hash of the credential request.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * 
 * @method getRequestTop - Retrieves the top request for the given DID address.
 * @param {string} didAddress - The DID address to retrieve requests for.
 * @returns {Promise<Object|null>} - A promise that resolves to the top request object, or null if no requests are found.
 * 
 * @method getInProgressOfAddress - Retrieves the in-progress records associated with a given DID address.
 * @param {string} didAddress - The DID address to query for in-progress records.
 * @returns {Promise<Object>} - A promise that resolves to an object containing the in-progress records.
 * 
 * @method getInProgressAny - Retrieves all in-progress records from the database, parses them, and returns them as a JSON object.
 * @returns {Promise<Object>} - A promise that resolves to an object where each key is a hashCR and each value is the parsed origCredReq.
 * 
 * @method getJoinCredRequest - Retrieves the join credential request for a given store hash.
 * @param {string} storeHash - The hash of the store to retrieve the join credential request for.
 * @returns {Promise<Object>} - A promise that resolves to the parsed join credential request object.
 * 
 * @method putVerifiableCredential - Stores a verifiable credential in the database.
 * @param {Object} vcStore - The verifiable credential to be stored.
 * @returns {Promise<Object>} - The result of the database operation.
 * 
 * @method getJoinTentativeVCAll - Retrieves all tentative verifiable credentials (VCs) from the database.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of tentative verifiable credential objects.
 * 
 * @method moveJoinCredRequest2Done - Moves a join credential request from the in-progress store to the done store.
 * @param {string} storeHash - The hash of the credential request to be moved.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * 
 * @method getHashListOfJoinCR - Retrieves a list of hashCR values associated with the given DID address from various database stores.
 * @param {string} didAddress - The DID address to search for in the database.
 * @returns {Promise<string[]>} - A promise that resolves to an array of hashCR values.
 * 
 * @method getJoinRequestByAddreAndHash - Retrieves a join request by DID address and hash from the database.
 * @param {string} didAddress - The DID address to search for.
 * @param {string} hashRC - The hash to search for.
 * @returns {Promise<Object|null>} - The original credential request object if found, otherwise null.
 * 
 * @method getHashListOfJoinVC - Retrieves a list of hash values for join verifiable credentials (VC) associated with a given DID address.
 * @param {string} didAddress - The DID address to search for join VCs.
 * @returns {Promise<string[]>} - A promise that resolves to an array of hash values for the join VCs.
 * 
 * @method getJoinVCByAddreAndHash - Retrieves a verified credential (VC) from the database based on the provided DID address and hash.
 * @param {string} didAddress - The DID address to search for.
 * @param {string} hashVC - The hash of the verified credential to search for.
 * @returns {Promise<Object|null>} - A promise that resolves to the store object if found, otherwise null.
 * 
 * @method moveTentativeCR2Workspace - Moves tentative objects to the workspace if they are not already present in the 'done' or 'inProgress' collections.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * 
 * @method moveTentativeVC2Workspace - Moves a tentative verifiable credential (VC) to the workspace.
 * @param {Object} storedTentativeVC - The tentative verifiable credential to be moved.
 * @param {string} storedTentativeVC.did - The decentralized identifier (DID) of the VC.
 * @param {string} storedTentativeVC.hashCR - The hash of the credential request.
 * @param {string} storedTentativeVC.hashVC - The hash of the verifiable credential.
 * @returns {Promise<number>} - The number of deleted records from the tentative VC database.
 * 
 * @method compare_ - Compares two objects based on their `updated` property.
 * @param {Object} a - The first object to compare.
 * @param {Object} b - The second object to compare.
 * @returns {number} - Returns -1 if `a.updated` is less than `b.updated`, 1 if `a.updated` is greater than `b.updated`, and 0 if they are equal.
 */
export class DidStoreTeamJoin {
  /**
   * Constructs an instance of DidStoreTeamJoin.
   * Initializes the database with different stores for in-progress, done, tentative, and verified states.
   * Logs the initialization process if tracing is enabled.
   * Credential Request (CR) objects are stored in the 'inProgress', 'done', and 'tentative' stores.
   * Verifiable Credentials (VCs) are stored in the 'verified' store.
   *
   * @constructor
   * @property {string} version - The version of the database schema.
   * @property {boolean} trace0 - Flag for trace level 0.
   * @property {boolean} trace1 - Flag for trace level 1.
   * @property {boolean} trace2 - Flag for trace level 2.
   * @property {boolean} trace - Flag to enable tracing.
   * @property {boolean} debug - Flag to enable debugging.
   * @property {Dexie} db - The Dexie database instance.
   */
  constructor(config) {
    this.version = '1.0';
    this.trace0 = true;
    this.trace1 = true;
    this.trace2 = true;
    this.trace = true;
    this.debug = true;
    this.config = config;
    if(this.trace) {
      console.log('DidStoreTeamJoin::constructor::Dexie=:<',Dexie,'>');
    }
    if(isNode) {
      StoreNodeWrapper.addIndexedDBDependencies(Dexie);
    }
    this.db = new Dexie(StoreKey.open.did.join.dbName);
    this.db.version(this.version).stores({
      inProgress: '++autoId,did,control,hashCR,b64JoinCR'
    });
    this.db.version(this.version).stores({
      done: '++autoId,did,control,hashCR,b64JoinCR'
    });
    this.db.version(this.version).stores({
      tentative: '++autoId,did,control,hashCR,b64JoinCR'
    });
    this.db.version(this.version).stores({
      verified: '++autoId,did,control,hashCR,hashVC,b64JoinVC'
    });
    this.db.version(this.version).stores({
      vcTentative: '++autoId,did,control,hashCR,hashVC,b64JoinVC'
    });
    if(this.trace) {
      console.log('DidStoreTeamJoin::constructor::this.db=:<',this.db,'>');
    }
    if(this.trace) {
      console.log('DidStoreTeamJoin::constructor::this.db.inProgress=:<',this.db.inProgress,'>');
    }
    if(this.trace) {
      console.log('DidStoreTeamJoin::constructor::this.db.done=:<',this.db.done,'>');
    }
    if(this.trace) {
      console.log('DidStoreTeamJoin::constructor::this.db.verified=:<',this.db.verified,'>');
    }
    if(this.trace) {
      console.log('DidStoreTeamJoin::constructor::this.db.vcTentative=:<',this.db.vcTentative,'>');
    }
    if(isNode) {
      this.wrapper = new StoreNodeWrapper(this.db,this.config);
      this.wrapper.importData();
    }
  }

  /**
   * Stores a credential request in the database if it does not already exist.
   *
   * @param {Object} credReqStore - The credential request object to be stored.
   * @param {string} credReqStore.hashCR - The hash of the credential request.
   * @param {string} credReqStore.did - The decentralized identifier (DID) associated with the credential request.
   * @returns {Promise<void>} - A promise that resolves when the operation is complete.
   */
  async putCredReq(credReqStore) {
    if(this.trace) {
      console.log('DidStoreTeamJoin::putCredReq::credReqStore=:<',credReqStore,'>');
    }
    const filter = {
      did: credReqStore.did,
      hashCR: credReqStore.hashCR
    };
    const storedObject = await this.db.inProgress.where(filter).first();
    if(this.trace) {
      console.log('DidStoreTeamJoin::putCredReq::storedObject=:<',storedObject,'>');
    }
    if(storedObject) {
      return;
    } else {
      await this.db.inProgress.put(credReqStore);
    }
    if(isNode) {
      await this.wrapper.exportData();
    }
  }

  /**
   * Stores a tentative credential request in the database if it does not already exist.
   *
   * @param {Object} credReqStore - The credential request store object.
   * @param {string} credReqStore.hashCR - The hash of the credential request.
   * @param {string} credReqStore.did - The decentralized identifier (DID) associated with the credential request.
   * @returns {Promise<void>} - A promise that resolves when the operation is complete.
   */
  async putTentativeCredReq(credReqStore) {
    if(this.trace) {
      console.log('DidStoreTeamJoin::putTentativeCredReq::credReqStore=:<',credReqStore,'>');
    }
    const filter = {
      did: credReqStore.did,
      hashCR: credReqStore.hashCR
    };
    const storedObject = await this.db.tentative.where(filter).first();
    if(this.trace) {
      console.log('DidStoreTeamJoin::putTentativeCredReq::storedObject=:<',storedObject,'>');
    }
    if(storedObject) {
      return;
    } else {
      await this.db.tentative.put(credReqStore);
    }
    if(isNode) {
      await this.wrapper.exportData();
    }
  }

  async putTentativeVC(vcStore) {
    if(this.trace) {
      console.log('DidStoreTeamJoin::putTentativeVC::credReqStore=:<',vcStore,'>');
    }
    const filter = {
      did: vcStore.did,
      hashVC: vcStore.hashVC,
      hashCR: vcStore.hashCR
    };
    const storedObject = await this.db.vcTentative.where(filter).first();
    if(this.trace) {
      console.log('DidStoreTeamJoin::putTentativeVC::storedObject=:<',storedObject,'>');
    }
    if(storedObject) {
      return;
    } else {
      await this.db.vcTentative.put(vcStore);
    }
    if(isNode) {
      await this.wrapper.exportData();
    }
  }

  /**
   * Retrieves the top request for the given DID address.
   *
   * This function fetches all the DID values associated with the provided DID address,
   * sorts them using the compare_ method, and returns the top (first) request.
   * If there are no requests, it returns null.
   *
   * @param {string} didAddress - The DID address to retrieve requests for.
   * @returns {Promise<Object|null>} - A promise that resolves to the top request object, or null if no requests are found.
   */
  async getRequestTop(didAddress) {
    const didValuesJson = await this.getAll(didAddress);
    if(this.trace) {
      console.log('DidStoreTeamJoin::getRequestTop::didValuesJson=:<',didValuesJson,'>');
    }
    
    const sorted = didValuesJson.sort( this.compare_ );
    if(this.trace) {
      console.log('DidStoreTeamJoin::getRequestTop::sorted=:<',sorted,'>');
    }
    if(sorted.length > 0) {
      return sorted[0];
    } else {
      return null;
    }
  }
  /**
   * Retrieves the in-progress records associated with a given DID address.
   *
   * @param {string} didAddress - The DID address to query for in-progress records.
   * @returns {Promise<Object>} A promise that resolves to an object containing the in-progress records, 
   *                            where the keys are the hashCR values and the values are the parsed origCredReq values.
   */
  async getInProgressOfAddress(didAddress) {
    const asign2Me = await this.db.inProgress.where('control').equals(didAddress).toArray();
    if(this.trace) {
      console.log('DidStoreTeamJoin::getInProgressOfAddress::asign2Me=:<',asign2Me,'>');
    }
    return asign2Me;
  }

  /**
   * Retrieves all in-progress records from the database, parses them, and returns them as a JSON object.
   * 
   * @async
   * @function getInProgressAny
   * @returns {Promise<Object>} A promise that resolves to an object where each key is a hashCR and each value is the parsed origCredReq.
   * @throws {SyntaxError} If parsing origCredReq fails.
   */
  async getInProgressAny() {
    const asign2Any = await this.db.inProgress.toArray();
    if(this.trace) {
      console.log('DidStoreTeamJoin::getInProgressAny::asign2Any=:<',asign2Any,'>');
    }
    const storeValuesJson = {};
    for(const storeReq of asign2Any) {
      if(this.trace) {
        console.log('DidStoreTeamJoin::getInProgressAny::storeReq=:<',storeReq,'>');
      }
      const storeKey = storeReq.hashCR;
      const storeValueStr = storeReq.origCredReq;
      const storeValue = JSON.parse(storeValueStr);
      if(this.trace) {
        console.log('DidStoreTeamJoin::getInProgressAny::storeValue=:<',storeValue,'>');
      }
      storeValuesJson[storeKey] = storeValue;
    }
    if(this.trace) {
      console.log('DidStoreTeamJoin::getInProgressAny::storeValuesJson=:<',storeValuesJson,'>');
    }
    return storeValuesJson;
  }
  
  /**
   * Retrieves the join credential request for a given store hash.
   *
   * @param {string} storeHash - The hash of the store to retrieve the join credential request for.
   * @returns {Promise<Object>} - A promise that resolves to the parsed join credential request object.
   * @throws {Error} - Throws an error if the store request cannot be found or if JSON parsing fails.
   */
  async getJoinCredRequest(storeHash) {
    const storeRequest = await this.db.inProgress.where('hashCR').equals(storeHash).first();
    if(this.trace) {
      console.log('DidStoreTeamJoin::getJoinCredRequest::storeRequest=:<',storeRequest,'>');
    }
    return storeRequest;
  }
  /**
   * Stores a verifiable credential in the database.
   *
   * @param {Object} vcStore - The verifiable credential to be stored.
   * @returns {Promise<Object>} The result of the database operation.
   */
  async putVerifiableCredential(vcStore) {
    if(this.trace) {
      console.log('DidStoreTeamJoin::putVerifiableCredential::vcStore=:<',vcStore,'>');
    }
    const filter = {
      did: vcStore.did,
      hashVC: vcStore.hashVC,
      hashCR: vcStore.hashCR
    };
    const storedObject = await this.db.verified.where(filter).first();
    if(this.trace) {
      console.log('DidStoreTeamJoin::putVerifiableCredential::storedObject=:<',storedObject,'>');
    }
    if(storedObject) {
      return;
    }
    const result = await this.db.verified.put(vcStore);
    if(this.trace) {
      console.log('DidStoreTeamJoin::putVerifiableCredential::result=:<',result,'>');
    }
    if(isNode) {
      await this.wrapper.exportData();
    }
    return result;
  }
  
  async getJoinTentativeVCAll() {
    const tentativeObjects = await this.db.vcTentative.toArray();
    if(this.trace) {
      console.log('DidStoreTeamJoin::getJoinTentativeVCAll::tentativeObjects=:<',tentativeObjects,'>');
    }
    return tentativeObjects;
  }

  /**
   * Moves a join credential request from the in-progress store to the done store.
   *
   * @param {string} storeHash - The hash of the credential request to be moved.
   * @returns {Promise<void>} - A promise that resolves when the operation is complete.
   */
  async moveJoinCredRequest2Done(storeHash) {
    const storeRequest = await this.db.inProgress.where('hashCR').equals(storeHash).first();
    if(this.trace) {
      console.log('DidStoreTeamJoin::moveJoinCredRequest2Done::storeRequest=:<',storeRequest,'>');
    }
    await this.db.done.put(storeRequest);
    await this.db.inProgress.where('hashCR').equals(storeHash).delete();
    if(isNode) {
      await this.wrapper.exportData();
    }
  }
  /**
   * Retrieves a list of hashCR values associated with the given DID address from various database stores.
   *
   * @param {string} didAddress - The DID address to search for in the database.
   * @returns {Promise<string[]>} A promise that resolves to an array of hashCR values.
   */
  async getHashListOfJoinCR(didAddress) {
    if(this.trace) {
      console.log('DidStoreTeamJoin::getHashListOfJoinCR::didAddress=:<',didAddress,'>');
    }
    const hashList = [];
    const store1Objects = await this.db.inProgress.where('did').equals(didAddress).toArray();
    if(this.trace) {
      console.log('DidStoreTeamJoin::getHashListOfJoinCR::store1Objects=:<',store1Objects,'>');
    }
    for(const storeObject of store1Objects) {
      if(this.trace) { 
        console.log('DidStoreTeamJoin::getHashListOfJoinCR::storeObject=:<',storeObject,'>');
      }
      hashList.push(storeObject.hashCR);
    }
    const store2Objects = await this.db.done.where('did').equals(didAddress).toArray();
    if(this.trace) {
      console.log('DidStoreTeamJoin::getHashListOfJoinCR::store2Objects=:<',store2Objects,'>');
    }
    for(const storeObject of store2Objects) {
      if(this.trace) { 
        console.log('DidStoreTeamJoin::getHashListOfJoinCR::storeObject=:<',storeObject,'>');
      }
      hashList.push(storeObject.hashCR);
    }
    const store4Objects = await this.db.tentative.where('did').equals(didAddress).toArray();
    if(this.trace) {
      console.log('DidStoreTeamJoin::getHashListOfJoinCR::store4Objects=:<',store4Objects,'>');
    }
    for(const storeObject of store4Objects) {
      if(this.trace) { 
        console.log('DidStoreTeamJoin::getHashListOfJoinCR::storeObject=:<',storeObject,'>');
      }
      hashList.push(storeObject.hashCR);
    }
    if(this.trace) {
      console.log('DidStoreTeamJoin::getHashListOfJoinCR::hashList=:<',hashList,'>');
    }
    return hashList;
  }
  /**
   * Retrieves a join request by DID address and hash from the database.
   *
   * @param {string} didAddress - The DID address to search for.
   * @param {string} hashRC - The hash to search for.
   * @returns {Promise<Object|null>} The original credential request object if found, otherwise null.
   */
  async getJoinRequestByAddreAndHash(didAddress,hashRC) {
    if(this.trace) {
      console.log('DidStoreTeamJoin::getJoinRequestByAddreAndHash::didAddress=:<',didAddress,'>');
      console.log('DidStoreTeamJoin::getJoinRequestByAddreAndHash::hashRC=:<',hashRC,'>');
    }
    const filter = {
      did: didAddress,
      hashCR: hashRC
    };
    let storeObject = await this.db.inProgress.where(filter).first();
    if(this.trace) {
      console.log('DidStoreTeamJoin::getJoinRequestByAddreAndHash::storeObject=:<',storeObject,'>');
    }
    if(storeObject) {
      return storeObject;
    }
    storeObject = await this.db.done.where(filter).first();
    if(this.trace) {
      console.log('DidStoreTeamJoin::getJoinRequestByAddreAndHash::storeObject=:<',storeObject,'>');
    }
    if(storeObject) {
      return storeObject;
    }
    return null;
  }

  /**
   * Retrieves a list of hash values for join verifiable credentials (VC) associated with a given DID address.
   *
   * @param {string} didAddress - The DID address to search for join VCs.
   * @returns {Promise<string[]>} A promise that resolves to an array of hash values for the join VCs.
   */
  async getHashListOfJoinVC(didAddress) {
    if(this.trace) {
      console.log('DidStoreTeamJoin::getHashListOfJoinVC::didAddress=:<',didAddress,'>');
    }
    const hashList = [];
    const store3Objects = await this.db.verified.where('did').equals(didAddress).toArray();
    if(this.trace) {
      console.log('DidStoreTeamJoin::getHashListOfJoinVC::store3Objects=:<',store3Objects,'>');
    }
    for(const storeObject of store3Objects) {
      if(this.trace) { 
        console.log('DidStoreTeamJoin::getHashListOfJoinVC::storeObject=:<',storeObject,'>');
      }
      hashList.push(storeObject.hashVC);
    }
    if(this.trace) {
      console.log('DidStoreTeamJoin::getHashListOfJoinCR::hashList=:<',hashList,'>');
    }
    return hashList;
  }

  /**
   * Retrieves a verified credential (VC) from the database based on the provided DID address and hash.
   *
   * @param {string} didAddress - The DID address to search for.
   * @param {string} hashVC - The hash of the verified credential to search for.
   * @returns {Promise<Object|null>} - A promise that resolves to the store object if found, otherwise null.
   */
  async getJoinVCByAddreAndHash(didAddress,hashVC) {
    if(this.trace) {
      console.log('DidStoreTeamJoin::getJoinVCByAddreAndHash::didAddress=:<',didAddress,'>');
      console.log('DidStoreTeamJoin::getJoinVCByAddreAndHash::hashVC=:<',hashVC,'>');
    }
    const filter = {
      did: didAddress,
      hashVC: hashVC
    };
    const storeObject = await this.db.verified.where(filter).first();
    if(this.trace) {
      console.log('DidStoreTeamJoin::getJoinVCByAddreAndHash::storeObject=:<',storeObject,'>');
    }
    if(storeObject) {
      return storeObject;
    }
    return null;
  }

  /**
   * Moves tentative objects to the workspace if they are not already present in the 'done' or 'inProgress' collections.
   * 
   * This function performs the following steps:
   * 1. Retrieves all tentative objects from the database.
   * 2. Logs the tentative objects if tracing is enabled.
   * 3. Iterates over each tentative object and checks if it exists in the 'done' or 'inProgress' collections.
   * 4. If the object does not exist in either collection, it calls `putCredReq` to process the tentative object.
   * 5. Logs the tentative object and hint object at various stages if tracing is enabled.
   * 6. Deletes all tentative objects from the 'tentative' collection after processing.
   * 
   * @async
   * @function moveTentativeCR2Workspace
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  async moveTentativeCR2Workspace() {
    const tentativeObjects = await this.db.tentative.toArray();
    if(this.trace) {
      console.log('DidStoreTeamJoin::moveTentativeCR2Workspace::tentativeObjects=:<',tentativeObjects,'>');
    }
    for(const tentativeObject of tentativeObjects) {
      if(this.trace) {
        console.log('DidStoreTeamJoin::moveTentativeCR2Workspace::tentativeObject=:<',tentativeObject,'>');
      }
      const filter = {
        did: tentativeObject.did,
        hashCR: tentativeObject.hashRC
      };  
      let hintObject = await this.db.done.where(filter).first();
      if(this.trace) {
        console.log('DidStoreTeamJoin::moveTentativeCR2Workspace::hintObject=:<',hintObject,'>');
      }
      if(hintObject) {
        continue;
      }
      hintObject = await this.db.inProgress.where(filter).first();
      if(this.trace) {
        console.log('DidStoreTeamJoin::moveTentativeCR2Workspace::hintObject=:<',hintObject,'>');
      }
      if(hintObject) {
        continue;
      }
      await this.putCredReq(tentativeObject);
    }
    for(const tentativeObject of tentativeObjects) {
      if(this.trace) {
        console.log('DidStoreTeamJoin::moveTentativeCR2Workspace::tentativeObject=:<',tentativeObject,'>');
      }
      await this.db.tentative
      .where('hashCR').equals(tentativeObject.hashCR)
      .delete();
    }
    if(isNode) {
      await this.wrapper.exportData();
    }
  }

  /**
   * Moves a tentative verifiable credential (VC) to the workspace.
   * 
   * This function searches for a tentative VC in the database using the provided filter,
   * and if found, it saves the VC to the workspace and deletes the tentative VC from the database.
   * 
   * @param {Object} storedTentativeVC - The tentative verifiable credential to be moved.
   * @param {string} storedTentativeVC.did - The decentralized identifier (DID) of the VC.
   * @param {string} storedTentativeVC.hashCR - The hash of the credential request.
   * @param {string} storedTentativeVC.hashVC - The hash of the verifiable credential.
   * 
   * @returns {Promise<number>} - The number of deleted records from the tentative VC database.
   */
  async moveTentativeVC2Workspace(storedTentativeVC) {
    if(this.trace) {
      console.log('DidStoreTeamJoin::moveTentativeVC2Workspace::storedTentativeVC=:<',storedTentativeVC,'>');
    }
    const filter = {
      did: storedTentativeVC.did,
      hashCR: storedTentativeVC.hashCR,
      hashVC: storedTentativeVC.hashVC,
    };  
    if(this.trace) {
      console.log('DidStoreTeamJoin::moveTentativeVC2Workspace::filter=:<',filter,'>');
    }
    const hintObject = await this.db.vcTentative.where(filter).first();
    if(this.trace) {
      console.log('DidStoreTeamJoin::moveTentativeVC2Workspace::hintObject=:<',hintObject,'>');
    }
    if(!hintObject) {
      return;
    }
    const saveObject = JSON.parse(JSON.stringify(hintObject));
    delete saveObject.autoId;
    await this.putVerifiableCredential(saveObject);
    const result = await this.db.vcTentative.where(filter).delete();
    if(this.trace) {
      console.log('DidStoreTeamJoin::moveTentativeVC2Workspace::result=:<',result,'>');
    }
    if(isNode) {
      await this.wrapper.exportData();
    }
    return result;
  }

  /**
   * Compares two objects based on their `updated` property.
   *
   * @param {Object} a - The first object to compare.
   * @param {Object} b - The second object to compare.
   * @returns {number} - Returns -1 if `a.updated` is less than `b.updated`, 
   *                     1 if `a.updated` is greater than `b.updated`, 
   *                     and 0 if they are equal.
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

import {
  DidStoreDocument,
  DidStoreManifest,
  DidStoreJoin
} from './otmc.did.document.store.js';

/**
*
*/
export class DidResolver {
  constructor() {
    this.trace = true;;
    this.debug = true;
  }
  async resolver(didAddress){
    if(this.trace) {
      console.log('DidResolver::resolver::didAddress=:<',didAddress,'>');
    }    
  }
  async store(didDoc){
    
  }
}

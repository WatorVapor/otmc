import { Base32 } from './edcrypto/base32.js';
import { EdUtil } from './edcrypto/edutils.js';
import { EdAuth } from './edcrypto/edauth.js';
import { DIDManifest } from './did/manifest.js';
import { StoreKey } from './otmc.const.js';
import { DIDSeedDocument,DIDGuestDocument } from './did/document.js';

/**
*
*/
export class DidDocument {
  constructor(parentRef) {
    this.trace = true;
    this.debug = true;
    this.otmc = parentRef.otmc;
    const self = this;
    setTimeout(() => {
      self.createMoudles_();
    },0);
  }
  loadDocument() {
    if(this.trace) {
      console.log('DidDocument::loadDocument::this.otmc=:<',this.otmc,'>');
    }
    this.checkEdcrypt_();
    try {
      const didDocStr = localStorage.getItem(StoreKey.didDoc);
      if(didDocStr) {
        const didDoc = JSON.parse(didDocStr);
        if(this.trace) {
          console.log('DidDocument::loadDocument::didDoc=:<',didDoc,'>');
        }
        this.otmc.emit('did:document',didDoc);
        this.didDoc_ = didDoc;
      }
      const manifestStr = localStorage.getItem(StoreKey.manifest);
      if(manifestStr) {
        const manifest = JSON.parse(manifestStr);
        if(this.trace) {
          console.log('DidDocument::loadDocument::manifest=:<',manifest,'>');
        }
        this.otmc.emit('did:manifest',manifest);
        this.otmc.sm.actor.send('did:document_manifest');
        this.didManifest_ = manifest;
      }      
    } catch(err) {
      console.log('DidDocument::loadDocument::err=:<',err,'>');
    }
  }
  createSeed() {
    if(this.trace) {
      console.log('DidDocument::createSeed::this.otmc=:<',this.otmc,'>');
    }
    this.checkEdcrypt_();
    this.seed = new DIDSeedDocument(this.auth,this.recovery);
    if(this.trace) {
      console.log('DidDocument::createSeed::this.seed=:<',this.seed,'>');
    }
    const address = this.seed.address();
    if(this.trace) {
      console.log('DidDocument::createSeed::address=:<',address,'>');
    }
    const documentObj = this.seed.document();
    if(this.trace) {
      console.log('DidDocument::createSeed::documentObj=:<',documentObj,'>');
    }
    localStorage.setItem(StoreKey.didDoc,JSON.stringify(documentObj));
    const manifest = DIDManifest.rule();
    localStorage.setItem(StoreKey.manifest,JSON.stringify(manifest));
    return documentObj;
  }
  createJoinAsAuth(id) {
    if(this.trace) {
      console.log('DidDocument::createJoinAsAuth::id=:<',id,'>');
      console.log('DidDocument::createJoinAsAuth::this.otmc=:<',this.otmc,'>');
    }
    this.checkEdcrypt_();
    this.guest = new DIDGuestDocument(id,this.auth);
    if(this.trace) {
      console.log('DidDocument::createJoinAsAuth::this.guest=:<',this.guest,'>');
    }
    const documentObj = this.guest.document();
    if(this.trace) {
      console.log('DidDocument::createJoinAsAuth::documentObj=:<',documentObj,'>');
    }
    localStorage.setItem(StoreKey.didDoc,JSON.stringify(documentObj));
    return documentObj;
  }
  
  checkEdcrypt_() {
    if(!this.auth || !this.recovery) {
      this.createMoudles_();
    }
  }
  
  createMoudles_() {
    if(this.trace) {
      console.log('DidDocument::createMoudles_::this.otmc=:<',this.otmc,'>');
    }
    if(!this.otmc.edcrypt.authKey) {
      console.log('DidDocument::createMoudles_::this.otmc.edcrypt=:<',this.otmc.edcrypt,'>');
      return;
    }
    if(!this.otmc.edcrypt.recoveryKey) {
      console.log('DidDocument::createMoudles_::this.otmc.edcrypt=:<',this.otmc.edcrypt,'>');
      return;
    }
    this.base32 = new Base32();
    this.util = new EdUtil(this.base32);
    this.auth = new EdAuth(this.otmc.edcrypt.authKey,this.util);
    this.recovery = new EdAuth(this.otmc.edcrypt.recoveryKey,this.util);
    if(this.trace) {
      console.log('DidDocument::createMoudles_::this.auth=:<',this.auth,'>');
    }
    if(this.trace) {
      console.log('DidDocument::createMoudles_::this.recovery=:<',this.recovery,'>');
    }
  }
}

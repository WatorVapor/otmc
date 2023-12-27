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
        this.otmc.sm.actor.send({type:'did:document_manifest'});
        this.didManifest_ = manifest;
      } else {
        this.otmc.sm.actor.send({type:'did:document'});
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
  createSyncDid() {
    this.checkEdcrypt_();
    const role = 'seed';
    const prefixDidToTopic = this.didDoc_.id.replaceAll(':','/')
    const syncDid = {
      topic:`${prefixDidToTopic}/${this.auth.address()}/sys/did/${role}/store`,
      did:this.didDoc_,
    };
    if(this.didManifest_) {
      syncDid.manifest = this.didManifest_;
    }
    if(this.trace) {
      console.log('DidDocument::syncDidDocument::syncDid=:<',syncDid,'>');
    }
    const syncDidSigned = this.auth.sign(syncDid);
    if(this.trace) {
      console.log('DidDocument::syncDidDocument::syncDidSigned=:<',syncDidSigned,'>');
    }
    return syncDidSigned;
  }

  requestJoinDid() {
    // 0:"did/otmc/otmsnaftnd45lzlcdrsqpr73zzst3okf/otm6mefe2b6jqyypd2etnyxj3ho56km6/sys/did/invitation/#"
    if(this.trace) {
      console.log('DidDocument::requestJoinDid::this.otmc=:<',this.otmc,'>');
    }
    this.checkEdcrypt_();    
    const role = 'invitation';
    const prefixDidToTopic = this.didDoc_.id.replaceAll(':','/')
    const joinDid = {
      topic:`${prefixDidToTopic}/${this.auth.address()}/sys/did/${role}/join`,
      did:this.didDoc_,
    };
    if(this.trace) {
      console.log('DidDocument::requestJoinDid::joinDid=:<',joinDid,'>');
    }
    const joinDidSigned = this.auth.sign(joinDid);
    if(this.trace) {
      console.log('DidDocument::requestJoinDid::joinDidSigned=:<',joinDidSigned,'>');
    }
    return joinDidSigned;
  }
  onInvitationJoinRequest(joinDid,joinAddress) {
    if(this.trace) {
      console.log('DidDocument::onInvitationJoinRequest::this.otmc=:<',this.otmc,'>');
      console.log('DidDocument::onInvitationJoinRequest::joinDid=:<',joinDid,'>');
      console.log('DidDocument::onInvitationJoinRequest::joinAddress=:<',joinAddress,'>');
    }
    this.checkEdcrypt_();    
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

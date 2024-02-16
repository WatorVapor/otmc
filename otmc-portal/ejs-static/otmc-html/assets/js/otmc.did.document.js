import { Base32 } from './edcrypto/base32.js';
import { EdUtil } from './edcrypto/edutils.js';
import { EdAuth } from './edcrypto/edauth.js';
import { DIDManifest } from './did/manifest.js';
import { StoreKey } from './otmc.const.js';
import { DIDSeedDocument, DIDGuestDocument, DIDExpandDocument, DIDAscentDocument } from './did/document.js';

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
      const results = this.auth.verifyDid(this.didDoc_);
      if(this.trace) {
        console.log('DidDocument::loadDocument::results=:<',results,'>');
      }
      let role = false;
      if(this.didManifest_) {
        role = this.judgeDidProofChain(results.proofList,this.didDoc_.id,this.didManifest_.diddoc);
      } else {
        role = this.judgeDidProofChain(results.proofList,this.didDoc_.id);
      }
      if(this.trace) {
        console.log('DidDocument::loadDocument::role=:<',role,'>');
      }
      this.role_ = role;
      const joinStr = localStorage.getItem(StoreKey.invitation.join);
      if(joinStr) {
        const joinList = JSON.parse(joinStr);
        this.joinList_ = JSON.parse(joinStr);
        if(this.trace) {
          console.log('DidDocument::loadDocument::joinList=:<',joinList,'>');
        }
        this.otmc.emit('didteam:joinLoaded',joinList);
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
    let role = 'guest';
    switch (this.role_) {
      case 'auth.proof.by.seed':
        role = 'seed';
        break;
      case 'auth.proof.by.auth':
        role = 'auth';
        break;
      default:
        break;
    }
    const prefixDidToTopic = this.didDoc_.id.replaceAll(':','/')
    const syncDid = {
      topic:`${prefixDidToTopic}/${this.auth.address()}/sys/did/document/${role}/store`,
      did:this.didDoc_,
    };
    if(this.trace) {
      console.log('DidDocument::syncDidDocument::syncDid=:<',syncDid,'>');
    }
    const syncDidSigned = this.auth.sign(syncDid);
    if(this.trace) {
      console.log('DidDocument::syncDidDocument::syncDidSigned=:<',syncDidSigned,'>');
    }
    return syncDidSigned;
  }

  createSyncManifest() {
    if(!this.didManifest_) {
      return false;
    }
    this.checkEdcrypt_();
    let role = 'guest';
    switch (this.role_) {
      case 'auth.proof.by.seed':
        role = 'seed';
        break;
      case 'auth.proof.by.auth':
        role = 'auth';
        break;
      default:
        break;
    }
    const prefixDidToTopic = this.didDoc_.id.replaceAll(':','/')
    const syncManifest = {
      topic:`${prefixDidToTopic}/${this.auth.address()}/sys/did/manifest/${role}/store`,
      manifest:this.didManifest_,
    };
    if(this.trace) {
      console.log('DidDocument::createSyncManifest::syncManifest=:<',syncManifest,'>');
    }
    const syncManifestSigned = this.auth.sign(syncManifest);
    if(this.trace) {
      console.log('DidDocument::createSyncManifest::syncManifestSigned=:<',syncManifestSigned,'>');
    }
    return syncManifestSigned;
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
    
    const joinStr = localStorage.getItem(StoreKey.invitation.join);
    let joinList = {};
    if(joinStr) {
      joinList = JSON.parse(joinStr);
      if(this.trace) {
        console.log('DidDocument::onInvitationJoinRequest::joinList=:<',joinList,'>');
      }
    }
    joinList[joinAddress] = joinDid;
    localStorage.setItem(StoreKey.invitation.join,JSON.stringify(joinList,undefined,2));
    this.joinList_ = JSON.parse(JSON.stringify(joinList));    
    this.otmc.emit('didteam:joinLoaded',joinList);
  }
  acceptInvitation(address) {
    if(this.trace) {
      console.log('DidDocument::acceptInvitation::this.otmc=:<',this.otmc,'>');
      console.log('DidDocument::acceptInvitation::this.joinList_=:<',this.joinList_,'>');
      console.log('DidDocument::acceptInvitation::address=:<',address,'>');
    }
    this.checkEdcrypt_();
    const joinInvitation = this.joinList_[address];
    if(!joinInvitation) {
      return false;
    }
    if(this.trace) {
      console.log('DidDocument::acceptInvitation::joinInvitation=:<',joinInvitation,'>');
    }
    const results = this.auth.verifyDid(joinInvitation);
    if(this.trace) {
      console.log('DidDocument::acceptInvitation::results=:<',results,'>');
    }
    let roleInvitation = false;
    if(this.didManifest_) {
      roleInvitation = this.judgeDidProofChain(results.proofList,joinInvitation.id,this.didManifest_.diddoc);
    } else {
      roleInvitation = this.judgeDidProofChain(results.proofList,joinInvitation.id);      
    }
    if(this.trace) {
      console.log('DidDocument::acceptInvitation::roleInvitation:=<',roleInvitation,'>');
    }
    const nextDid = JSON.parse(JSON.stringify(this.didDoc_));
    if(this.trace) {
      console.log('DidDocument::acceptInvitation::nextDid:=<',nextDid,'>');
    }
    nextDid.updated = (new Date).toISOString();
    if(joinInvitation.verificationMethod && joinInvitation.verificationMethod.length > 0) {
      nextDid.verificationMethod.push(joinInvitation.verificationMethod[0]);
    }
    switch (roleInvitation) {
      case 'auth.proof.by.seed':
      {
      }
      case 'auth.proof.by.none':
      {
        if(joinInvitation.authentication && joinInvitation.authentication.length > 0) {
          nextDid.authentication.push(joinInvitation.authentication[0]);
        }        
      }
      case 'capability.proof.by.seed':
      {
      }
      case 'capability.proof.by.none':
      {
        if(joinInvitation.capabilityInvocation && joinInvitation.capabilityInvocation.length > 0) {
          nextDid.capabilityInvocation.push(joinInvitation.capabilityInvocation[0]);
        }        
      }
      default:
      {
        console.log('DidDocument::acceptInvitation::roleInvitation:=<',roleInvitation,'>');
      }
    }
    if(nextDid.verificationMethod) {
      nextDid.verificationMethod = this.removeDuplicates(nextDid.verificationMethod);
    }
    if(nextDid.authentication) {
      nextDid.authentication = this.removeDuplicates(nextDid.authentication);
    }
    if(nextDid.capabilityInvocation) {
      nextDid.capabilityInvocation = this.removeDuplicates(nextDid.capabilityInvocation);
    }

    this.expand = new DIDExpandDocument(nextDid,this.auth);
    if(this.trace) {
      console.log('DidDocument::acceptInvitation::this.expand:=<',this.expand,'>');
    }
    const documentObj = this.expand.document();
    localStorage.setItem(StoreKey.didDoc,JSON.stringify(documentObj));

    const role = 'invitation';
    const prefixDidToTopic = this.didDoc_.id.replaceAll(':','/')
    const acceptDid = {
      topic:`${prefixDidToTopic}/${address}/sys/did/${role}/accept`,
      did:documentObj,
    };
    if(this.trace) {
      console.log('DidDocument::acceptInvitation::acceptDid=:<',acceptDid,'>');
    }
    const acceptDidSigned = this.auth.sign(acceptDid);
    if(this.trace) {
      console.log('DidDocument::acceptInvitation::acceptDidSigned=:<',acceptDidSigned,'>');
    }
    this.loadDocument();
    return acceptDidSigned;
  }

  rejectInvitation(address) {
    if(this.trace) {
      console.log('DidDocument::rejectInvitation::this.otmc=:<',this.otmc,'>');
      console.log('DidDocument::rejectInvitation::address=:<',address,'>');
    }
    this.checkEdcrypt_();

    const role = 'invitation';
    const prefixDidToTopic = this.didDoc_.id.replaceAll(':','/')
    const rejectDid = {
      topic:`${prefixDidToTopic}/${this.auth.address()}/sys/did/${role}/reject`,
      did:this.didDoc_,
    };
    if(this.trace) {
      console.log('DidDocument::acceptInvitation::rejectDid=:<',rejectDid,'>');
    }
    const rejectDidSigned = this.auth.sign(rejectDid);
    if(this.trace) {
      console.log('DidDocument::acceptInvitation::rejectDidSigned=:<',rejectDidSigned,'>');
    }
    return rejectDidSigned;
  }

  onInvitationAcceptReply(acceptDid,acceptAddress) {
    if(this.trace) {
      console.log('DidDocument::onInvitationAcceptReply::this.otmc=:<',this.otmc,'>');
      console.log('DidDocument::onInvitationAcceptReply::acceptDid=:<',acceptDid,'>');
      console.log('DidDocument::onInvitationAcceptReply::acceptAddress=:<',acceptAddress,'>');
    }
    this.checkEdcrypt_();
    const baseDid = JSON.parse(JSON.stringify(acceptDid));
    this.based = new DIDAscentDocument(baseDid,this.auth);
    if(this.trace) {
      console.log('DidDocument::onInvitationAcceptReply::this.based:=<',this.based,'>');
    }
    const documentObj = this.based.document();
    if(this.trace) {
      console.log('DidDocument::onInvitationAcceptReply::documentObj:=<',documentObj,'>');
    }

    localStorage.setItem(StoreKey.didDoc,JSON.stringify(documentObj));
    this.otmc.mqtt.freshMqttJwt();
    this.loadDocument();
    
    const self = this;
    setTimeout(() => {
      self.syncAscentDid_(documentObj);
    },1000);

  }
  
  onDidDocumentStore(incomeDid,acceptAddress) {
    if(this.trace) {
      console.log('DidDocument::onDidDocumentStore::this.otmc=:<',this.otmc,'>');
      console.log('DidDocument::onDidDocumentStore::incomeDid=:<',incomeDid,'>');
      console.log('DidDocument::onDidDocumentStore::acceptAddress=:<',acceptAddress,'>');
    }
    this.checkEdcrypt_();
    const inclomeDidClone = JSON.parse(JSON.stringify(incomeDid));
    if(this.trace) {
      console.log('DidDocument::onDidDocumentStore::inclomeDidClone:=<',inclomeDidClone,'>');
    }
    const storedDidStr = localStorage.getItem(StoreKey.didDoc);
    if(!storedDidStr) {
      console.log('DidDocument::onDidDocumentStore::storedDidStr:=<',storedDidStr,'>');
      return;
    }
    const storedDid = JSON.parse(storedDidStr);
    if(this.trace) {
      console.log('DidDocument::onDidDocumentStore::storedDid:=<',storedDid,'>');
    }
    const results = this.auth.verifyDid(incomeDid);
    if(this.trace) {
      console.log('DidDocument::onDidDocumentStore::results=:<',results,'>');
    }
    let roleInclome = false;
    if(this.didManifest_) {
      roleInclome = this.judgeDidProofChain(results.proofList,inclomeDidClone.id,this.didManifest_.diddoc);
    } else {
      roleInclome = this.judgeDidProofChain(results.proofList,inclomeDidClone.id);      
    }
    if(this.trace) {
      console.log('DidDocument::onDidDocumentStore::roleInclome:=<',roleInclome,'>');
    }
    
  }
  
  
  
  
  syncAscentDid_(documentObj,acceptAddress) {
    const role = 'invitation';
    const prefixDidToTopic = this.didDoc_.id.replaceAll(':','/')
    const syncDid = {
      topic:`${prefixDidToTopic}/${acceptAddress}/sys/did/${role}/sync`,
      did:documentObj,
    };
    if(this.trace) {
      console.log('DidDocument::syncAscentDid_::syncDid=:<',syncDid,'>');
    }
    const syncDidSigned = this.auth.sign(syncDid);
    if(this.trace) {
      console.log('DidDocument::syncAscentDid_::syncDidSigned=:<',syncDidSigned,'>');
    }    
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
  
  judgeDidProofChain(proofList,did,manifest) {
    const myAddress = this.auth.address();
    if(this.trace) {
      console.log('DidDocument::judgeDidProofChain::proofList=<',proofList,'>');
      console.log('DidDocument::judgeDidProofChain::did=<',did,'>');
      console.log('DidDocument::judgeDidProofChain::myAddress=<',myAddress,'>');
      console.log('DidDocument::judgeDidProofChain::manifest=<',manifest,'>');
    }
    const didKey = did.replace('did:otmc:','');
    if(this.trace) {
      console.log('DidDocument::judgeDidProofChain::didKey=<',didKey,'>');
    }
    if(myAddress === didKey) {
      return 'auth.proof.by.seed';      
    }
    if(proofList.authProof) {
      if(proofList.authProof.includes(myAddress)) {
        return 'auth.proof.by.auth';
      }
      return 'auth.proof.by.none';
    }
    if(proofList.capabilityProof) {
      if(proofList.capabilityProof.includes(didKey)) {
        return 'capability.proof.by.seed';
      }
      if(proofList.capabilityProof.includes(myAddress)) {
        return 'capability.proof.by.auth';
      }
      return 'capability.proof.by.none';
    }
    return 'none.proof';
  }
  removeDuplicates(arrObject) {
    if(this.trace) {
      console.log('DidDocument::removeDuplicates::arrObject=<',arrObject,'>');
    }
    const jsonObject = arrObject.map(JSON.stringify);
    const uniqueSet = new Set(jsonObject);
    const uniqueArray = Array.from(uniqueSet).map(JSON.parse);
    if(this.trace) {
      console.log('DidDocument::removeDuplicates::uniqueArray=<',uniqueArray,'>');
    }
    return uniqueArray;
  }
  
}

import nacl from 'tweetnacl-es6';
import * as jsDiff from 'json-diff';
import {
  base58xmr,
  base58xrp,
  base32hex,
  base32crockford,
  base64nopad,
  base64url,
  base64urlnopad,
} from '@scure/base';

import { md5, sha1, sha512, sha3 } from 'hash-wasm';

import { Base32 } from './edcrypto/base32.js';
import { EdUtil } from './edcrypto/edutils.js';
import { EdAuth } from './edcrypto/edauth.js';
import { DIDManifest } from './did/manifest.js';
import { StoreKey } from './otmc.const.js';
import { 
  DIDSeedDocument,
  DIDGuestGuestDocument,
  DIDGuestAuthDocument,
  DIDGuestCapabilityDocument,
  DIDExpandDocument,
  DIDAscentDocument,
  DIDMergeDocument
} from './did/document.js';
import {DidDocStateMachine} from './otmc.did.stm.docstate.js';
import {DidRuntimeStateMachine} from './otmc.did.stm.runtime.js';
import { DidResolver } from './otmc.did.resolver.js';
import { 
  DIDCredentialRequestJoinController,
  DIDCredentialRequestJoinTeamMate
} from './did/credentialRequest.js';

import { 
  DIDVerifiableCredential
} from './did/verifiableCredential.js';



const includesAnyByCreator = (setArr,value ) => setArr.some(attr => value === attr.creator);


/**
*
*/
export class DidDocument {
  constructor(eeInternal,eeOut) {
    this.trace0 = true;
    this.trace1 = true;
    this.trace2 = true;
    this.trace = true;;
    this.debug = true;
    this.eeInternal = eeInternal;
    this.eeOut = eeOut;
    this.base32 = new Base32();
    this.util = new EdUtil(this.base32,nacl);
    this.ListenEventEmitter_();
    this.mqttOption = {
      qos:0,
      nl:true
    };
    this.docState = new DidDocStateMachine(this.eeInternal);
    this.rtState = new DidRuntimeStateMachine(this.eeInternal);
    this.resolver = new DidResolver(this.eeInternal);
    this.evidenceAuth = {};
    this.evidenceCapability = {};
    this.allEvidenceChain = {};
  }
  
  async createModule_() {
    if(this.trace) {
      console.log('DidDocument::createModule_::this.otmc.isNode=:<',this.otmc.isNode,'>');
    }
    if(this.otmc.isNode) {
      this.fs = await import('fs');
    } else {
      this.fs = false;
    }
    if(this.trace0) {
      console.log('DidDocument::createModule_::this.fs=:<',this.fs,'>');
    }
    this.eeInternal.emit('OtmcStateMachine.actor.send',{type:'did:module_ready'});
  }
  
  ListenEventEmitter_() {
    if(this.trace) {
      console.log('DidDocument::ListenEventEmitter_::base58xmr=:<',base58xmr,'>');
      console.log('DidDocument::ListenEventEmitter_::base32crockford=:<',base32crockford,'>');
      console.log('DidDocument::ListenEventEmitter_::base64urlnopad=:<',base64urlnopad,'>');
    }
    if(this.trace) {
      console.log('DidDocument::ListenEventEmitter_::sha3=:<',sha3,'>');
    }
    if(this.trace0) {
      console.log('DidDocument::ListenEventEmitter_::this.eeInternal=:<',this.eeInternal,'>');
    }
    const self = this;
    this.eeInternal.on('did.module.load',(authKey)=>{
      if(self.trace) {
        console.log('DidDocument::ListenEventEmitter_::authKey=:<',authKey,'>');
      }
      self.createModule_();
    });
    this.eeInternal.on('did.edcrypt.authKey',(authKey)=>{
      if(self.trace) {
        console.log('DidDocument::ListenEventEmitter_::authKey=:<',authKey,'>');
      }
      self.auth = new EdAuth(authKey,self.util);
      if(self.trace0) {
        console.log('DidDocument::ListenEventEmitter_::self.auth=:<',self.auth,'>');
      }
      const evt = {
        otmc:self.otmc,
        base32:self.base32,
        util:self.util,
        auth:self.auth,
        did:this,
      };
      self.eeInternal.emit('sys.authKey.ready',evt);
      self.createModule_();
    });
    this.eeInternal.on('did.edcrypt.recoveryKey',(recoveryKey)=>{
      if(self.trace) {
        console.log('DidDocument::ListenEventEmitter_::recoveryKey=:<',recoveryKey,'>');
      }
      self.recovery = new EdAuth(recoveryKey,self.util);
      if(self.trace0) {
        console.log('DidDocument::ListenEventEmitter_::self.recovery=:<',self.recovery,'>');
      }
      const evt = {
        otmc:self.otmc,
        recovery:self.recovery,
      };
      self.eeInternal.emit('mqtt.jwt.agent.recoveryKey.ready',evt);
    });
    this.eeInternal.on('did.create.seed.root',(evt)=>{
      if(self.trace) {
        console.log('DidDocument::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.createSeedRoot(evt.controls,evt.root);
    });
    this.eeInternal.on('did.create.seed.end.entity',(evt)=>{
      if(self.trace) {
        console.log('DidDocument::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.createSeedEndEntity(evt.controls);
    });
    this.eeInternal.on('did.vcr.join.team',(evt)=>{
      if(self.trace) {
        console.log('DidDocument::ListenEventEmitter_::evt=:<',evt,'>');
      }
      if(evt.controller) {
        self.joinRequest2Controller();
      } else {
        self.joinRequest2TeamMate();          
      }
    });
    this.eeInternal.on('did.join.accept.request',(evt)=>{
      if(self.trace) {
        console.log('DidDocument::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.acceptRequest(evt.storeHash);
    });
    this.eeInternal.on('did.join.reject.request',(evt)=>{
      if(self.trace) {
        console.log('DidDocument::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.rejectRequest(evt.storeHash);
    });
    this.eeInternal.on('did.join.as.auth',(evt)=>{
      if(self.trace) {
        console.log('DidDocument::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.createJoinAsAuth(evt.did);
    });

    this.eeInternal.on('did.loadDocument',(evt)=>{
      if(self.trace0) {
        console.log('DidDocument::ListenEventEmitter_::evt=:<',evt,'>');
      }
      if(self.trace0) {
        console.log('DidDocument::ListenEventEmitter_::self.otmc=:<',self.otmc,'>');
      }
      self.loadDocument();
    });
    this.eeInternal.on('did.evidence.load.storage',async (evt)=>{
      if(self.trace0) {
        console.log('DidDocument::ListenEventEmitter_::evt=:<',evt,'>');
      }
      await self.loadEvidenceChain_();
      if(self.trace0) {
        console.log('DidDocument::ListenEventEmitter_::this.allEvidenceChain=:<',this.allEvidenceChain,'>');
      }
      for(const chainId in this.allEvidenceChain) {
        if(self.trace0) {
          console.log('DidDocument::ListenEventEmitter_::chainId=:<',chainId,'>');
        }
        const manifest = await self.loadDidRuleFromManifest_(chainId);
        if(self.trace0) {
          console.log('DidDocument::ListenEventEmitter_::manifest=:<',manifest,'>');
        }
        this.allEvidenceChain[chainId].manifest = manifest;
        const evidence = this.allEvidenceChain[chainId].did;
        const evidenceChain = {
          manifest:manifest,
          evidence:evidence,
        };
        self.eeInternal.emit('did:document:evidence.chain',evidenceChain);
      }
      self.eeInternal.emit('did:document:evidence.complete',{});
    });
    this.eeInternal.on('did.evidence.auth',(evt)=>{
      if(self.trace0) {
        console.log('DidDocument::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.evidenceAuth = Object.assign({}, evt);
      if(self.trace0) {
        console.log('DidDocument::ListenEventEmitter_::self.evidenceAuth=:<',self.evidenceAuth,'>');
      }
      self.eeOut.emit('did:team:evidence.auth',self.evidenceAuth);
    });
    this.eeInternal.on('did.evidence.capability',(evt)=>{
      if(self.trace0) {
        console.log('DidDocument::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.evidenceCapability = Object.assign({}, evt);
      if(this.trace0) {
        console.log('DidDocument::ListenEventEmitter_::self.evidenceCapability=:<',self.evidenceCapability,'>');
      }
    });
    this.eeInternal.on('otmc.did.client.storage',(evt)=>{
      if(self.trace0) {
        console.log('DidDocument::ListenEventEmitter_::evt=:<',evt,'>');
      }
      setTimeout(()=>{
        self.syncDidDocument_();
      },1);
    });
    this.eeInternal.on('did.document.merge',(evt)=>{
      if(self.trace0) {
        console.log('DidDocument::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.mergeDidDocument(evt);
    });
  }

  syncDidDocument_(){
    if(this.trace) {
      console.log('DidDocument::syncDidDocument_::new Date()=:<',new Date(),'>');
    }
    if(this.trace) {
      console.log('DidDocument::syncDidDocument_::this.evidenceAuth=:<',this.evidenceAuth,'>');
    }
    const uploadManifest = this.createSyncUploadManifest();
    if(this.trace) {
      console.log('DidDocument::syncDidDocument_::uploadManifest=:<',uploadManifest,'>');
    }
    if(uploadManifest) {
      this.eeInternal.emit('otmc.mqtt.publish',{msg:uploadManifest,option:this.mqttOption});
    }    
    const uploadDoc = this.createSyncUploadDid();
    if(this.trace) {
      console.log('DidDocument::syncDidDocument_::uploadDoc=:<',uploadDoc,'>');
    }
    this.eeInternal.emit('otmc.mqtt.publish',{msg:uploadDoc,option:this.mqttOption});


    const downloadManifest = this.createSyncDownloadManifest();
    if(this.trace) {
      console.log('DidDocument::syncDidDocument_::downloadManifest=:<',downloadManifest,'>');
    }
    if(downloadManifest) {
      this.eeInternal.emit('otmc.mqtt.publish',{msg:downloadManifest,option:this.mqttOption});
    }
    
    const downloadDoc = this.createSyncDownloadDid();
    if(this.trace) {
      console.log('DidDocument::syncDidDocument_::downloadDoc=:<',downloadDoc,'>');
    }
    this.eeInternal.emit('otmc.mqtt.publish',{msg:downloadDoc,option:this.mqttOption});

    const downloadInvitation = this.createSyncDownloadInvitation();
    if(this.trace) {
      console.log('DidDocument::syncDidDocument_::downloadInvitation=:<',downloadInvitation,'>');
    }
    if(downloadInvitation) {
      this.eeInternal.emit('otmc.mqtt.publish',{msg:downloadInvitation,option:this.mqttOption});
    }
  }

  
  async loadDocument() {
    if(this.trace0 && this.otmc.isNode) {
      console.log('DidDocument::loadDocument::fs=:<',fs,'>');
    }
    if(this.trace0) {
      console.log('DidDocument::loadDocument::this.eeInternal=:<',this.eeInternal,'>');
      console.log('DidDocument::loadDocument::this.otmc=:<',this.otmc,'>');
      console.log('DidDocument::loadDocument::this.auth=:<',this.auth,'>');
    }
    if(this.trace) {
      console.log('DidDocument::loadDocument::this.otmc.config=:<',this.otmc.config,'>');
    }
    this.checkEdcrypt_();
    try {
      const  didDoc = await this.resolver.resolver(this.auth.address());
      if(this.trace) {
        console.log('DidDocument::loadDocument::didDoc=:<',didDoc,'>');
      }
      this.eeOut.emit('did:document',didDoc);
      this.didDoc_ = didDoc;
      this.eeInternal.emit('did:document',{didDoc:this});

      if(this.didDoc_) {
        let manifest = await this.resolver.manifest(this.didDoc_.id);
        if(this.trace) {
          console.log('DidDocument::loadDocument::manifest=:<',manifest,'>');
        }
        if(manifest) {
          this.eeOut.emit('did:manifest',manifest);
          this.eeInternal.emit('OtmcStateMachine.actor.send',{type:'did:document_manifest'});
          this.didManifest_ = manifest;
        } else {
          this.eeInternal.emit('OtmcStateMachine.actor.send',{type:'did:document'});
        }
        const results = this.auth.verifyDid(this.didDoc_);
        if(this.trace) {
          console.log('DidDocument::loadDocument::results=:<',results,'>');
        }
        const joinList = await this.resolver.getJoinInProgress(this.didDoc_.id);
        if(joinList) {
          this.joinList_ = joinList;
          if(this.trace) {
            console.log('DidDocument::loadDocument::joinList=:<',joinList,'>');
          }
          this.eeOut.emit('didteam:joinLoaded',joinList);
        }
      }
    } catch(err) {
      console.error('DidDocument::loadDocument::err=:<',err,'>');
    }
  }
  createSeedRoot(controls,root) {
    const documentObj = this.createSeedRootDidDoc_(controls,root);
    if(this.trace) {
      console.log('DidDocument::createSeedRoot::documentObj=:<',documentObj,'>');
    }
    this.resolver.storeStableDid(documentObj);
    const manifest = DIDManifest.ruleChainGuestOpen(documentObj.id);
    this.resolver.storeManifest(manifest,documentObj.id);
    return documentObj;
  }
  createSeedEndEntity(controls) {
    const documentObj = this.createSeedRootDidDoc_(controls,false);
    if(this.trace) {
      console.log('DidDocument::createSeedEndEntity::documentObj=:<',documentObj,'>');
    }
    this.resolver.storeFickleDid(documentObj);
    const manifest = DIDManifest.ruleChainGuestOpen(documentObj.id);
    this.resolver.storeManifest(manifest,documentObj.id);
    return documentObj;
  }
  
  createJoinAsAuth(id) {
    if(this.trace) {
      console.log('DidDocument::createJoinAsAuth::id=:<',id,'>');
      console.log('DidDocument::createJoinAsAuth::this.otmc=:<',this.otmc,'>');
    }
    this.checkEdcrypt_();
    this.guest = new DIDGuestAuthDocument(id,this.auth);
    if(this.trace) {
      console.log('DidDocument::createJoinAsAuth::this.guest=:<',this.guest,'>');
    }
    const documentObj = this.guest.document();
    if(this.trace) {
      console.log('DidDocument::createJoinAsAuth::documentObj=:<',documentObj,'>');
    }
    this.resolver.storeFickleDid(documentObj);
    return documentObj;
  }

  mergeDidDocument(newDoc) {
    if(this.trace) {
      console.log('DidDocument::mergeDidDocument::newDoc=:<',newDoc,'>');
      console.log('DidDocument::mergeDidDocument::this.didDoc_=:<',this.didDoc_,'>');
    }
    const docDiff = jsDiff.diff(newDoc,this.didDoc_);
    if(this.trace) {
      console.log('DidDocument::mergeDidDocument::docDiff=:<',docDiff,'>');
    }
    if(!docDiff) {
      return false;
    }
    const creator = `${newDoc.id}#${this.auth.address()}`;
    const proofed = includesAnyByCreator(newDoc.proof,creator);
    if(this.trace) {
      console.log('DidDocument::mergeDidDocument:proofed=<',proofed,'>');
    }
    if(!proofed) {
      const nextDid = JSON.parse(JSON.stringify(newDoc));
      this.merge = new DIDMergeDocument(nextDid,this.auth);
      if(this.trace) {
        console.log('DidDocument::mergeDidDocument::this.merge:=<',this.merge,'>');
      }
      const documentObj = this.merge.document();
      if(this.trace) {
        console.log('DidDocument::mergeDidDocument::documentObj=:<',documentObj,'>');
      }
      if(this.otmc.isNode) {
        this.fs.writeFileSync(this.otmc.config.topDoc,JSON.stringify(documentObj,undefined,2));
      } else {
        localStorage.setItem(StoreKey.didDoc,JSON.stringify(documentObj));
      }
      return documentObj;
    } else {
      const documentObj = JSON.parse(JSON.stringify(newDoc));
      if(this.trace) {
        console.log('DidDocument::mergeDidDocument::documentObj=:<',documentObj,'>');
      }
      if(this.otmc.isNode) {
        this.fs.writeFileSync(this.otmc.config.topDoc,JSON.stringify(documentObj,undefined,2));
      } else {
        localStorage.setItem(StoreKey.didDoc,JSON.stringify(documentObj));
      }
      return documentObj;      
    }
  }
  updateManifest(manifest) {
    if(this.otmc.isNode) {
      this.fs.writeFileSync(this.otmc.config.topManifest,JSON.stringify(manifest,undefined,2));
    } else {
      localStorage.setItem(StoreKey.manifest,JSON.stringify(manifest));
    }
  }
  
  createSyncUploadDid() {
    this.checkEdcrypt_();
    if(this.trace) {
      console.log('DidDocument::createSyncUploadDid::this.evidenceAuth=:<',this.evidenceAuth,'>');
      console.log('DidDocument::createSyncUploadDid::this.evidenceCapability=:<',this.evidenceCapability,'>');
    }
    const role = this.getDidRole_();
    if(this.trace) {
      console.log('DidDocument::createSyncUploadDid::role=:<',role,'>');
    }
    const prefixDidToTopic = this.didDoc_.id.replaceAll(':','/')
    const syncDid = {
      topic:`${prefixDidToTopic}/${this.auth.address()}/sys/did/document/${role}/store`,
      did:this.didDoc_,
    };
    if(role === 'invitation') {
      syncDid.topic = `${prefixDidToTopic}/${this.auth.address()}/sys/did/invitation/store`;
    }
    if(this.trace) {
      console.log('DidDocument::createSyncUploadDid::syncDid=:<',syncDid,'>');
    }
    const syncDidSigned = this.auth.sign(syncDid);
    if(this.trace) {
      console.log('DidDocument::createSyncUploadDid::syncDidSigned=:<',syncDidSigned,'>');
    }
    this.resolver.store(syncDidSigned);
    return syncDidSigned;
  }

  createSyncDownloadDid() {
    this.checkEdcrypt_();
    const role = this.getDidRole_();
    if(this.trace) {
      console.log('DidDocument::createSyncDownloadDid::role=:<',role,'>');
    }
    const prefixDidToTopic = this.didDoc_.id.replaceAll(':','/')
    const syncDownload = {
      topic:`${prefixDidToTopic}/${this.auth.address()}/sys/did/document/request`,
    };
    if(role === 'invitation') {
      syncDownload.topic = `${prefixDidToTopic}/${this.auth.address()}/sys/did/invitation/document/request`;
    }
    if(role === 'capability') {
      syncDownload.topic = `${prefixDidToTopic}/${this.auth.address()}/sys/did/capability/document/request`;
    }
    if(this.trace) {
      console.log('DidDocument::createSyncDownloadDid::syncDownload=:<',syncDownload,'>');
    }
    const syncDownloadSigned = this.auth.sign(syncDownload);
    if(this.trace) {
      console.log('DidDocument::createSyncDownloadDid::syncDownloadSigned=:<',syncDownloadSigned,'>');
    }
    this.resolver.resolver(this.didDoc_.id);
    return syncDownloadSigned;
  }
  createSyncDownloadInvitation() {
    this.checkEdcrypt_();
    const role = this.getDidRole_();
    if(this.trace) {
      console.log('DidDocument::createSyncDownloadInvitation::role=:<',role,'>');
    }
    const prefixDidToTopic = this.didDoc_.id.replaceAll(':','/')
    const syncDid = {
      topic:`${prefixDidToTopic}/${this.auth.address()}/sys/did/invitation/request`,
    };
    if(role === 'invitation') {
      return false;
    }
    if(this.trace) {
      console.log('DidDocument::createSyncDownloadInvitation::syncDid=:<',syncDid,'>');
    }
    const syncDidSigned = this.auth.sign(syncDid);
    if(this.trace) {
      console.log('DidDocument::createSyncDownloadInvitation::syncDidSigned=:<',syncDidSigned,'>');
    }
    return syncDidSigned;
  }


  createSyncUploadManifest() {
    if(!this.didManifest_) {
      return false;
    }
    this.checkEdcrypt_();
    const role = this.getDidRole_();
    if(this.trace) {
      console.log('DidDocument::createSyncUploadManifest::role=:<',role,'>');
    }
    if(role === 'invitation') {
      return false;
    }
    const prefixDidToTopic = this.didDoc_.id.replaceAll(':','/')
    const syncManifest = {
      topic:`${prefixDidToTopic}/${this.auth.address()}/sys/did/manifest/${role}/store`,
      manifest:this.didManifest_,
    };
    if(this.trace) {
      console.log('DidDocument::createSyncUploadManifest::syncManifest=:<',syncManifest,'>');
    }
    const syncManifestSigned = this.auth.sign(syncManifest);
    if(this.trace) {
      console.log('DidDocument::createSyncUploadManifest::syncManifestSigned=:<',syncManifestSigned,'>');
    }
    return syncManifestSigned;
  }

  createSyncDownloadManifest() {
    this.checkEdcrypt_();
    const role = this.getDidRole_();
    if(this.trace) {
      console.log('DidDocument::createSyncDownloadManifest::role=:<',role,'>');
    }
    const prefixDidToTopic = this.didDoc_.id.replaceAll(':','/')
    const syncDownload = {
      topic:`${prefixDidToTopic}/${this.auth.address()}/sys/did/manifest/request`,
    };
    if(role === 'invitation') {
      syncDownload.topic = `${prefixDidToTopic}/${this.auth.address()}/sys/did/invitation/manifest/request`;
    }
    if(this.trace) {
      console.log('DidDocument::createSyncDownloadManifest::syncDownload=:<',syncDownload,'>');
    }
    const syncDidSigned = this.auth.sign(syncDownload);
    if(this.trace) {
      console.log('DidDocument::createSyncDownloadManifest::syncDidSigned=:<',syncDidSigned,'>');
    }
    return syncDidSigned;
  }

  getDidRole_() {
    let role = 'guest';
    if(this.trace) {
      console.log('DidDocument::getDidRole_::this.evidenceAuth=:<',this.evidenceAuth,'>');
      console.log('DidDocument::getDidRole_::this.evidenceCapability=:<',this.evidenceCapability,'>');
    }
    if(this.evidenceAuth.isSeed) {
      role = 'seed';
    } else if(this.evidenceAuth.bySeed) {
      role = 'auth';
    } else if(this.evidenceAuth.byAuth) {
      role = 'auth';
    } else if(this.evidenceAuth.byNone) {
      role = 'invitation';
    } else {
    }
    if(this.evidenceCapability.bySeed) {
      role = 'capability';
    } else if(this.evidenceCapability.byAuth) {
      role = 'capability';
    } else if(this.evidenceCapability.byNone) {
      role = 'invitation';
    } else {
    }
    if(this.trace) {
      console.log('DidDocument::getDidRole_::role=:<',role,'>');
    }
    return role;
  }


  joinRequest2Controller() {
    this.checkEdcrypt_();
    if(this.trace) {
      console.log('DidDocument::joinRequest2Controller::this.didDoc_=:<',this.didDoc_,'>');
    }
    const credReq = new DIDCredentialRequestJoinController(this.auth,this.didDoc_,this.util);
    if(this.trace) {
      console.log('DidDocument::joinRequest2Controller::credReq=:<',credReq,'>');
    }
    const credReqDoc = credReq.credential();
    if(this.trace) {
      console.log('DidDocument::joinRequest2Controller::credReqDoc=:<',credReqDoc,'>');
    }
    this.resolver.storeCredentialRequest(credReqDoc,this.didDoc_.id);
  }
  joinRequest2TeamMate() {
    if(this.trace) {
      console.log('DidDocument::joinRequest2TeamMate::this.otmc=:<',this.otmc,'>');
    }
    this.checkEdcrypt_();    
    const role = 'invitation';
    const prefixDidToTopic = this.didDoc_.id.replaceAll(':','/')
    const joinDid = {
      topic:`${prefixDidToTopic}/${this.auth.address()}/sys/did/${role}/join`,
      did:this.didDoc_,
    };
    if(this.trace) {
      console.log('DidDocument::joinRequest2TeamMate::joinDid=:<',joinDid,'>');
    }
    const joinDidSigned = this.auth.sign(joinDid);
    if(this.trace) {
      console.log('DidDocument::joinRequest2TeamMate::joinDidSigned=:<',joinDidSigned,'>');
    }
    return joinDidSigned;

  }
  async acceptRequest(storeHash) {
    if(this.trace) {
      console.log('DidDocument::acceptRequest::storeHash=:<',storeHash,'>');
    }
    const credReq = await this.resolver.getJoinCredRequest(storeHash);
    if(this.trace) {
      console.log('DidDocument::acceptRequest::credReq=:<',credReq,'>');
    }
    if(!credReq) {
      return null;
    }
    const goodCredReq = this.auth.verifyCredReq(credReq);
    if(this.trace) {
      console.log('DidDocument::acceptRequest::goodCredReq=:<',goodCredReq,'>');
    }
    if(!goodCredReq) {
      return null;
    }
    const did2VC = credReq.credentialRequest.claims.did;
    if(this.trace) {
      console.log('DidDocument::acceptRequest::did2VC=:<',did2VC,'>');
    }
    const didVC = new DIDVerifiableCredential(this.auth,this.didDoc_,this.util);
    if(this.trace) {
      console.log('DidDocument::acceptRequest::didVC=:<',didVC,'>');
    }
    const didVCDoc = didVC.verifiable(did2VC,storeHash);
    if(this.trace) {
      console.log('DidDocument::acceptRequest::didVCDoc=:<',didVCDoc,'>');
    }
    const results = await this.resolver.storeJoinVerifiableCredential(didVCDoc);
    if(this.trace) {
      console.log('DidDocument::acceptRequest::results=:<',results,'>');
    }
    if(results) {
      const didStoreLocal = didVCDoc.credentialSubject.did;
      if(this.trace) {
        console.log('DidDocument::acceptRequest::didStoreLocal=:<',didStoreLocal,'>');
      }
      await this.resolver.storeDid(didStoreLocal);
      const resultMark = await this.resolver.markDoneJoinCredRequest(storeHash);
      if(this.trace) {
        console.log('DidDocument::acceptRequest::resultMark=:<',resultMark,'>');
      }
    }
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
  async onInvitationJoinRequest(joinDid,joinAddress) {
    if(this.trace) {
      console.log('DidDocument::onInvitationJoinRequest::this.otmc=:<',this.otmc,'>');
      console.log('DidDocument::onInvitationJoinRequest::joinDid=:<',joinDid,'>');
      console.log('DidDocument::onInvitationJoinRequest::joinAddress=:<',joinAddress,'>');
    }
    this.checkEdcrypt_();
    const documentStr = JSON.stringify(joinDid);
    const didAddress = joinDid.id;
    if(this.trace) {
      console.log('DidDocument::onInvitationJoinRequest::didAddress=:<',didAddress,'>');
    }
    const storeKeyDid = `${didAddress}.${this.util.calcAddress(documentStr)}`;
    if(this.trace) {
      console.log('DidDocument::onInvitationJoinRequest::storeKeyDid=:<',storeKeyDid,'>');
    }
    if(this.otmc.isNode) {
      this.fs.writeFileSync(this.otmc.config.invitation,JSON.stringify(joinList,undefined,2));
    } else {
      this.didJoinStore.put(storeKeyDid, documentStr, LEVEL_OPT,(err)=>{
        if(this.trace) {
          console.log('DidDocument::onInvitationJoinRequest::err=:<',err,'>');
        }
      });
    }
    let joinList = await this.didJoinStore.getAll(didAddress);
    if(this.trace) {
      console.log('DidDocument::onInvitationJoinRequest::joinList=:<',joinList,'>');
    }
    this.eeOut.emit('didteam:joinLoaded',joinList);
  }
  acceptInvitation(address) {
    if(this.trace) {
      console.log('DidDocument::acceptInvitation::this.otmc=:<',this.otmc,'>');
      console.log('DidDocument::acceptInvitation::this.joinList_=:<',this.joinList_,'>');
      console.log('DidDocument::acceptInvitation::address=:<',address,'>');
    }
    this.checkEdcrypt_();
    const joinInvitation = JSON.parse(JSON.stringify(this.joinList_[address]));
    if(!joinInvitation) {
      return false;
    }
    if(this.trace) {
      console.log('DidDocument::acceptInvitation::joinInvitation=:<',joinInvitation,'>');
    }
    delete joinInvitation.invitationType;
    const results = this.auth.verifyDid(joinInvitation);
    if(this.trace) {
      console.log('DidDocument::acceptInvitation::results=:<',results,'>');
    }
    const nextDid = JSON.parse(JSON.stringify(this.didDoc_));
    if(this.trace) {
      console.log('DidDocument::acceptInvitation::nextDid:=<',nextDid,'>');
    }
    nextDid.updated = (new Date).toISOString();
    if(joinInvitation.verificationMethod && joinInvitation.verificationMethod.length > 0) {
      nextDid.verificationMethod.push(joinInvitation.verificationMethod[0]);
    }
    if(this.trace) {
      console.log('DidDocument::acceptInvitation::this.evidenceAuth:=<',this.evidenceAuth,'>');
      console.log('DidDocument::acceptInvitation::this.evidenceCapability:=<',this.evidenceCapability,'>');
    }
    if(this.evidenceAuth.isSeed || this.evidenceAuth.byAuth) {
      if(joinInvitation.authentication && joinInvitation.authentication.length > 0) {
        nextDid.authentication.push(joinInvitation.authentication[0]);
      }
      if(joinInvitation.capabilityInvocation && joinInvitation.capabilityInvocation.length > 0) {
        nextDid.capabilityInvocation.push(joinInvitation.capabilityInvocation[0]);
      }
    }
    /*
    if(this.evidenceCapability.byNone) {
      if(joinInvitation.capabilityInvocation && joinInvitation.capabilityInvocation.length > 0) {
        nextDid.capabilityInvocation.push(joinInvitation.capabilityInvocation[0]);
      }
    }
    */
    if(nextDid.verificationMethod) {
      nextDid.verificationMethod = this.removeDuplicates(nextDid.verificationMethod);
    }
    if(nextDid.authentication) {
      nextDid.authentication = this.removeDuplicates(nextDid.authentication);
    }
    if(nextDid.capabilityInvocation) {
      nextDid.capabilityInvocation = this.removeDuplicates(nextDid.capabilityInvocation);
    }
    if(this.trace) {
      console.log('DidDocument::acceptInvitation::nextDid:=<',nextDid,'>');
    }
    this.expand = new DIDExpandDocument(nextDid,this.auth);
    if(this.trace) {
      console.log('DidDocument::acceptInvitation::this.expand:=<',this.expand,'>');
    }
    const documentObj = this.expand.document();
    if(this.trace) {
      console.log('DidDocument::acceptInvitation::documentObj:=<',documentObj,'>');
    }
    if(this.otmc.isNode) {
      fs.writeFileSync(this.otmc.config.topDoc,JSON.stringify(documentObj,undefined,2));
    } else {
      localStorage.setItem(StoreKey.didDoc,JSON.stringify(documentObj));
    }

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
    if(this.trace0) {
      console.log('DidDocument::onInvitationAcceptReply::this.otmc=:<',this.otmc,'>');
    }
    if(this.trace) {
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
    if(this.otmc.isNode) {
      if(this.trace) {
        console.log('DidDocument::onInvitationAcceptReply::this.otmc.config.topDoc:=<',this.otmc.config.topDoc,'>');
      }
      this.fs.writeFileSync(this.otmc.config.topDoc,JSON.stringify(documentObj,undefined,2));
    } else {
      localStorage.setItem(StoreKey.didDoc,JSON.stringify(documentObj));
    }
    //this.otmc.mqtt.freshMqttJwt();
    //this.loadDocument();
  }

  packMessage(rawMsg) {
    if(this.trace0) {
      console.log('DidDocument::packMessage::this.otmc=:<',this.otmc,'>');
      console.log('DidDocument::packMessage::rawMsg=:<',rawMsg,'>');
    }
    this.checkEdcrypt_();

    const prefixDidToTopic = this.didDoc_.id.replaceAll(':','/')
    const packRawMsg = {
      topic:`${prefixDidToTopic}/${this.auth.address()}/${rawMsg.topic}`,
      payload:rawMsg.payload
    };
    if(this.trace0) {
      console.log('DidDocument::packMessage::packRawMsg=:<',packRawMsg,'>');
    }
    const msgSigned = this.auth.sign(packRawMsg);
    if(this.trace0) {
      console.log('DidDocument::packMessage::msgSigned=:<',msgSigned,'>');
    }
    return msgSigned;
  }
  packBroadcastMessage(rawMsg) {
    if(this.trace0) {
      console.log('DidDocument::packBroadcastMessage::this.otmc=:<',this.otmc,'>');
      console.log('DidDocument::packBroadcastMessage::rawMsg=:<',rawMsg,'>');
    }
    this.checkEdcrypt_();

    const prefixDidToTopic = this.didDoc_.id.replaceAll(':','/')
    const packRawMsg = {
      topic:`${prefixDidToTopic}/broadcast/${this.auth.address()}/${rawMsg.topic}`,
      payload:rawMsg.payload
    };
    if(this.trace0) {
      console.log('DidDocument::packBroadcastMessage::packRawMsg=:<',packRawMsg,'>');
    }
    const msgSigned = this.auth.sign(packRawMsg);
    if(this.trace0) {
      console.log('DidDocument::packBroadcastMessage::msgSigned=:<',msgSigned,'>');
    }
    return msgSigned;
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
  }
  
  storeDidDocumentHistory(historyDid,uploadAddress) {
    if(this.trace0) {
      console.log('DidDocument::storeDidDocumentHistory::this.otmc=:<',this.otmc,'>');
    }    
    if(this.trace) {
      console.log('DidDocument::storeDidDocumentHistory::historyDid=:<',historyDid,'>');
      console.log('DidDocument::storeDidDocumentHistory::uploadAddress=:<',uploadAddress,'>');
    }    
    if(this.trace0) {
      console.log('DidDocument::storeDidDocumentHistory::this.didDocStore=:<',this.didDocStore,'>');
      //console.log('DidDocument::storeDidDocumentHistory::this.didManifestStore=:<',this.didManifestStore,'>');
    }
    this.checkEdcrypt_();
    if(this.trace0) {
      console.log('DidDocument::storeDidDocumentHistory::this.util=:<',this.util,'>');
    }
    const historyStr = JSON.stringify(historyDid);
    if(this.trace) {
      console.log('DidDocument::storeDidDocumentHistory::historyStr=:<',historyStr,'>');
    }
    const historyAdd = this.util.calcAddress(historyStr)
    if(this.trace) {
      console.log('DidDocument::storeDidDocumentHistory::historyAdd=:<',historyAdd,'>');
    }
    this.didDocStore.put(historyAdd, historyStr, LEVEL_OPT,(err)=>{
      if(this.trace) {
        console.log('DidDocument::storeDidDocumentHistory::put err=:<',err,'>');
      }
    });
  }
  
  storeDidManifestHistory(historyManifest,uploadAddress) {
    if(this.trace) {
      console.log('DidDocument::storeDidManifestHistory::this.otmc=:<',this.otmc,'>');
      console.log('DidDocument::storeDidManifestHistory::historyDid=:<',historyManifest,'>');
      console.log('DidDocument::storeDidManifestHistory::uploadAddress=:<',uploadAddress,'>');
    }    
    if(this.trace) {
      console.log('DidDocument::storeDidManifestHistory::this.didManifestStore=:<',this.didManifestStore,'>');
    }
    this.checkEdcrypt_();
    if(this.trace) {
      console.log('DidDocument::storeDidManifestHistory::this.util=:<',this.util,'>');
    }
    const historyStr = JSON.stringify(historyManifest);
    if(this.trace) {
      console.log('DidDocument::storeDidManifestHistory::historyStr=:<',historyStr,'>');
    }
    const historyAdd = this.util.calcAddress(historyStr)
    if(this.trace) {
      console.log('DidDocument::storeDidManifestHistory::historyAdd=:<',historyAdd,'>');
    }
    this.didManifestStore.put(historyAdd, historyStr, LEVEL_OPT,(err)=>{
      if(this.trace) {
        console.log('DidDocument::storeDidManifestHistory::put err=:<',err,'>');
      }
    });
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
  
  
  async loadDidRuleFromManifest_(didId) {
    if(!didId) {
      didId = this.didDoc_.id;
    }
    const manifestsJson = await this.resolver.manifestAll(didId);
    if(this.trace2) {
      console.log('DidDocument::loadDidRuleFromManifest_::manifestsJson=<',manifestsJson,'>');
    }
    if(manifestsJson.length > 0) {
      return manifestsJson[0].diddoc;
    }
    return false;
  }
  async loadEvidenceChain_(didId) {
    if(!didId) {
      didId = this.didDoc_.id;
    }
    const keyAddress = didId.replace('did:otmc:','')
    const evidencesJson = await this.resolver.getDidDocumentAll(keyAddress);
    if(this.trace2) {
      console.log('DidDocument::loadEvidenceChain_::evidencesJson=<',evidencesJson,'>');
    }
    for(const evidenceJson of evidencesJson) {
      if(this.trace2) {
        console.log('DidDocument::loadEvidenceChain_::evidenceJson=<',evidenceJson,'>');
      }
      for(const ctrlId of evidenceJson.controller ) {
        if(this.trace2) {
          console.log('DidDocument::loadEvidenceChain_::ctrlId=<',ctrlId,'>');
        }
        if(ctrlId && ctrlId !== evidenceJson.id && ctrlId !== didId)  {
          await this.loadEvidenceChain_(ctrlId);
        }
      }  
    }
    this.allEvidenceChain[didId] = {
      did:evidencesJson
    };
    if(this.trace2) {
      console.log('DidDocument::loadEvidenceChain_::this.allEvidenceChain=<',this.allEvidenceChain,'>');
    }
    return evidencesJson;
  }

  createSeedRootDidDoc_(controls,root) {
    if(this.trace) {
      console.log('DidDocument::createSeedRootDidDoc_::controls=:<',controls,'>');
    }
    if(this.trace) {
      console.log('DidDocument::createSeedRootDidDoc_::this.otmc=:<',this.otmc,'>');
    }
    this.checkEdcrypt_();
    if(root) {
      const rootDid = `did:otmc:${this.auth.address()}`;
      controls.push(rootDid);
    }
    const checkedControls = controls.filter((ctrl) => ctrl.startsWith('did:otmc:'));
    if(this.trace) {
      console.log('DidDocument::createSeedRootDidDoc_::checkedControls=:<',checkedControls,'>');
    }
    const uniqControls = Array.from(new Set(checkedControls));
    if(this.trace) {
      console.log('DidDocument::createSeedRootDidDoc_::uniqControls=:<',uniqControls,'>');
    }
    this.seed = new DIDSeedDocument(this.auth,this.recovery,uniqControls);
    if(this.trace) {
      console.log('DidDocument::createSeedRootDidDoc_::this.seed=:<',this.seed,'>');
    }
    const address = this.seed.address();
    if(this.trace) {
      console.log('DidDocument::createSeedRootDidDoc_::address=:<',address,'>');
    }
    const documentObj = this.seed.document();
    if(this.trace) {
      console.log('DidDocument::createSeedRootDidDoc_::documentObj=:<',documentObj,'>');
    }
    return documentObj;
  }


}

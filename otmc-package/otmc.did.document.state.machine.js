const LOG = {
  trace:true,
  debug:true,
};
import { DidDocumentGraphology } from './otmc.did.document.graphology.js';
import { DidStoreDocument } from './otmc.did.store.document.js';
import { DidStoreEvidence } from './otmc.did.store.evidence.js';
import { EvidenceChainBuilder } from './did/evidence.thin.js';
import { DidStoreTeamJoin } from './otmc.did.store.team.join.js';

/**
*
*/
export class DidDocumentStateMachine {
  constructor(eeInternal,eeOut) {
    this.trace0 = false;
    this.trace1 = false;
    this.trace2 = false;
    this.trace = false;;
    this.debug = true;
    this.eeInternal = eeInternal;
    this.eeOut = eeOut;
    this.chainState = {};
    this.ListenEventEmitter_();
  }
    
  ListenEventEmitter_() {
    if(this.trace0) {
      console.log('DidDocumentStateMachine::ListenEventEmitter_::this.eeInternal=:<',this.eeInternal,'>');
    }
    const self = this;
    this.eeInternal.on('sys.authKey.ready',async (evt)=>{
      if(self.trace) {
        console.log('DidDocumentStateMachine::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.auth = evt.auth;
      self.otmc = evt.otmc;
      self.base32 = evt.base32;
      self.util = evt.util;

      self.builder = new EvidenceChainBuilder(self.auth);
      self.document = new DidStoreDocument();
      self.evidence = new DidStoreEvidence();
      self.teamJoin = new DidStoreTeamJoin(evt);
      self.graph = new DidDocumentGraphology();
      await self.loadEvidenceChain();
      self.reCalculateTentativeDidDoc();
      self.reCalculateTentativeJoinCR();
      self.reCalculateTentativeJoinVC();
    });
    this.eeInternal.on('did:document',async (evt)=>{
      if(self.trace0) {
        console.log('DidDocumentStateMachine::ListenEventEmitter_::evt=:<',evt,'>');
      }
      if(evt.didDoc) {
        const result =  await self.caclDidDocument(evt.didDoc);
        if(self.trace0) {
          console.log('DidDocumentStateMachine::ListenEventEmitter_::result=:<',result,'>');
        }
        self.eeInternal.emit('did:document.auth.result', result);
        if(result.proofed) { 
          await self.autoCompleteDidDocument_(evt.didDoc,result);
        }
      }
    });
    this.eeInternal.on('did:document:tentative',async (evt)=>{
      if(self.trace0) {
        console.log('DidDocumentStateMachine::ListenEventEmitter_::evt=:<',evt,'>');
      }
      if(evt.didDoc) {
        const resultTentative =  await self.caclDidDocument(evt.didDoc);
        if(self.trace0) {
          console.log('DidDocumentStateMachine::ListenEventEmitter_::resultTentative=:<',resultTentative,'>');
        }
        }
    });
  }
  async loadEvidenceChain() {
    this.allEvidenceChain = await this.loadEvidenceChainFromStorage_();
    if(this.trace0) {
      console.log('DidDocumentStateMachine::loadEvidenceChain::this.allEvidenceChain=:<',this.allEvidenceChain,'>');
    }
    for(const chainId in this.allEvidenceChain) {
      if(this.trace0) {
        console.log('DidDocumentStateMachine::loadEvidenceChain::chainId=:<',chainId,'>');
      }
      const chain = this.allEvidenceChain[chainId];
      if(this.trace0) {
        console.log('DidDocumentStateMachine::loadEvidenceChain::chain=:<',chain,'>');
      }
      if(!this.chainState[chainId]) {
        this.chainState[chainId] = new DidChainStateMachine(self);
      }
      if(this.trace0) {
        console.log('DidDocumentStateMachine::loadEvidenceChain::this.chainState=:<',this.chainState,'>');
      }
      await this.buildChainEvidence_(chainId,chain);
      const proofLinks = await this.evidence.getAllProofLinks();
      if(this.trace2) {
        console.log('DidDocumentStateMachine::loadEvidenceChain::proofLinks=<',proofLinks,'>');
      }
      this.graph.buildChainGraph(proofLinks);
      if(this.trace2) {
        console.log('DidDocumentStateMachine::loadEvidenceChain::this.didSpaceGraphs=<',this.didSpaceGraphs,'>');
      }
      this.dumpState_();
    }
    this.buildWholeChainProofPath_();
    this.eeInternal.emit('did:document:evidence.chain.build.complete',{});
    return;
  }
  async caclDidDocument(didDoc) {
    if(this.trace2) {
      console.log('DidDocumentStateMachine::caclDidDocument::didDoc=<',didDoc,'>');
    }
    const seedReachTable = this.graph.getSeedReachTable();
    const didAddress = didDoc.id;
    if(this.trace2) {
      console.log('DidDocumentStateMachine::caclDidDocument::didAddress=<',didAddress,'>');
    }
    const didType = this.builder.judgeEvidenceDidType(didDoc,this.allEvidenceChain[didDoc.id]);
    if(this.trace2) {
      console.log('DidDocumentStateMachine::caclDidDocument::didType=<',didType,'>');
    }
    let docProofResult = false;
    if(didType.ctrler){
      docProofResult = this.builder.collectControllerAuth(didDoc,seedReachTable);
    }
    if(didType.ctrlee){
      const controlleeReachTable = this.graph.buildControlleeReachTable(didDoc);
      if(this.trace2) {
        console.log('DidDocumentStateMachine::caclDidDocument::controlleeReachTable=<',controlleeReachTable,'>');
      }
      docProofResult = this.builder.collectControlleeAuth(didDoc,controlleeReachTable,seedReachTable);
    }
    if(this.trace2) {
      console.log('DidDocumentStateMachine::caclDidDocument::docProofResult=<',docProofResult,'>');
      console.log('DidDocumentStateMachine::caclDidDocument::this.allEvidenceChain=<',this.allEvidenceChain,'>');
    }
    const myAddress = this.auth.address();
    if(this.trace2) {
      console.log('DidDocumentStateMachine::caclDidDocument::myAddress=<',myAddress,'>');
    }
    let seed = false;
    if(didAddress.endsWith(myAddress)) {
      seed = true;
    }
    if(this.trace2) {
      console.log('DidDocumentStateMachine::caclDidDocument::seed=<',seed,'>');
    }
    const result = {
      proofed : false,
      stable : false,
      ctrler:didType.ctrler,
      ctrlee:didType.ctrlee,
      seed:seed,
      bud:!seed
    }
    if(!docProofResult) {
      return result;
    }
    if(!docProofResult.authList) {
      return result;
    }
    const myAuthId = `${didAddress}#${myAddress}`;
    if(this.trace2) {
      console.log('DidDocumentStateMachine::caclDidDocument::myAuthId=<',myAuthId,'>');
    }
    const isProofedNode = docProofResult.authList.includes(myAuthId);
    if(this.trace2) {
      console.log('DidDocumentStateMachine::caclDidDocument::isProofedNode=<',isProofedNode,'>');
    }
    result.stable = true;
    result.proofed = isProofedNode;
    return result;
  }
  async reCalculateTentativeDidDoc() {
    const evidenceTentative = await this.loadEvidenceTentativeFromStorage_();
    if(this.trace2) {
      console.log('DidDocumentStateMachine::reCalculateTentativeDidDoc::evidenceTentative=<',evidenceTentative,'>');
    }
    for(const chainId in evidenceTentative){
      const chain = evidenceTentative[chainId];
      if(this.trace2) {
        console.log('DidDocumentStateMachine::reCalculateTentativeDidDoc::chainId=<',chainId,'>');
        console.log('DidDocumentStateMachine::reCalculateTentativeDidDoc::chain=<',chain,'>');
      }
      for(const evidence of chain){
        if(this.trace2) {
          console.log('DidDocumentStateMachine::reCalculateTentativeDidDoc::evidence=<',evidence,'>');
        }
        const docResult = await this.caclDidDocument(evidence);
        if(this.trace2) {
          console.log('DidDocumentStateMachine::reCalculateTentativeDidDoc::docResult=<',docResult,'>');
        }
        if(docResult.stable) {
          const documentStr = JSON.stringify(evidence);
          const moveDoc = {
            did:evidence.id,
            updated:evidence.updated,
            hashDid:this.util.calcAddress(documentStr),
          }
          await this.document.moveTentative2Stable(moveDoc);
        }
      }
    }
  }
  async reCalculateTentativeJoinCR() {
    await this.teamJoin.moveTentativeCR2Workspace();   
  }
  async reCalculateTentativeJoinVC() {  
    const storedJointVCs =  await this.teamJoin.getJoinTentativeVCAll();   
    if(this.trace2) {
      console.log('DidDocumentStateMachine::reCalculateTentativeJoinVC::storedJointVCs=<',storedJointVCs,'>');
    }
    for(const storedVC of storedJointVCs) {
      if(this.trace2) {
        console.log('DidDocumentStateMachine::reCalculateTentativeJoinVC::storedVC=<',storedVC,'>');
      }
      const b64JoinVCStr = this.util.decodeBase64Str(storedVC.b64JoinVC);
      if(this.trace3) {
        console.log('DidDocumentStateMachine::reCalculateTentativeJoinVC::b64JoinVCStr=<',b64JoinVCStr,'>');
      }
      const joinVCJson = JSON.parse(b64JoinVCStr);
      if(this.trace2) {
        console.log('DidDocumentStateMachine::reCalculateTentativeJoinVC::joinVCJson=<',joinVCJson,'>');
      }
      const resultVC = this.auth.verifyVerifiableCredential(joinVCJson);
      if(this.trace2) {
        console.log('DidDocumentStateMachine::reCalculateTentativeJoinVC::resultVC=<',resultVC,'>');
      }
      if(resultVC) {
        const documentObj = joinVCJson.credentialSubject.did;
        if(this.trace2) {
          console.log('DidDocumentStateMachine::reCalculateTentativeJoinVC::documentObj=<',documentObj,'>');
        }
        const documentStr = JSON.stringify(documentObj);
        const coreDocObj = JSON.parse(documentStr);
        delete coreDocObj.proof;
        const coreDocStr = JSON.stringify(coreDocObj);
        const storeDoc = {
          did:documentObj.id,
          controller:documentObj.controller,
          authentication:documentObj.authentication,
          updated:documentObj.updated,
          hashDid:this.util.calcAddress(documentStr),
          hashCore:this.util.calcAddress(coreDocStr),
          b64Did:this.util.encodeBase64Str(documentStr)
        }
        if(this.trace2) {
          console.log('DidDocumentStateMachine::reCalculateTentativeJoinVC::storeDoc=<',storeDoc,'>');
        }
        await this.document.putStable(storeDoc);
        await this.teamJoin.moveTentativeVC2Workspace(storedVC);
      }
    }
  }

  async loadEvidenceChainFromStorage_() {
    const evidencesRaw = await this.document.getAnyDidDocument();
    if(this.trace2) {
      console.log('DidDocumentStateMachine::loadEvidenceChainFromStorage_::evidencesRaw=<',evidencesRaw,'>');
    }
    const evidencesJson = [];
    for(const evidenceRaw of evidencesRaw){
      const b64DidStr = this.util.decodeBase64Str(evidenceRaw.b64Did);
      if(this.trace2) {
        console.log('DidDocumentStateMachine::loadEvidenceChainFromStorage_::b64DidStr=<',b64DidStr,'>');
      }
      const evidenceJson = JSON.parse(b64DidStr);
      if(this.trace2) {
        console.log('DidDocumentStateMachine::loadEvidenceChainFromStorage_::evidenceJson=<',evidenceJson,'>');
      }
      evidencesJson.push(evidenceJson);
    }
    const evidencesOfAddress = {};
    for(const evidenceJson of evidencesJson){
      if(this.trace2) {
        console.log('DidDocumentStateMachine::loadEvidenceChainFromStorage_::evidenceJson=<',evidenceJson,'>');
      }
      const address = evidenceJson.id;
      if(!evidencesOfAddress[address]) {
        evidencesOfAddress[address] = [];
      }
      evidencesOfAddress[address].push(evidenceJson);
    }
    if(this.trace2) {
      console.log('DidDocumentStateMachine::loadEvidenceChainFromStorage_::evidencesOfAddress=<',evidencesOfAddress,'>');
    }
    return evidencesOfAddress;
  }
  async loadEvidenceTentativeFromStorage_(){
    const evidencesRaw = await this.document.getTentativeAll();
    if(this.trace2) {
      console.log('DidDocumentStateMachine::loadEvidenceTentativeFromStorage_::evidencesRaw=<',evidencesRaw,'>');
    }
    const evidencesJson = [];
    for(const evidenceRaw of evidencesRaw){
      const b64DidStr = this.util.decodeBase64Str(evidenceRaw.b64Did);
      if(this.trace2) {
        console.log('DidDocumentStateMachine::loadEvidenceTentativeFromStorage_::b64DidStr=<',b64DidStr,'>');
      }
      const evidenceJson = JSON.parse(b64DidStr);
      if(this.trace2) {
        console.log('DidDocumentStateMachine::loadEvidenceTentativeFromStorage_::evidenceJson=<',evidenceJson,'>');
      }
      evidencesJson.push(evidenceJson);
    }
    const evidencesOfAddress = {};
    for(const evidenceJson of evidencesJson){
      if(this.trace2) {
        console.log('DidDocumentStateMachine::loadEvidenceTentativeFromStorage_::evidenceJson=<',evidenceJson,'>');
      }
      const address = evidenceJson.id;
      if(!evidencesOfAddress[address]) {
        evidencesOfAddress[address] = [];
      }
      evidencesOfAddress[address].push(evidenceJson);
    }
    if(this.trace2) {
      console.log('DidDocumentStateMachine::loadEvidenceTentativeFromStorage_::evidencesOfAddress=<',evidencesOfAddress,'>');
    }
    return evidencesOfAddress;
  }
  
  async buildChainEvidence_(chainId,chain) {
    if(this.trace2) {
      console.log('DidDocumentStateMachine::buildChainEvidence_::chainId=<',chainId,'>');
      console.log('DidDocumentStateMachine::buildChainEvidence_::chain=<',chain,'>');
    }
    const sortedDidByUpdated = sortDidByUpdated(chain);
    if(this.trace2) {
      console.log('DidDocumentStateMachine::buildChainEvidence_::sortedDidByUpdated=<',sortedDidByUpdated,'>');
    }
    for(const didDoc of sortedDidByUpdated) {
      if(this.trace2) {
        console.log('DidDocumentStateMachine::buildChainEvidence_::didDoc=<',didDoc,'>');
      }
      const proofLink = this.builder.buildEvidenceChainProof(didDoc);
      if(this.trace2) {
        console.log('DidDocumentStateMachine::buildChainEvidence_::chainId=<',chainId,'>');
        console.log('DidDocumentStateMachine::buildChainEvidence_::proofLink=<',proofLink,'>');
      }
      if(proofLink && proofLink.proofers && proofLink.proofees && proofLink.proofers.length > 0 && proofLink.proofees.length > 0) {
        for(const proofer of proofLink.proofers) {
          for(const proofee of proofLink.proofees) {            
            await this.evidence.putStable(chainId,proofer,proofee);
          }
        }
      }
    }
  }

  buildWholeChainProofPath_() {
    for(const chainId in this.allEvidenceChain) {
      if(this.trace0) {
        console.log('DidDocumentStateMachine::buildWholeChainProofPath_::chainId=:<',chainId,'>');
      }
      const chain = this.allEvidenceChain[chainId];
      if(!chain) {
        continue;
      }
      if(this.trace0) {
        console.log('DidDocumentStateMachine::buildWholeChainProofPath_::chain=:<',chain,'>');
      }
      const chainGraph = this.graph.getDidSpaceGraphs(chainId);
      if(this.trace0) {
        console.log('DidDocumentStateMachine::buildWholeChainProofPath_::chainGraph=:<',chainGraph,'>');
      }
      if(!chainGraph) {
        continue;
      }
      this.buildOneChainProofPath_(chain,chainGraph);
    }    
  }
  buildOneChainProofPath_(chain,chainGraph) {
    if(this.trace0) {
      console.log('DidDocumentStateMachine::buildOneChainProofPath_::chain=:<',chain,'>');
      console.log('DidDocumentStateMachine::buildOneChainProofPath_::chainGraph=:<',chainGraph,'>');
    }
    for(const didDoc of chain) {
      this.graph.buildDidDocumentProofPath(didDoc,chainGraph);
    }
  }
  autoCompleteDidDocument_(didDoc,result) {
    if(this.trace2) {
      console.log('DidDocumentStateMachine::autoCompleteDidDocument_::didDoc=<',didDoc,'>');
      console.log('DidDocumentStateMachine::autoCompleteDidDocument_::result=<',result,'>');
    }
    const iAmInProof = didDoc.proof.reduce((acc, proof) => acc || proof.creator.endsWith(this.auth.address()), false);
    if(this.trace2) {
      console.log('DidDocumentStateMachine::autoCompleteDidDocument_::iAmInProof=<',iAmInProof,'>');
    }
    if(iAmInProof) {
      return;
    }
    const policy = didDoc.otmc.manifest.did.authentication.policy
    if(this.trace2) {
      console.log('DidDocumentStateMachine::autoCompleteDidDocument_::policy=<',policy,'>');
    }
    switch(policy) {
      case 'Seed.Dogma':
        if(result.ctrlee || result.bud) {
          return;
        }
      case 'Controller.Dogma':
        if(result.ctrlee) {
          return;
        }
      case 'Proof.Chain':
      default:
        break;
    }
    this.eeInternal.emit('did:document.add.myProof');
  }


  dumpState_() {
    for(const chainId in this.chainState) {
      const state = this.chainState[chainId];
      if(this.trace2) {
        console.log('DidDocumentStateMachine::dumpState_::state.value=<',state.value,'>');
      }
    }
  }
}

const sortDidByUpdated = (didArray) => {
  console.log('DidDocumentStateMachine::sortDidByUpdated::didArray=<',didArray,'>');
  didArray.sort((a,b)=> { 
    const escape_ms_sort = new Date(a.updated) - new Date(b.updated);
    console.log('DidDocumentStateMachine::sortDidByUpdated::escape_ms_sort=<',escape_ms_sort,'>');
    return escape_ms_sort;
  });
  console.log('DidDocumentStateMachine::sortDidByUpdated::didArray=<',didArray,'>');
  return didArray;
}

import { createMachine, createActor, assign  }  from 'xstate';

class DidChainStateMachine {
  constructor(docState) {
    this.trace0 = true;
    this.trace1 = true;
    this.trace = true;
    this.debug = true;
    this.value = false;
    this.docState = docState;
    this.createStateMachine_();
  }
  
  createStateMachine_() {
    const stmConfig = {
      initial: 'none',
      context: {
        docState:this.docState,
      },
      states: didDocStateTable,
    }
    const stmOption = {
      actions:didDocActionTable,
    }
    if(this.trace) {
      console.log('DidChainStateMachine::createStateMachine_::stmConfig=:<',stmConfig,'>');
    }
    this.stm = createMachine(stmConfig,stmOption);
    if(this.trace0) {
      console.log('DidChainStateMachine::createStateMachine_::this.stm=:<',this.stm,'>');
    }
    this.actor = createActor(this.stm);
    
    const self = this;
    this.actor.subscribe((state) => {
      if(self.trace0) {
        console.log('DidChainStateMachine::createStateMachine_::state=:<',state,'>');
        console.log('DidChainStateMachine::createStateMachine_::self.stm=:<',self.stm,'>');
      }
      if(self.trace) {
        console.log('DidChainStateMachine::createStateMachine_::state.value=:<',state.value,'>');
      }
      self.value = state.value;
    });
    this.actor.start();
    setTimeout(()=>{
      self.actor.send({type:'init'});
    },1);
  }
}

const didDocStateTable = {
  none: {
    on: {
      'init': {
        actions: ['init']
      },
      'manifest':'manifest',
      'manifest.lack':'manifestNone',
    } 
  },
  manifest: {
    entry:['manifest'],
    on: {
      'root.auth.proof.is.seed':'rootAuthIsSeed',
      'root.auth.proof.by.seed':'rootAuthBySeed',
      'root.auth.proof.by.auth':'rootAuthByAuth',
      'root.auth.proof.by.none':'rootAuthByNone',
      'leaf.seed.proof.by.ctrl':'leafAuthSeedByCtrl',
      'leaf.seed.proof.by.none':'leafAuthSeedByNoe',
      'leaf.auth.proof.by.ctrl':'leafAuthByCtrl',
      'leaf.auth.proof.by.none':'leafAuthByNoe',
    } 
  },
  manifestNone: {
    entry:['manifestNone'],
    on: {
      'root.auth.proof.is.seed':'rootAuthIsSeed',
      'root.auth.proof.by.seed':'rootAuthBySeed',
      'root.auth.proof.by.auth':'rootAuthByAuth',
      'root.auth.proof.by.none':'rootAuthByNone',
      'leaf.seed.proof.by.ctrl':'leafAuthSeedByCtrl',
      'leaf.seed.proof.by.none':'leafAuthSeedByNoe',
      'leaf.auth.proof.by.ctrl':'leafAuthByCtrl',
      'leaf.auth.proof.by.none':'leafAuthByNoe',
    } 
  },
  evidenceChainReady: {
    entry:['chainReady'],
    on: {
      'root.auth.proof.is.seed':'rootAuthIsSeed',
      'root.auth.proof.by.seed':'rootAuthBySeed',
      'root.auth.proof.by.auth':'rootAuthByAuth',
      'root.auth.proof.by.none':'rootAuthByNone',
      'leaf.seed.proof.by.ctrl':'leafAuthSeedByCtrl',
      'leaf.seed.proof.by.none':'leafAuthSeedByNoe',
      'leaf.auth.proof.by.ctrl':'leafAuthByCtrl',
      'leaf.auth.proof.by.none':'leafAuthByNoe',
    } 
  },
  evidenceChainWithoutManifest: {
    entry:['chainReady'],
    on: {
      'root.auth.proof.is.seed':'rootAuthIsSeed',
      'root.auth.proof.by.seed':'rootAuthBySeed',
      'root.auth.proof.by.auth':'rootAuthByAuth',
      'root.auth.proof.by.none':'rootAuthByNone',
      'leaf.seed.proof.by.ctrl':'leafAuthSeedByCtrl',
      'leaf.seed.proof.by.none':'leafAuthSeedByNoe',
      'leaf.auth.proof.by.ctrl':'leafAuthByCtrl',
      'leaf.auth.proof.by.none':'leafAuthByNoe',
    } 
  },
  evidenceChainFail: {
    entry:['chainFail'],
    on: {
      'root.auth.proof.by.none':'rootAuthByNone',
    }
  },
  rootAuthIsSeed: {
    entry:['rootAuthIsSeed'],
    on: {
    }
  },
  rootAuthBySeed: {
    entry:['rootAuthBySeed'],
    on: {
    }
  },
  rootAuthByAuth: {
    entry:['rootAuthByAuth'],
    on: {
    }
  },
  rootAuthByNone: {
    entry:['rootAuthByNone'],
    on: {
    }
  },
  leafAuthSeedByCtrl: {
    entry:['leafAuthSeedByCtrl'],
    on: {
    }
  },
  leafAuthSeedByNoe: {
    entry:['leafAuthSeedByNoe'],
    on: {
    }
  },
  leafAuthByCtrl: {
    entry:['leafAuthByCtrl'],
    on: {
    }
  },
  leafAuthByNoe: {
    entry:['leafAuthByNoe'],
    on: {
    }
  },
}

const didDocActionTable = {
  init: (context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidChainStateMachine::didDocActionTable::init:context=:<',context,'>');
      console.log('DidChainStateMachine::didDocActionTable::init:ee=:<',ee,'>');
      console.log('DidChainStateMachine::didDocActionTable::init:chain=:<',chain,'>');
    }
  },
  chainReady: async (context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidChainStateMachine::didDocActionTable::chainReady:context=:<',context,'>');
      console.log('DidChainStateMachine::didDocActionTable::chainReady:ee=:<',ee,'>');
      console.log('DidChainStateMachine::didDocActionTable::chainReady:chain=:<',chain,'>');
    }
    const proof = await chain.calcDidAuth();
    if(LOG.trace) {
      console.log('DidChainStateMachine::didDocActionTable::chainReady:proof=:<',proof,'>');
    }
    ee.emit('did.stm.docstate.internal.proof',{proof:proof});
  },
  chainFail:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidChainStateMachine::didDocActionTable::chainFail:context=:<',context,'>');
      console.log('DidChainStateMachine::didDocActionTable::chainFail:ee=:<',ee,'>');
      console.log('DidChainStateMachine::didDocActionTable::chainFail:chain=:<',chain,'>');
    }
    const proof = chain.calcDidAuth();
    if(LOG.trace) {
      console.log('DidChainStateMachine::didDocActionTable::chainFail:proof=:<',proof,'>');
    }
    ee.emit('did.stm.docstate.internal.proof',{proof:proof});
  },
  rootAuthIsSeed:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidChainStateMachine::didDocActionTable::authIsSeed:context=:<',context,'>');
      console.log('DidChainStateMachine::didDocActionTable::authIsSeed:ee=:<',ee,'>');
      console.log('DidChainStateMachine::didDocActionTable::authIsSeed:chain=:<',chain,'>');
    }
    const notify = {
      isSeedRoot:true,
    };
    ee.emit('did.evidence.auth',notify);
  },
  rootAuthBySeed:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidChainStateMachine::didDocActionTable::rootAuthBySeed:context=:<',context,'>');
      console.log('DidChainStateMachine::didDocActionTable::rootAuthBySeed:ee=:<',ee,'>');
      console.log('DidChainStateMachine::didDocActionTable::rootAuthBySeed:chain=:<',chain,'>');
    }
    const notify = {
      bySeedRoot:true,
    };
    ee.emit('did.evidence.auth',notify);
  },
  rootAuthByAuth:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidChainStateMachine::didDocActionTable::rootAuthByAuth:context=:<',context,'>');
      console.log('DidChainStateMachine::didDocActionTable::rootAuthByAuth:ee=:<',ee,'>');
      console.log('DidChainStateMachine::didDocActionTable::rootAuthByAuth:chain=:<',chain,'>');
    }
    const notify = {
      byAuthRoot:true,
    };
    ee.emit('did.evidence.auth',notify);
  },
  rootAuthByNone:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidChainStateMachine::didDocActionTable::rootAuthByNone:context=:<',context,'>');
      console.log('DidChainStateMachine::didDocActionTable::rootAuthByNone:ee=:<',ee,'>');
      console.log('DidChainStateMachine::didDocActionTable::rootAuthByNone:chain=:<',chain,'>');
    }
    const notify = {
      byNoneRoot:true,
    };
    ee.emit('did.evidence.auth',notify);
  },
  leafAuthSeedByCtrl:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidChainStateMachine::didDocActionTable::leafAuthSeedByCtrl:context=:<',context,'>');
      console.log('DidChainStateMachine::didDocActionTable::leafAuthSeedByCtrl:ee=:<',ee,'>');
      console.log('DidChainStateMachine::didDocActionTable::leafAuthSeedByCtrl:chain=:<',chain,'>');
    }
    const notify = {
      byCtrlLeafSeed:true,
    };
    ee.emit('did.evidence.auth',notify);
  },
  leafAuthSeedByNoe:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidChainStateMachine::didDocActionTable::leafAuthSeedByNoe:context=:<',context,'>');
      console.log('DidChainStateMachine::didDocActionTable::leafAuthSeedByNoe:ee=:<',ee,'>');
      console.log('DidChainStateMachine::didDocActionTable::leafAuthSeedByNoe:chain=:<',chain,'>');
    }
    const notify = {
      byNoneLeafSeed:true,
    };
    ee.emit('did.evidence.auth',notify);
  },
  leafAuthByCtrl:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidChainStateMachine::didDocActionTable::leafAuthByCtrl:context=:<',context,'>');
      console.log('DidChainStateMachine::didDocActionTable::leafAuthByCtrl:ee=:<',ee,'>');
      console.log('DidChainStateMachine::didDocActionTable::leafAuthByCtrl:chain=:<',chain,'>');
    }
    const notify = {
      byCtrlLeaf:true,
    };
    ee.emit('did.evidence.auth',notify);
  },
  leafAuthByNoe:(context, evt) => {
    const ee = context.context.ee;
    const chain = context.context.chain;
    if(LOG.trace) {
      console.log('DidChainStateMachine::didDocActionTable::leafAuthByNoe:context=:<',context,'>');
      console.log('DidChainStateMachine::didDocActionTable::leafAuthByNoe:ee=:<',ee,'>');
      console.log('DidChainStateMachine::didDocActionTable::leafAuthByNoe:chain=:<',chain,'>');
    }
    const notify = {
      byNoneLeaf:true,
    };
    ee.emit('did.evidence.auth',notify);
  },
};

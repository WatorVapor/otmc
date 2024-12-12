const LOG = {
  trace:true,
  debug:true,
};
import {Graph} from 'graphology';
import {dijkstra} from 'graphologyShortestPath';
import { DidStoreDocument } from './otmc.did.store.document.js';
//import { DidStoreManifest } from './otmc.did.store.manifest.js';
import { DidStoreEvidence } from './otmc.did.store.evidence.js';
import { EvidenceChainBuilder } from './did/evidence.thin.js';

if(LOG.debug) {
  console.log('::Graph=<',Graph,'>');
  console.log('::dijkstra=<',dijkstra,'>');
}
/**
*
*/
export class DidDocumentStateMachine {
  constructor(eeInternal,eeOut) {
    this.trace0 = true;
    this.trace1 = true;
    this.trace2 = true;
    this.trace = true;;
    this.debug = true;
    this.eeInternal = eeInternal;
    this.eeOut = eeOut;
    this.chainState = {};
    this.ListenEventEmitter_();
    this.didSpaceGraphs = {};
  }
    
  ListenEventEmitter_() {
    if(this.trace0) {
      console.log('DidDocumentStateMachine::ListenEventEmitter_::this.eeInternal=:<',this.eeInternal,'>');
    }
    const self = this;
    this.eeInternal.on('sys.authKey.ready',(evt)=>{
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

      self.loadEvidence();      
    });
    this.eeInternal.on('did:document',async (evt)=>{
      if(self.trace0) {
        console.log('DidDocumentStateMachine::ListenEventEmitter_::evt=:<',evt,'>');
      }
      if(evt.didDoc) {
        self.caclDidDocument(evt.didDoc);
      }
    });
  }
  async loadEvidence() {
    this.allEvidenceChain = await this.loadEvidenceChainFromStorage_();
    if(self.trace0) {
      console.log('DidDocumentStateMachine::loadEvidence::this.allEvidenceChain=:<',this.allEvidenceChain,'>');
    }
    for(const chainId in this.allEvidenceChain) {
      if(this.trace0) {
        console.log('DidDocumentStateMachine::loadEvidence::chainId=:<',chainId,'>');
      }
      const chain = this.allEvidenceChain[chainId];
      if(this.trace0) {
        console.log('DidDocumentStateMachine::loadEvidence::chain=:<',chain,'>');
      }
      if(!this.chainState[chainId]) {
        this.chainState[chainId] = new DidChainStateMachine(self);
      }
      if(this.trace0) {
        console.log('DidDocumentStateMachine::loadEvidence::this.chainState=:<',this.chainState,'>');
      }
      await this.caclChainEvidence_(chainId,chain);
      const proofLinks = await this.evidence.getAllProofLinks();
      if(this.trace2) {
        console.log('DidDocumentStateMachine::loadEvidence::proofLinks=<',proofLinks,'>');
      }
      this.buildChainGraph_(proofLinks);
      if(this.trace2) {
        console.log('DidDocumentStateMachine::loadEvidence::this.didSpaceGraphs=<',this.didSpaceGraphs,'>');
      }
      this.dumpState_();
    }
    this.caclWholeChainProofPath_();
    this.eeInternal.emit('did:document:evidence.complete',{});
    return;
  }
  async caclDidDocument(didDoc) {
    if(this.trace2) {
      console.log('DidDocumentStateMachine::caclDidDocument::didDoc=<',didDoc,'>');
    }
    const didAddress = didDoc.id;
    if(this.trace2) {
      console.log('DidDocumentStateMachine::caclDidDocument::didAddress=<',didAddress,'>');
    }
    const concernAddress = Array.from(new Set(didDoc.controller.concat([didDoc.id])));
    if(this.trace2) {
      console.log('DidDocumentStateMachine::caclDidDocument::concernAddress=<',concernAddress,'>');
    }
    const stableTree = await this.evidence.getAddressStable(concernAddress);
    const docProofResult = this.builder.caclDidDocument(didDoc,stableTree);
    if(this.trace2) {
      console.log('DidDocumentStateMachine::caclDidDocument::docProofResult=<',docProofResult,'>');
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
  }

  async loadEvidenceChainFromStorage_() {
    const evidencesJson = await this.document.getAnyDidDocument();
    if(this.trace2) {
      console.log('DidDocumentStateMachine::loadEvidenceChainFromStorage_::evidencesJson=<',evidencesJson,'>');
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
  
  async caclChainEvidence_(chainId,chain) {
    if(this.trace2) {
      console.log('DidDocumentStateMachine::caclChainEvidence_::chainId=<',chainId,'>');
      console.log('DidDocumentStateMachine::caclChainEvidence_::chain=<',chain,'>');
    }
    const sortedDidByUpdated = sortDidByUpdated(chain);
    if(this.trace2) {
      console.log('DidDocumentStateMachine::caclChainEvidence_::sortedDidByUpdated=<',sortedDidByUpdated,'>');
    }
    for(const didDoc of sortedDidByUpdated) {
      if(this.trace2) {
        console.log('DidDocumentStateMachine::caclChainEvidence_::didDoc=<',didDoc,'>');
      }
      const proofLink = this.builder.buildEvidenceChainProof(didDoc);
      if(this.trace2) {
        console.log('DidDocumentStateMachine::caclChainEvidence_::chainId=<',chainId,'>');
        console.log('DidDocumentStateMachine::caclChainEvidence_::proofLink=<',proofLink,'>');
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
  buildChainGraph_(proofLinks) {
    for(const proofLink of proofLinks) {
      if(!this.didSpaceGraphs[proofLink.didId]) {
        this.didSpaceGraphs[proofLink.didId] = new Graph();
      }
      const graph = this.didSpaceGraphs[proofLink.didId];
      if(!graph.hasNode(proofLink.proofer)) {
        graph.addNode(proofLink.proofer);
      }
      if(!graph.hasNode(proofLink.proofee)) {
        graph.addNode(proofLink.proofee);
      }
      if(!graph.hasEdge(proofLink.proofer,proofLink.proofee)) {
        graph.addEdge(proofLink.proofer,proofLink.proofee);
      }
    }
    if(this.trace2) {
      console.log('DidDocumentStateMachine::buildChainGraph_::this.didSpaceGraphs=<',this.didSpaceGraphs,'>');
    }
  }
  caclWholeChainProofPath_() {
    for(const chainId in this.allEvidenceChain) {
      if(this.trace0) {
        console.log('DidDocumentStateMachine::caclWholeChainProofPath_::chainId=:<',chainId,'>');
      }
      const chain = this.allEvidenceChain[chainId];
      if(!chain) {
        continue;
      }
      if(this.trace0) {
        console.log('DidDocumentStateMachine::caclWholeChainProofPath_::chain=:<',chain,'>');
      }
      const chainGraph = this.didSpaceGraphs[chainId];
      if(this.trace0) {
        console.log('DidDocumentStateMachine::caclWholeChainProofPath_::chainGraph=:<',chainGraph,'>');
      }
      if(!chainGraph) {
        continue;
      }
      this.caclOneChainProofPath_(chain,chainGraph);
      //this.buildChainGraph_(proofLinks);
    }    
  }
  caclOneChainProofPath_(chain,chainGraph) {
    if(this.trace0) {
      console.log('DidDocumentStateMachine::caclWholeChainProofPath_::chain=:<',chain,'>');
      console.log('DidDocumentStateMachine::caclWholeChainProofPath_::chainGraph=:<',chainGraph,'>');
    }
    for(const didDoc of chain) {
      this.caclDidDocumentProofPath_(didDoc,chainGraph);
    }
  }
  caclDidDocumentProofPath_(didDoc,chainGraph) {
    if(this.trace0) {
      console.log('DidDocumentStateMachine::caclDidDocumentProofPath_::didDoc=:<',didDoc,'>');
      console.log('DidDocumentStateMachine::caclDidDocumentProofPath_::chainGraph=:<',chainGraph,'>');
    }
    for(const auth of didDoc.authentication) {
      if(this.trace0) {
        console.log('DidDocumentStateMachine::caclDidDocumentProofPath_::auth=:<',auth,'>');
      }
      const seedId = didDoc.id.replace('did:otmc:','');
      const targetSeedNode = `${didDoc.id}#${seedId}`;
      if(this.trace0) {
        console.log('DidDocumentStateMachine::caclDidDocumentProofPath_::targetSeedNode=:<',targetSeedNode,'>');
      }
      const path = dijkstra.bidirectional(chainGraph, auth, targetSeedNode);
      if(this.trace0) {
        console.log('DidDocumentStateMachine::caclDidDocumentProofPath_::path=:<',path,'>');
      }
    }
  }
  
  dumpState_() {
    for(const chainId in this.chainState) {
      const state = this.chainState[chainId];
      if(this.trace2) {
        console.log('DidDocumentStateMachine::dumpState_::state.value=<',state.value,'>');
      }
    }
  }
  /*
  async saveAuthedDid2Tree_(chainId,didDoc,proofList,authedList) {
    if(this.trace2) {
      console.log('DidDocumentStateMachine::saveAuthedDid2Tree_::chainId=<',chainId,'>');
      console.log('DidDocumentStateMachine::saveAuthedDid2Tree_::didDoc=<',didDoc,'>');
      console.log('DidDocumentStateMachine::saveAuthedDid2Tree_::proofList=<',proofList,'>');
      console.log('DidDocumentStateMachine::saveAuthedDid2Tree_::authedList=<',authedList,'>');
    }
    for(const proofKeyId of proofList) {
      if(this.trace2) {
        console.log('DidDocumentStateMachine::saveAuthedDid2Tree_::proofKeyId=<',proofKeyId,'>');
      }
      for(const authedKeyId in authedList) {
        const authedKeyState = authedList[authedKeyId];
        if(this.trace2) {
          console.log('DidDocumentStateMachine::saveAuthedDid2Tree_::authedKeyId=<',authedKeyId,'>');
          console.log('DidDocumentStateMachine::saveAuthedDid2Tree_::authedKeyState=<',authedKeyState,'>');
        }
        await this.evidence.putStable(chainId,proofKeyId,authedKeyId,authedKeyState);
      }
    }
    this.stableTree = await this.evidence.getAllStable();
  }
*/
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

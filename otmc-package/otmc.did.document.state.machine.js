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
    this.seedReachTable = {};
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
      self.loadEvidenceChain();      
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
      this.buildChainGraph_(proofLinks);
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
      console.log('DidDocumentStateMachine::caclDidDocument::this.seedReachTable=<',this.seedReachTable,'>');
    }
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
      docProofResult = this.builder.collectControllerAuth(didDoc,this.seedReachTable);
    }
    if(didType.ctrlee){
      const controlleeReachTable = this.buildControlleeReachTable_(didDoc);
      docProofResult = this.builder.collectControlleeAuth(didDoc,controlleeReachTable);
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
      ctrler:didType.ctrler,
      ctrlee:didType.ctrlee,
      seed:seed,
      bud:!seed
    }
    if(!docProofResult) {
      this.eeInternal.emit('did:document.auth.result', result);
      return;
    }
    if(!docProofResult.authList) {
      this.eeInternal.emit('did:document.auth.result', result);
      return;
    }
    const myAuthId = `${didAddress}#${myAddress}`;
    if(this.trace2) {
      console.log('DidDocumentStateMachine::caclDidDocument::myAuthId=<',myAuthId,'>');
    }
    const isProofedNode = docProofResult.authList.includes(myAuthId);
    if(this.trace2) {
      console.log('DidDocumentStateMachine::caclDidDocument::isProofedNode=<',isProofedNode,'>');
    }
    result.proofed = isProofedNode;
    this.eeInternal.emit('did:document.auth.result', result);
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
      if(!graph.hasEdge(proofLink.proofee,proofLink.proofer)) {
        graph.addEdge(proofLink.proofee,proofLink.proofer);
      }
    }
    if(this.trace2) {
      console.log('DidDocumentStateMachine::buildChainGraph_::this.didSpaceGraphs=<',this.didSpaceGraphs,'>');
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
      const chainGraph = this.didSpaceGraphs[chainId];
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
      this.buildDidDocumentProofPath_(didDoc,chainGraph);
    }
  }
  buildDidDocumentProofPath_(didDoc,chainGraph) {
    if(this.trace0) {
      console.log('DidDocumentStateMachine::buildDidDocumentProofPath_::didDoc=:<',didDoc,'>');
      console.log('DidDocumentStateMachine::buildDidDocumentProofPath_::chainGraph=:<',chainGraph,'>');
    }
    if(!this.seedReachTable[didDoc.id]) {
      this.seedReachTable[didDoc.id] = {};
    }
    const seedReach = this.seedReachTable[didDoc.id];
    for(const auth of didDoc.authentication) {
      if(this.trace0) {
        console.log('DidDocumentStateMachine::buildDidDocumentProofPath_::auth=:<',auth,'>');
      }
      const seedId = didDoc.id.replace('did:otmc:','');
      const targetSeedNode = `${didDoc.id}#${seedId}`;
      if(this.trace0) {
        console.log('DidDocumentStateMachine::buildDidDocumentProofPath_::targetSeedNode=:<',targetSeedNode,'>');
      }
      const path = dijkstra.bidirectional(chainGraph, auth, targetSeedNode);
      if(this.trace0) {
        console.log('DidDocumentStateMachine::buildDidDocumentProofPath_::auth=:<',auth,'>');
        console.log('DidDocumentStateMachine::buildDidDocumentProofPath_::targetSeedNode=:<',targetSeedNode,'>');
        console.log('DidDocumentStateMachine::buildDidDocumentProofPath_::path=:<',path,'>');
      }
      if(path) {
        seedReach[auth] = {
          reachable: true,
          path: path
        };
      } else {
        seedReach[auth] = {
          reachable: false
        };
      }
    }
    if(this.trace0) {
      console.log('DidDocumentStateMachine::buildDidDocumentProofPath_::this.seedReachTable=:<',this.seedReachTable,'>');
    }
  }
  /**
   * Given a did document, build the controllee reach table
   * @param {Object} didDoc - the did document
   */
  buildControlleeReachTable_(didDoc) {
    if(this.trace2) {
      console.log('DidDocumentStateMachine::buildControlleeReachTable_::didDoc=<',didDoc,'>');
      console.log('DidDocumentStateMachine::buildControlleeReachTable_::this.didSpaceGraphs=<',this.didSpaceGraphs,'>');
    }
    const ctrleeReachTable = {};
    const chainGraph = this.didSpaceGraphs[didDoc.id];
    for(const controller of didDoc.controller) {
      if(this.trace2) {
        console.log('DidDocumentStateMachine::buildControlleeReachTable_::controller=<',controller,'>');
      }
      const ctrlerReachTable = this.seedReachTable[controller];
      if(this.trace2) {
        console.log('DidDocumentStateMachine::buildControlleeReachTable_::ctrlerReachTable=<',ctrlerReachTable,'>');
      }
      for(const reachAuth in ctrlerReachTable) {
        const reachObj = ctrlerReachTable[reachAuth];
        if(this.trace2) {
          console.log('DidDocumentStateMachine::buildControlleeReachTable_::reachAuth=<',reachAuth,'>');
          console.log('DidDocumentStateMachine::buildControlleeReachTable_::reachObj=<',reachObj,'>');
        }
        if(reachObj.reachable) {
          for(const auth of didDoc.authentication) {
            try {
              const path = dijkstra.bidirectional(chainGraph, auth, reachAuth);
              if(this.trace2) {
                console.log('DidDocumentStateMachine::buildControlleeReachTable_::path=<',path,'>');
              }
              if(path){
                ctrleeReachTable[auth] = {
                  reachable: true,
                  path: path
                };        
              } else {
                ctrleeReachTable[auth] = {
                  reachable: false,
                };        
              }
            }
            catch(e) {
              //console.log('DidDocumentStateMachine::buildControlleeReachTable_::e=<',e,'>');
            }
          }
        }
      }
    }
    if(this.trace2) {
      console.log('DidDocumentStateMachine::buildControlleeReachTable_::ctrleeReachTable=<',ctrleeReachTable,'>');
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

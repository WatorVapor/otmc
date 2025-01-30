const LOG = {
  trace:true,
  debug:true,
};
import {Graph} from 'graphology';
import {dijkstra} from 'graphologyShortestPath';

if(LOG.debug) {
  console.log('::Graph=<',Graph,'>');
  console.log('::dijkstra=<',dijkstra,'>');
}
/**
*
*/
export class DidDocumentGraphology {
  constructor() {
    this.trace0 = true;
    this.trace1 = true;
    this.trace2 = true;
    this.trace = true;
    this.debug = true;
    this.didSpaceGraphs = {};
    this.seedReachTable = {};
  }
  buildChainGraph(proofLinks) {
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
    if(this.trace) {
      console.log('DidDocumentGraphology::buildChainGraph::this.didSpaceGraphs=<',this.didSpaceGraphs,'>');
    }
  }
  GetDidSpaceGraphs(chainId) {
    return this.didSpaceGraphs[chainId];
  }
  buildDidDocumentProofPath(didDoc,chainGraph) {
    if(this.trace0) {
      console.log('DidDocumentGraphology::buildDidDocumentProofPath::didDoc=:<',didDoc,'>');
      console.log('DidDocumentGraphology::buildDidDocumentProofPath::chainGraph=:<',chainGraph,'>');
    }
    if(!this.seedReachTable[didDoc.id]) {
      this.seedReachTable[didDoc.id] = {};
    }
    const seedReach = this.seedReachTable[didDoc.id];
    for(const auth of didDoc.authentication) {
      if(this.trace0) {
        console.log('DidDocumentGraphology::buildDidDocumentProofPath::auth=:<',auth,'>');
      }
      const seedId = didDoc.id.replace('did:otmc:','');
      const targetSeedNode = `${didDoc.id}#${seedId}`;
      if(this.trace0) {
        console.log('DidDocumentGraphology::buildDidDocumentProofPath::targetSeedNode=:<',targetSeedNode,'>');
      }
      try {
        const path = dijkstra.bidirectional(chainGraph, auth, targetSeedNode);
        if(this.trace0) {
          console.log('DidDocumentGraphology::buildDidDocumentProofPath::auth=:<',auth,'>');
          console.log('DidDocumentGraphology::buildDidDocumentProofPath::targetSeedNode=:<',targetSeedNode,'>');
          console.log('DidDocumentGraphology::buildDidDocumentProofPath::path=:<',path,'>');
        }
        if(path) {
          seedReach[auth] = {
            reachable: true,
            path: path
          };
        } else {
          if(!seedReach[auth]) {
            seedReach[auth] = {
              reachable: false
            };
          }
        }
      } catch(err) {  
        if(!seedReach[auth]) {
          seedReach[auth] = {
            reachable: false,
          };
        }
      }
    }
    if(this.trace0) {
      console.log('DidDocumentGraphology::buildDidDocumentProofPath::this.seedReachTable=:<',this.seedReachTable,'>');
    }
  }
  /**
   * Given a did document, build the controllee reach table
   * @param {Object} didDoc - the did document
   */
  buildControlleeReachTable(didDoc) {
    if(this.trace2) {
      console.log('DidDocumentGraphology::buildControlleeReachTable::didDoc=<',didDoc,'>');
      console.log('DidDocumentGraphology::buildControlleeReachTable::this.didSpaceGraphs=<',this.didSpaceGraphs,'>');
    }
    const ctrleeReachTable = {};
    const chainGraph = this.didSpaceGraphs[didDoc.id];
    for(const controller of didDoc.controller) {
      if(this.trace2) {
        console.log('DidDocumentGraphology::buildControlleeReachTable::controller=<',controller,'>');
      }
      const ctrlerReachTable = this.seedReachTable[controller];
      if(this.trace2) {
        console.log('DidDocumentGraphology::buildControlleeReachTable::ctrlerReachTable=<',ctrlerReachTable,'>');
      }
      for(const reachAuth in ctrlerReachTable) {
        const reachObj = ctrlerReachTable[reachAuth];
        if(this.trace2) {
          console.log('DidDocumentGraphology::buildControlleeReachTable::reachAuth=<',reachAuth,'>');
          console.log('DidDocumentGraphology::buildControlleeReachTable::reachObj=<',reachObj,'>');
        }
        if(reachObj.reachable) {
          for(const auth of didDoc.authentication) {
            if(this.trace2) {
              console.log('DidDocumentGraphology::buildControlleeReachTable::auth=<',auth,'>');
            }    
            try {
              const path = dijkstra.bidirectional(chainGraph, auth, reachAuth);
              if(this.trace2) {
                console.log('DidDocumentGraphology::buildControlleeReachTable::path=<',path,'>');
              }
              if(path){
                ctrleeReachTable[auth] = {
                  reachable: true,
                  path: path
                };        
              } else {
                if(!ctrleeReachTable[auth]) {
                  ctrleeReachTable[auth] = {
                    reachable: false,
                  };
                }        
              }
            }
            catch(err) {
              //console.log('DidDocumentGraphology::buildControlleeReachTable::err=<',err,'>');
              if(!ctrleeReachTable[auth]) {
                ctrleeReachTable[auth] = {
                  reachable: false,
                };
              }
            }
          }
        }
      }
    }
    if(this.trace2) {
      console.log('DidDocumentGraphology::buildControlleeReachTable::ctrleeReachTable=<',ctrleeReachTable,'>');
    }
    return ctrleeReachTable;
  }
}

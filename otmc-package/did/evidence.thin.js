const includesAnyByDidKey = (setArr,value ) => setArr.some(attr => attr.endsWith(value));
export class EvidenceChainBuilder {
  static trace1 = true;
  static trace2 = true;
  static trace3 = true;
  static trace4 = true;
  static trace5 = true;
  static trace = true;
  static debug = true;

  constructor(auth) {
    this.trace1 = true;
    this.trace2 = true;
    this.trace3 = true;
    this.trace4 = true;
    this.trace5 = true;
    this.trace = true;
    this.debug = true;
    this.auth_ = auth;
    this.tree_ = {};
    this.seed_ = {};
    this.didRule_ = {};
    this.authsOfDid_ = {};
  }
  buildEvidenceChainProof(evidence) {
    if(this.trace1) {
      console.log('EvidenceChainBuilder::buildEvidenceChainProof::evidence=<',evidence,'>');
    }
    const seedKeyId = evidence.id.replace('did:otmc:','');
    if(this.trace1) {
      console.log('EvidenceChainBuilder::buildEvidenceChainProof::seedKeyId=<',seedKeyId,'>');
    }
    const isGoodDid = this.auth_.verifyDid(evidence);
    if(this.trace1) {
      console.log('EvidenceChainBuilder::buildEvidenceChainProof::isGoodDid=<',isGoodDid,'>');
    }
    if(!isGoodDid) {
      return result;
    }
    if(!isGoodDid.prooferAddress) {
      return result;
    }
    if(isGoodDid.prooferAddress.length < 1) {
      return result;
    }
    const result = {
      proofers:isGoodDid.prooferAddress,
      proofees:evidence.authentication
    }
    return result;
  }
  judgeEvidenceDidType(evidenceDid) {
    let isCtrler = false;
    let controllers = [];
    if(this.trace1) {
      console.log('EvidenceChainBuilder::judgeEvidenceDidType::evidenceDid=<',evidenceDid,'>');
    }
    const isInController = evidenceDid.controller.includes(evidenceDid.id);
    if(this.trace1) {
      console.log('EvidenceChainBuilder::judgeEvidenceDidType::isInController=<',isInController,'>');
    }
    if(isInController) {
      isCtrler = true;
    } else {
      controllers.push(evidenceDid.controller);
    }
    controllers = controllers.flat();
    if(this.trace1) {
      console.log('EvidenceChainBuilder::judgeEvidenceDidType::controllers=<',controllers,'>');
    }
    controllers = [...new Set(controllers)];
    if(this.trace1) {
      console.log('EvidenceChainBuilder::judgeEvidenceDidType::controllers=<',controllers,'>');
    }
    const chainType = {
      ctrler:isCtrler,
      controllers:controllers
    };
    return chainType;
  }
  buildEvidenceProofChainCtrler_(evidenceDid,manifest,proofTree) {
    if(this.trace1) {
      console.log('EvidenceChainBuilder::buildEvidenceProofChainCtrler_::evidenceDid=<',evidenceDid,'>');
    }
    const seedKeyId = evidenceDid.id.replace('did:otmc:','');
    if(this.trace1) {
      console.log('EvidenceChainBuilder::buildEvidenceProofChainCtrler_::seedKeyId=<',seedKeyId,'>');
    }
    const isGoodDid = this.auth_.verifyDid(evidenceDid);
    if(this.trace1) {
      console.log('EvidenceChainBuilder::buildEvidenceProofChainCtrler_::isGoodDid=<',isGoodDid,'>');
    }
    const result = {
      ctrler:true,
      ctrlee:false,
      seed:false,
      bud:false,
      proofers:[],
      proofees:{},
    };
    if(!isGoodDid) {
      return result;
    }
    if(!isGoodDid.prooferAddress) {
      return result;
    }
    if(isGoodDid.prooferAddress.length < 1) {
      return result;
    }

    const isSeedProofed = isGoodDid.prooferAddress.reduce((found,current) => {
      return found || current.endsWith(seedKeyId);
    },false);

    if(this.trace1) {
      console.log('EvidenceChainBuilder::buildEvidenceProofChainCtrler_::isSeedProofed=<',isSeedProofed,'>');
    }
    const {authedList,authedDict} = this.collectAuthKeyAddress_(evidenceDid.authentication,seedKeyId);
    if(this.trace1) {
      console.log('EvidenceChainBuilder::buildEvidenceProofChainCtrler_::authedList=<',authedList,'>');
      console.log('EvidenceChainBuilder::buildEvidenceProofChainCtrler_::authedDict=<',authedDict,'>');
    }
    if(isSeedProofed) {
      result.proofers = isGoodDid.prooferAddress;
      result.proofees = authedDict;
    } else {
    }

    if(isGoodDid.proofList && isGoodDid.proofList.authProof && isGoodDid.proofList.authProof.length > 0){
      result.seed = isGoodDid.proofList.authProof.includes(seedKeyId);
      if(result.seed) {
        result.authed = true;
        result.proofList = isGoodDid.proofList.authProof;
        if(manifest && manifest.authentication) {
          switch(manifest.authentication.policy) {
            case 'Seed.Dogma':
              result.authedList[seedKeyId] = authedDict[seedKeyId];
              break;
            case 'Root.Dogma':
            case 'Proof.Chain':
              result.authedList = authedDict;
              default:
              break;
          }
        }
      } else {
        result.bud = true;
        const authedByChain = this.collectAuthedFromeChain_(isGoodDid.proofList.authProof,manifest,proofTree);
        if(authedByChain) {
          result.proofList = isGoodDid.proofList.authProof;
          if(authedByChain.isAuthed) {
            result.authed = true;
          }
          if(authedByChain.conductive) {
            result.authedList = authedDict;
          }
        }
      }
    }
    if(this.trace3) {
      console.log('EvidenceChainBuilder::buildEvidenceProofChainCtrler_::result=<',result,'>');
    }
    return result;
  }

  collectAuthKeyAddress_(authentication,seedKeyId) {
    const authedList = [];
    const authedDict = {};
    for(const authDid of authentication) {
      const authId = authDid.split('#').slice(-1)[0];
      authedList.push(authId);
      if(seedKeyId === authId) {
        authedDict[authId] ={
          ctrler:true,
          ctrlee:false,
          seed:true,
          bud:false
        }
      } else {
        authedDict[authId] = {
          ctrler:true,
          ctrlee:false,
          seed:false,
          bud:true
        }
      }
    }
    if(this.trace3) {
      console.log('EvidenceChainBuilder::collectAuthKeyAddress_::authedList=<',authedList,'>');
      console.log('EvidenceChainBuilder::collectAuthKeyAddress_::authedDict=<',authedDict,'>');
    }
    return {authedList:authedList,authedDict:authedDict};
  }

  buildEvidenceProofChainCtrlee_(evidenceDid,manifest,proofTree) {
    if(this.trace1) {
      console.log('EvidenceChainBuilder::buildEvidenceProofChainCtrlee_::evidenceDid=<',evidenceDid,'>');
    }
    const seedKeyId = evidenceDid.id.replace('did:otmc:','');
    if(this.trace1) {
      console.log('EvidenceChainBuilder::buildEvidenceProofChainCtrlee_::seedKeyId=<',seedKeyId,'>');
    }
    const isGoodDid = this.auth_.verifyDid(evidenceDid);
    if(this.trace1) {
      console.log('EvidenceChainBuilder::buildEvidenceProofChainCtrlee_::isGoodDid=<',isGoodDid,'>');
    }
    const result = {
      authed:false,
      ctrler:false,
      ctrlee:true,
      seed:false,
      bud:false,
      proofList:{},
      authedList:{},
    };
    if(isGoodDid && isGoodDid.proofList){
      const authedList = [];
      const authedDict = {};
      for(const authDid of evidenceDid.authentication) {
        const authId = authDid.split('#').slice(-1)[0];
        authedList.push(authId);
        if(seedKeyId === authId) {
          authedDict[authId] ={
            ctrler:false,
            ctrlee:true,
            seed:true,
            bud:false
          }
        } else {
          authedDict[authId] = {
            ctrler:false,
            ctrlee:true,
            seed:false,
            bud:true
          }
        }
      }
      if(this.trace3) {
        console.log('EvidenceChainBuilder::buildEvidenceProofChainCtrlee_::authedList=<',authedList,'>');
        console.log('EvidenceChainBuilder::buildEvidenceProofChainCtrlee_::authedDict=<',authedDict,'>');
      }
      if(isGoodDid.proofList && isGoodDid.proofList.authProof && isGoodDid.proofList.authProof.length > 0){
        for(const authProof of isGoodDid.proofList.authProof) {
          if(this.trace3) {
            console.log('EvidenceChainBuilder::buildEvidenceProofChainCtrlee_::authProof=<',authProof,'>');
            console.log('EvidenceChainBuilder::buildEvidenceProofChainCtrlee_::evidenceDid=<',evidenceDid,'>');
          }
          if(seedKeyId === authProof) {
            result.seed = true;
          }
        }
        if(!result.seed) {
          result.bud = true;
        }
        const authedByChain = this.collectAuthedFromeChain_(isGoodDid.proofList.authProof,manifest,proofTree);
        if(authedByChain) {
          if(authedByChain.authed) {
            result.authed = true;
            result.proofList= isGoodDid.proofList.authProof;
          }
          if(authedByChain.conductive) {
            result.authedList = authedDict;
          }
        }
      }
    }
    if(this.trace3) {
      console.log('EvidenceChainBuilder::buildEvidenceProofChainCtrlee_::result=<',result,'>');
    }
    return result;
  }


  collectAuthedFromeChain_(authProof,manifest,proofTree) {
    if(this.trace3) {
      console.log('EvidenceChainBuilder::collectAuthedFromeChain_::authProof=<',authProof,'>');
      console.log('EvidenceChainBuilder::collectAuthedFromeChain_::manifest=<',manifest,'>');
      console.log('EvidenceChainBuilder::collectAuthedFromeChain_::proofTree=<',proofTree,'>');
    }
    for(const authId of authProof) {
      const authedDid = proofTree[authId];
      if(this.trace3) {
        console.log('EvidenceChainBuilder::collectAuthedFromeChain_::authedDid=<',authedDid,'>');
      }
      if(authedDid) {
        if(manifest && manifest.authentication) {
          switch(manifest.authentication.policy) {
            case 'Seed.Dogma':
              if(authedDid.seed) {
                return {
                  authed:true,
                  conductive:false,
                };
              }
              break;
            case 'Root.Dogma':
              if(authedDid.isRoot) {
                return {
                  authed:true,
                  conductive:false,
                };
              }
              break;
            case 'Proof.Chain':
              return {
                authed:true,
                conductive:true,
              };
            default:
              break;
          }
        }
      }
    } 
    return false;
  }
  /**
   * calculate the evidence chain for a given did document
   * @param {Object} didDoc - the did document to be calculated
   * @param {Object} seedReachTable - the seed reach table
   * @returns {Object} - the calculated evidence chain
   */
  caclStoredDidDocument(didDoc,seedReachTable) {
    if(this.trace1) {
      console.log('EvidenceChainBuilder::caclStoredDidDocument::didDoc=<',didDoc,'>');
      console.log('EvidenceChainBuilder::caclStoredDidDocument::seedReachTable=<',seedReachTable,'>');
    }
    const concernAddress = Array.from(new Set(didDoc.controller.concat([didDoc.id])));
    if(this.trace2) {
      console.log('EvidenceChainBuilder::caclStoredDidDocument::concernAddress=<',concernAddress,'>');
    }
    const isGoodDid = this.auth_.verifyDid(didDoc);
    if(this.trace1) {
      console.log('EvidenceChainBuilder::caclStoredDidDocument::isGoodDid=<',isGoodDid,'>');
    }
    const manifest = didDoc.otmc.manifest;
    if(this.trace1) {
      console.log('EvidenceChainBuilder::caclStoredDidDocument::manifest=<',manifest,'>');
    }
    if(isGoodDid) {
      const result = {};
      const chainType = this.judgeEvidenceDidType(didDoc);
      if(this.trace1) {
        console.log('EvidenceChainBuilder::caclStoredDidDocument::chainType=<',chainType,'>');
      }
      if(chainType.ctrler) {
        result.authList = this.collectControllerAuthFromReachTable_(didDoc.authentication,seedReachTable[didDoc.id],manifest.did.authentication);
      } else {
        //
      }
      return result;
    }
    return false;
  }
  /**
   * Collect the authentication from the reach table, given a list of authentication, the seed reach table, and the manifest.
   * @param {Array} authentication - the list of authentication
   * @param {Object} reachTable - the seed reach table
   * @param {Object} manifest - the manifest
   * @returns {Object} - the collected authentication
   */
  collectControllerAuthFromReachTable_(authentication,reachTable,manifest) {
    if(this.trace1) {
      console.log('EvidenceChainBuilder::collectControllerAuthFromReachTable_::authentication=<',authentication,'>');
      console.log('EvidenceChainBuilder::collectControllerAuthFromReachTable_::reachTable=<',reachTable,'>');
      console.log('EvidenceChainBuilder::collectControllerAuthFromReachTable_::manifest=<',manifest,'>');
    }
    const resultAuthed = [];
    for(const auth of authentication) {
      const seedReach = reachTable[auth];
      if(this.trace1) {
        console.log('EvidenceChainBuilder::collectControllerAuthFromReachTable_::seedReach=<',seedReach,'>');
      }
      if(seedReach.reachable) {
        if(manifest.policy === 'Proof.Chain') {
          resultAuthed.push(auth);
        }
        if(manifest.policy === 'Seed.Dogma') {
          if(seedReach.path.length === 1) {
            resultAuthed.push(auth);
          }
        }
      }
    }
    return resultAuthed;   
  }
  judgeDidAuthProof_(authProofList,manifest,stableTreeOfAddress) {
    if(this.trace1) {
      console.log('EvidenceChainBuilder::judgeDidAuthProof_::authProofList=<',authProofList,'>');
      console.log('EvidenceChainBuilder::judgeDidAuthProof_::manifest=<',manifest,'>');
      console.log('EvidenceChainBuilder::judgeDidAuthProof_::stableTreeOfAddress=<',stableTreeOfAddress,'>');
    }
    const allAuthed = [];
    for(const authProof of authProofList) {
      if(this.trace1) {
        console.log('EvidenceChainBuilder::judgeDidAuthProof_::authProof=<',authProof,'>');
      }
      const authedDid = stableTreeOfAddress[authProof];
      if(this.trace1) {
        console.log('EvidenceChainBuilder::judgeDidAuthProof_::authedDid=<',authedDid,'>');
      }
      if(authedDid) {
        allAuthed.push(authedDid);
      }
    }
    const uniqueAuthed = Array.from(new Set(allAuthed)).flat();
    if(this.trace1) {
      console.log('EvidenceChainBuilder::judgeDidAuthProof_::uniqueAuthed=<',uniqueAuthed,'>');
    }
    return uniqueAuthed;
  }
}

const includesAny = (arr, values) => values.some(v => arr.includes(v));
const isSubsetById = (subset, superset) => {
  if(!subset || !superset) {
    return false;
  }
  return subset.every(subsetItem => 
    superset.some(supersetItem => 
      subsetItem.id === supersetItem.id
    )
  );  
};

const isSubsetByElem = (subset, superset) => {
  if(!subset || !superset) {
    return false;
  }
  return subset.every(subsetItem => 
    superset.some(supersetItem => 
      subsetItem === supersetItem
    )
  );  
};

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
  judgeEvidenceDidType(evidenceDid,evidenceChain) {
    if(this.trace1) {
      console.log('EvidenceChainBuilder::judgeEvidenceDidType::evidenceDid=<',evidenceDid,'>');
      console.log('EvidenceChainBuilder::judgeEvidenceDidType::evidenceChain=<',evidenceChain,'>');
    }
    let isCtrler = false;
    let isCtrlee = false;
    const isInController = evidenceDid.controller.includes(evidenceDid.id);
    if(this.trace1) {
      console.log('EvidenceChainBuilder::judgeEvidenceDidType::isInController=<',isInController,'>');
    }
    if(isInController) {
      isCtrler = true;
    } else {
      isCtrlee = true;
    }
    if(evidenceDid.controller.length  < 1) {
      for(const evidence of evidenceChain) {
        if(evidence.controller.length > 0) {
          return this.judgeEvidenceDidType(evidence,evidenceChain);
        }
      }
    }
    const chainType = {
      ctrler:isCtrler,
      ctrlee:isCtrlee,
    };
    return chainType;
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
   * Given a did document, collect the controller's authentication from the reach table
   * @param {Object} didDoc - the did document
   * @param {Object} seedReachTable - the reach table
   * @returns {Object} - an object with a single property, authList, which is an array of strings
   *                     which are the authentication controllers of the did document
   */
  collectControllerAuth(didDoc,seedReachTable) {
    if(this.trace1) {
      console.log('EvidenceChainBuilder::caclStoredDidDocument::didDoc=<',didDoc,'>');
      console.log('EvidenceChainBuilder::caclStoredDidDocument::seedReachTable=<',seedReachTable,'>');
    }
    const isGoodDid = this.auth_.verifyDid(didDoc);
    if(this.trace1) {
      console.log('EvidenceChainBuilder::caclStoredDidDocument::isGoodDid=<',isGoodDid,'>');
    }
    const manifest = didDoc.otmc.manifest;
    if(this.trace1) {
      console.log('EvidenceChainBuilder::caclStoredDidDocument::manifest=<',manifest,'>');
    }
    if(!manifest) {
      return false;
    }
    if(isGoodDid) {
      const authList = this.collectControllerAuthFromReachTable_(didDoc.authentication,seedReachTable[didDoc.id],manifest.did.authentication);
      return {authList:authList}
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
  /**
   * Collect the authentication from the reach table, given a list of authentication, the seed reach table, the controller, and the manifest.
   * @param {Array} authentication - the list of authentication
   * @param {String} controller - the controller
   * @param {Object} seedReachTable - the seed reach table
   * @param {Object} manifest - the manifest
   * @returns {Array} - the collected authentication
   */
  collectControlleeAuthFromReachTable_(authentication,controller,seedReachTable,manifest) {
    if(this.trace1) {
      console.log('EvidenceChainBuilder::collectControlleeAuthFromReachTable_::authentication=<',authentication,'>');
      console.log('EvidenceChainBuilder::collectControlleeAuthFromReachTable_::controller=<',controller,'>');
      console.log('EvidenceChainBuilder::collectControlleeAuthFromReachTable_::seedReachTable=<',seedReachTable,'>');
      console.log('EvidenceChainBuilder::collectControlleeAuthFromReachTable_::manifest=<',manifest,'>');
    }
    const resultAuthed = [];
    for(const auth of authentication) {
      const seedReach = reachTable[auth];
      if(this.trace1) {
        console.log('EvidenceChainBuilder::collectControlleeAuthFromReachTable_::seedReach=<',seedReach,'>');
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
}

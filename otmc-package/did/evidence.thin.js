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
  buildEvidenceProof(evidence,manifest,proofTree) {
    if(this.trace1) {
      console.log('EvidenceChainBuilder::buildEvidenceProof::evidence=<',evidence,'>');
      console.log('EvidenceChainBuilder::buildEvidenceProof::manifest=<',manifest,'>');
      console.log('EvidenceChainBuilder::buildEvidenceProof::proofTree=<',proofTree,'>');
    }
    const docType = this.judgeEvidenceDidType_(evidence);
    if(this.trace1) {
      console.log('EvidenceChainBuilder::buildEvidenceProof::docType=<',docType,'>');
    }
    let buildResult = false;
    if(docType.root) {
      buildResult = this.buildEvidenceProofChainRoot_(evidence,manifest,proofTree);
    } else {
      buildResult = this.buildEvidenceProofChainEndEntity_(evidence,manifest,proofTree);      
    }
    if(this.trace1) {
      console.log('EvidenceChainBuilder::buildEvidenceProof::buildResult=<',buildResult,'>');
    }
    return buildResult;
  }
  judgeEvidenceDidType_(evidenceDid) {
    let isRoot = false;
    let controllers = [];
    if(this.trace1) {
      console.log('EvidenceChainBuilder::judgeEvidenceDidType_::evidenceDid=<',evidenceDid,'>');
    }
    const isInController = evidenceDid.controller.includes(evidenceDid.id);
    if(this.trace1) {
      console.log('EvidenceChainBuilder::judgeEvidenceDidType_::isInController=<',isInController,'>');
    }
    if(isInController) {
      isRoot = true;
    } else {
      controllers.push(evidenceDid.controller);
    }
    controllers = controllers.flat();
    if(this.trace1) {
      console.log('EvidenceChainBuilder::judgeEvidenceDidType_::controllers=<',controllers,'>');
    }
    controllers = [...new Set(controllers)];
    if(this.trace1) {
      console.log('EvidenceChainBuilder::judgeEvidenceDidType_::controllers=<',controllers,'>');
    }
    const chainType = {
      root:isRoot,
      controllers:controllers
    };
    return chainType;
  }
  buildEvidenceProofChainRoot_(evidenceDid,manifest,proofTree) {
    if(this.trace1) {
      console.log('EvidenceChainBuilder::buildEvidenceProofChainRoot_::evidenceDid=<',evidenceDid,'>');
    }
    const seedKeyId = evidenceDid.id.replace('did:otmc:','');
    if(this.trace1) {
      console.log('EvidenceChainBuilder::buildEvidenceProofChainRoot_::seedKeyId=<',seedKeyId,'>');
    }
    const isGoodDid = this.auth_.verifyDid(evidenceDid);
    if(this.trace1) {
      console.log('EvidenceChainBuilder::buildEvidenceProofChainRoot_::isGoodDid=<',isGoodDid,'>');
    }
    const result = {
      authed:false,
      root:true,
      endEntity:false,
      seed:false,
      leaf:false,
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
            root:true,
            endEntity:false,
            seed:true,
            leaf:false
          }
        } else {
          authedDict[authId] = {
            root:true,
            endEntity:false,
            seed:false,
            leaf:true
          }
        }
      }
      if(this.trace3) {
        console.log('EvidenceChainBuilder::buildEvidenceProofChainRoot_::authedList=<',authedList,'>');
        console.log('EvidenceChainBuilder::buildEvidenceProofChainRoot_::authedDict=<',authedDict,'>');
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
          result.leaf = true;
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
    }
    if(this.trace3) {
      console.log('EvidenceChainBuilder::buildEvidenceProofChainRoot_::result=<',result,'>');
    }
    return result;
  }
  buildEvidenceProofChainEndEntity_(evidenceDid,manifest,proofTree) {
    if(this.trace1) {
      console.log('EvidenceChainBuilder::buildEvidenceProofChainEndEntity_::evidenceDid=<',evidenceDid,'>');
    }
    const seedKeyId = evidenceDid.id.replace('did:otmc:','');
    if(this.trace1) {
      console.log('EvidenceChainBuilder::buildEvidenceProofChainEndEntity_::seedKeyId=<',seedKeyId,'>');
    }
    const isGoodDid = this.auth_.verifyDid(evidenceDid);
    if(this.trace1) {
      console.log('EvidenceChainBuilder::buildEvidenceProofChainEndEntity_::isGoodDid=<',isGoodDid,'>');
    }
    const result = {
      authed:false,
      root:false,
      endEntity:true,
      seed:false,
      leaf:false,
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
            root:false,
            endEntity:true,
            seed:true,
            leaf:false
          }
        } else {
          authedDict[authId] = {
            root:false,
            endEntity:true,
            seed:false,
            leaf:true
          }
        }
      }
      if(this.trace3) {
        console.log('EvidenceChainBuilder::buildEvidenceProofChainEndEntity_::authedList=<',authedList,'>');
        console.log('EvidenceChainBuilder::buildEvidenceProofChainEndEntity_::authedDict=<',authedDict,'>');
      }
      if(isGoodDid.proofList && isGoodDid.proofList.authProof && isGoodDid.proofList.authProof.length > 0){
        for(const authProof of isGoodDid.proofList.authProof) {
          if(this.trace3) {
            console.log('EvidenceChainBuilder::buildEvidenceProofChainEndEntity_::authProof=<',authProof,'>');
            console.log('EvidenceChainBuilder::buildEvidenceProofChainEndEntity_::evidenceDid=<',evidenceDid,'>');
          }
          if(seedKeyId === authProof) {
            result.seed = true;
          }
        }
        if(!result.seed) {
          result.leaf = true;
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
      console.log('EvidenceChainBuilder::buildEvidenceProofChainEndEntity_::result=<',result,'>');
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
  caclDidDocument(didDoc,manifest,stableTreeOfAddress) {
    if(this.trace1) {
      console.log('EvidenceChainBuilder::caclDidDocument::didDoc=<',didDoc,'>');
      console.log('EvidenceChainBuilder::caclDidDocument::manifest=<',manifest,'>');
      console.log('EvidenceChainBuilder::caclDidDocument::stableTreeOfAddress=<',stableTreeOfAddress,'>');
    }
    const isGoodDid = this.auth_.verifyDid(didDoc);
    if(this.trace1) {
      console.log('EvidenceChainBuilder::caclDidDocument::isGoodDid=<',isGoodDid,'>');
    }
    if(isGoodDid && isGoodDid.proofList && isGoodDid.proofList.authProof) {
      return this.judgeDidAuthProof_(isGoodDid.proofList.authProof,manifest,stableTreeOfAddress); 
    }
    return false;
  }
  judgeDidAuthProof_(authProofList,manifest,stableTreeOfAddress) {
    if(this.trace1) {
      console.log('EvidenceChainBuilder::judgeDidAuthProof_::authProofList=<',authProofList,'>');
    }
    for(const authProof of authProofList) {
      if(this.trace1) {
        console.log('EvidenceChainBuilder::judgeDidAuthProof_::authProof=<',authProof,'>');
      }
      const authedDid = stableTreeOfAddress[authProof];
      if(this.trace1) {
        console.log('EvidenceChainBuilder::judgeDidAuthProof_::authedDid=<',authedDid,'>');
      }
      if(authedDid) {
        return authedDid;
      }
    }
    return false;
  }

  
  tryMergeStoredDidDocument() {
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::tryMergeStoredDidDocument::this.docTop_=<',this.docTop_,'>');
      console.log('EvidenceChain::tryMergeStoredDidDocument::this.evidencesJson_=<',this.evidencesJson_,'>');
    }
    if(!this.evidencesJson_) {
      return  false;
    }
    const topVerifyMethod = this.filtTopByArrayLength_(this.evidencesJson_,'verificationMethod');
     if(EvidenceChain.trace1) {
      console.log('EvidenceChain::tryMergeStoredDidDocument::topVerifyMethod=<',topVerifyMethod,'>');
    }
    const topAuthMethod = this.filtTopByArrayLength_(topVerifyMethod,'authentication');
     if(EvidenceChain.trace1) {
      console.log('EvidenceChain::tryMergeStoredDidDocument::topAuthMethod=<',topAuthMethod,'>');
    }
    const topCapabilityMethod = this.filtTopByArrayLength_(topVerifyMethod,'capabilityInvocation');
     if(EvidenceChain.trace1) {
      console.log('EvidenceChain::tryMergeStoredDidDocument::topCapabilityMethod=<',topCapabilityMethod,'>');
    }
    const topUpdated = this.filtTopByDate_(topCapabilityMethod,'updated');
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::tryMergeStoredDidDocument::topUpdated=<',topUpdated,'>');
    }
    const topProof = this.filtTopByArrayLength_(topUpdated,'proof');
     if(EvidenceChain.trace1) {
      console.log('EvidenceChain::tryMergeStoredDidDocument::topProof=<',topProof,'>');
    }
    if(topProof.length > 0) {
      return this.tryMergeTopStoredDidDocument(topProof[0]);
    } else {
      return false;
    }
  }
  tryMergeTopStoredDidDocument(topEvidence) {
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::tryMergeTopStoredDidDocument::topEvidence=<',topEvidence,'>');
      console.log('EvidenceChain::tryMergeTopStoredDidDocument::this.docTop_=<',this.docTop_,'>');
    }
    const proof = this.calcDidAuthInternal_(topEvidence);
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::tryMergeTopStoredDidDocument::proof=<',proof,'>');
    }
    const allVMethodInNew = isSubsetById(this.docTop_.verificationMethod,topEvidence.verificationMethod);
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::tryMergeTopStoredDidDocument::allVMethodInNew=<',allVMethodInNew,'>');
    }
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::tryMergeTopStoredDidDocument::this.docTop_.authentication=<',this.docTop_.authentication,'>');
      console.log('EvidenceChain::tryMergeTopStoredDidDocument::topEvidence.authentication=<',topEvidence.authentication,'>');
    }
    const allAuthInNew = isSubsetByElem(this.docTop_.authentication,topEvidence.authentication);
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::tryMergeTopStoredDidDocument::allAuthInNew=<',allAuthInNew,'>');
    }
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::tryMergeTopStoredDidDocument::this.docTop_.capabilityInvocation=<',this.docTop_.capabilityInvocation,'>');
      console.log('EvidenceChain::tryMergeTopStoredDidDocument::topEvidence.capabilityInvocation=<',topEvidence.capabilityInvocation,'>');
    }
    const allCapabilityInNew = isSubsetByElem(this.docTop_.capabilityInvocation,topEvidence.capabilityInvocation);
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::tryMergeTopStoredDidDocument::allCapabilityInNew=<',allCapabilityInNew,'>');
    }
    if(allVMethodInNew && allAuthInNew && allCapabilityInNew) {
      return topEvidence;
    } else {
      return false;
    }
  }
  
  filtTopByArrayLength_(origArr,propertyArr) {
    const sortElement = origArr.sort((a, b)=>{
      return b[propertyArr].length - a[propertyArr].length;
    });
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::filtTopByArrayLength_::sortElement=<',sortElement,'>');
    }
    const topElement = origArr.filter((a, b)=>{
      return a[propertyArr].length >= sortElement[0][propertyArr].length;
    });
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::filtTopByArrayLength_::topElement=<',topElement,'>');
    }
    return topElement;
  }

  filtTopByDate_(origArr,propertyArr) {
    const sortElement = origArr.sort((a, b)=>{
      const escape_ms_sort =  new Date(b[propertyArr]) - new Date(a[propertyArr]);
      if(EvidenceChain.trace1) {
        console.log('EvidenceChain::filtTopByDate_::escape_ms_sort=<',escape_ms_sort,'>');
      }
      return escape_ms_sort;
    });
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::filtTopByDate_::sortElement=<',sortElement,'>');
    }
    const topElement = origArr.filter((a, b)=>{
      const escape_ms_top = new Date(a[propertyArr]) - new Date(sortElement[0][propertyArr]);
      if(EvidenceChain.trace1) {
        console.log('EvidenceChain::filtTopByDate_::escape_ms_top=<',escape_ms_top,'>');
      }
      return escape_ms_top >= 0;
    });
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::filtTopByDate_::topElement=<',topElement,'>');
    }
    return topElement;
  }

  async calcDidAuth() {
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::calcDidAuth::this.docTop_=<',this.docTop_,'>');
    }
    const roleProof = await this.calcDidAuthInternal_(this.docTop_);
    if(EvidenceChain.trace) {
      console.log('EvidenceChain::calcDidAuth::roleProof=<',roleProof,'>');
    }
    const auth_address = this.auth_.address();
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::calcDidAuth::auth_address=<',auth_address,'>');
    }
    const inAuth = includesAnyByDidKey(this.docTop_.authentication,auth_address);
    const inCapability = includesAnyByDidKey(this.docTop_.capabilityInvocation,auth_address);
    if(EvidenceChain.trace) {
      console.log('EvidenceChain::calcDidAuth::inAuth=<',inAuth,'>');
      console.log('EvidenceChain::calcDidAuth::inCapability=<',inCapability,'>');
    }
    if(inAuth) {
      return roleProof.auth;
    }
    if(inCapability) {
      return roleProof.capability;
    }
    return 'guest.none.proof';
  }

  async calcDidAuthInternal_(didDoc) {
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::calcDidAuthInternal_::didDoc=<',didDoc,'>');
    }
    const isGoodDid = this.auth_.verifyDid(didDoc);
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::calcDidAuthInternal_::isGoodDid=<',isGoodDid,'>');
    }
    const seedTracedIds = this.collectSeedTracedKeyId_();
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::calcDidAuthInternal_::seedTracedIds=<',seedTracedIds,'>');
    }
    const myAddress = this.auth_.address();
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::calcDidAuthInternal_::myAddress=<',myAddress,'>');
    }
    const didAddress = didDoc.id.replace('did:otmc:','');
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::calcDidAuthInternal_::didAddress=<',didAddress,'>');
    }
    let isRootChain = false;
    for(const controller of didDoc.controller) {
      if(controller.endsWith(didAddress) ) {
        isRootChain = true;
      }
    }
    if(EvidenceChain.trace) {
      console.log('EvidenceChain::calcDidAuthInternal_::isRootChain=<',isRootChain,'>');
    }
    let proof = {};
    if(isRootChain) {
      proof = this.searchProofFromChainRoot_(isGoodDid.proofList,didAddress,myAddress,seedTracedIds);
    } else {
      proof = await this.searchProofFromChainLeaf_(isGoodDid.proofList,didAddress,myAddress,didDoc.controller);
    }
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::calcDidAuthInternal_::proof=<',proof,'>');
    }
    return proof;
  }

  
  collectSeedTracedKeyId_ () {
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::collectSeedTracedKeyId_::this.tree_=<',this.tree_,'>');
    }
    const seedKeyId = this.docTop_.id.replace('did:otmc:','');
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::collectSeedTracedKeyId_::seedKeyId=<',seedKeyId,'>');
    }
    const seedAuthed = this.tree_[seedKeyId];;
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::collectSeedTracedKeyId_::seedAuthed=<',seedAuthed,'>');
    }
    if(!seedAuthed) {
      return [];
    }
    const tracedIds = [];
    for(const proof of seedAuthed.proof) {
      if(EvidenceChain.trace1) {
        console.log('EvidenceChain::collectSeedTracedKeyId_::proof=<',proof,'>');
      }
      tracedIds.push(proof);
      if(EvidenceChain.trace1) {
        console.log('EvidenceChain::collectSeedTracedKeyId_::this.didRule_=<',this.didRule_,'>');
      }
      if(this.didRule_ && this.didRule_.authentication && this.didRule_.authentication.policy === 'Proof.Chain') {
        if(proof !== seedKeyId) {
          this.collectSeedTracedKeyIdFromLeaf_(this.tree_[proof],tracedIds,seedKeyId);
        }
      }
    }
    return tracedIds;
  }
  collectSeedTracedKeyIdFromLeaf_ (leafProof,tracedIds,seedKeyId) {
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::collectSeedTracedKeyIdFromLeaf_::leafProof=<',leafProof,'>');
      console.log('EvidenceChain::collectSeedTracedKeyIdFromLeaf_::tracedIds=<',tracedIds,'>');
    }
    if(!leafProof) {
      return;
    }
    for(const proof of leafProof.proof) {
      if(EvidenceChain.trace1) {
        console.log('EvidenceChain::collectSeedTracedKeyIdFromLeaf_::proof=<',proof,'>');
      }
      tracedIds.push(proof);
      if(EvidenceChain.trace1) {
        console.log('EvidenceChain::collectSeedTracedKeyIdFromLeaf_::this.didRule_=<',this.didRule_,'>');
      }
      if(proof !== seedKeyId && !tracedIds.includes(seedKeyId)) {
        this.collectSeedTracedKeyIdFromLeaf_(this.tree_[proof],tracedIds);
      }
    }
  }
  searchProofFromChainRoot_(proofList,didAddress,myAddress,seedTracedIds) {
    if(EvidenceChain.trace) {
      console.log('EvidenceChain::searchProofFromChainRoot_::proofList=<',proofList,'>');
      console.log('EvidenceChain::searchProofFromChainRoot_::didAddress=<',didAddress,'>');
      console.log('EvidenceChain::searchProofFromChainRoot_::myAddress=<',myAddress,'>');
      console.log('EvidenceChain::searchProofFromChainRoot_::seedTracedIds=<',seedTracedIds,'>');
    }
    let proof = {
      auth:'root.auth.proof.by.none',
      capability:'root.capability.proof.by.none',
    };
    if(proofList.authProof && proofList.authProof.length > 0) {
      if(proofList.authProof.includes(didAddress)) {
        proof.auth = 'root.auth.proof.by.seed';
        if(myAddress === didAddress) {
          proof.auth = 'root.auth.proof.is.seed';
        }
      } else if(proofList.authProof.includes(myAddress)) {
        const poofHint = includesAny(proofList.authProof,seedTracedIds);
        if(EvidenceChain.trace1) {
          console.log('EvidenceChain::searchProofFromChainRoot_::poofHint=<',poofHint,'>');
        }
        if(poofHint) {
          proof.auth = 'root.auth.proof.by.auth';
        } else {
          proof.auth = 'root.auth.proof.by.none';
        }
      } else {
        const poofHint = includesAny(proofList.authProof,seedTracedIds);
        if(EvidenceChain.trace1) {
          console.log('EvidenceChain::searchProofFromChainRoot_::poofHint=<',poofHint,'>');
        }
        if(poofHint) {
          proof.auth = 'root.auth.proof.by.auth';
        } else {
          proof.auth = 'root.auth.proof.by.none';
        }
      }
    }
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::searchProofFromChainRoot_::proof=<',proof,'>');
    }
    return proof;
  }
  async searchProofFromChainLeaf_(proofList,didAddress,myAddress,controllers) {
    if(EvidenceChain.trace) {
      console.log('EvidenceChain::searchProofFromChainLeaf_::proofList=<',proofList,'>');
      console.log('EvidenceChain::searchProofFromChainLeaf_::didAddress=<',didAddress,'>');
      console.log('EvidenceChain::searchProofFromChainLeaf_::myAddress=<',myAddress,'>');
      console.log('EvidenceChain::searchProofFromChainLeaf_::controllers=<',controllers,'>');
    }
    let proof = {
      auth:'leaf.auth.proof.by.none',
    };
    const authControlIds = await this.collectAuthFromControllers_(controllers);
    if(EvidenceChain.trace) {
      console.log('EvidenceChain::searchProofFromChainLeaf_::authControlIds=<',authControlIds,'>');
    }
    if(proofList.authProof && proofList.authProof.length > 0) {
      const poofHint = includesAny(proofList.authProof,authControlIds);
      if(EvidenceChain.trace1) {
        console.log('EvidenceChain::searchProofFromChainLeaf_::poofHint=<',poofHint,'>');
      }
      if(didAddress === myAddress) {
        if(poofHint) {
          proof.auth = 'leaf.seed.proof.by.ctrl';
        } else {
          proof.auth = 'leaf.seed.proof.by.none';
        }
      } else {
        if(poofHint) {
          proof.auth = 'leaf.auth.proof.by.ctrl';
        } else {
          proof.auth = 'leaf.auth.proof.by.none';
        }
      }

    }
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::searchProofFromChainLeaf_::proof=<',proof,'>');
    }
    return proof;
  }
  async collectAuthFromControllers_(controllers) {
    if(EvidenceChain.trace) {
      console.log('EvidenceChain::collectAuthFromControllers_::controllers=<',controllers,'>');
    }

    const authsInCtrl = [];
    for(const control of controllers) {
      const filter = {
        didId:control,
      };
      const allAuthedKeyIds = await this.db.chain.where(filter).toArray();
      if(EvidenceChain.trace3) {
        console.log('EvidenceChain::collectAuthFromControllers_::allAuthedKeyIds=<',allAuthedKeyIds,'>');
      }
      for(const authedKeyId of allAuthedKeyIds) {
        authsInCtrl.push(authedKeyId.authedAddress);
      }
    }
    if(EvidenceChain.trace) {
      console.log('EvidenceChain::collectAuthFromControllers_::controllers=<',controllers,'>');
    }
    return authsInCtrl.flat();
  }



  
  buildEvidenceProofChain(evidenceChain) {
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::buildEvidenceProofChain::evidenceChain=<',evidenceChain,'>');
    }
    this.didRule_ = evidenceChain.manifest;
    this.evidencesJson_ = evidenceChain.evidence;
    const chainType = this.judgeEvidenceChainType_();
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::buildEvidenceProofChain::chainType=<',chainType,'>');
    }
    if(chainType.root) {
      this.buildEvidenceProofChainRoot_();
    } else {
      this.buildEvidenceProofChainLeaf_();
    }
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::buildEvidenceProofChain::this.tree_=<',this.tree_,'>');
    }
    return chainType;
  }

  collectAllAuthedKeyId(didId,nodeId) {
    if(EvidenceChain.trace3) {
      console.log('EvidenceChain::collectAllAuthedKeyId::this.tree_=<',this.tree_,'>');
    }
    if(EvidenceChain.trace3) {
      console.log('EvidenceChain::collectAllAuthedKeyId::nodeId=<',nodeId,'>');
    }
    let authedKeyIds = [];
    for(const nodeKey in this.tree_) {
      if(EvidenceChain.trace3) {
        console.log('EvidenceChain::collectAllAuthedKeyId::nodeKey=<',nodeKey,'>');
      }
      const savedNode = this.tree_[nodeKey];
      if(EvidenceChain.trace3) {
        console.log('EvidenceChain::collectAllAuthedKeyId::savedNode=<',savedNode,'>');
      }
      authedKeyIds = authedKeyIds.concat(savedNode.proof);
    }
    if(EvidenceChain.trace3) {
      console.log('EvidenceChain::collectAllAuthedKeyId::authedKeyIds=<',authedKeyIds,'>');
    }
    const retAuthedKeyIds = Array.from(new Set(authedKeyIds));
    if(EvidenceChain.trace3) {
      console.log('EvidenceChain::collectAllAuthedKeyId::retAuthedKeyIds=<',retAuthedKeyIds,'>');
    }
    return authedKeyIds;
  }
  
  
  async trySaveSeedEvidenceTree(evidenceDid,seedKeyId,authedList) {
    if(EvidenceChain.trace3) {
      console.log('EvidenceChain::trySaveSeedEvidenceTree::evidenceDid=<',evidenceDid,'>');
      console.log('EvidenceChain::trySaveSeedEvidenceTree::seedKeyId=<',seedKeyId,'>');
      console.log('EvidenceChain::trySaveSeedEvidenceTree::authedList=<',authedList,'>');
    }
    const filter = {
      didId:evidenceDid.id,
      keyAddress:seedKeyId
    };
    const allAuthedKeyIds = await this.db.chain.where(filter).toArray();
    if(EvidenceChain.trace3) {
      console.log('EvidenceChain::trySaveSeedEvidenceTree::allAuthedKeyIds=<',allAuthedKeyIds,'>');
    }
    for(const authed of authedList) {
      const included = allAuthedKeyIds.reduce((acc,current) => acc || current.authedAddress ===authed ,false);
        if(EvidenceChain.trace3) {
          console.log('EvidenceChain::trySaveSeedEvidenceTree::included=<',included,'>');
        }
        if(!included) {
        const storeObject = {
          didId:evidenceDid.id,
          keyAddress:seedKeyId,
          authedAddress:authed,
          seed:true,
        }
        const checkBeforeSave = await this.db.chain.where(storeObject).toArray();
        if(EvidenceChain.trace3) {
          console.log('EvidenceChain::trySaveSeedEvidenceTree::checkBeforeSave=<',checkBeforeSave,'>');
        }
        if(checkBeforeSave.length === 0) {
          await this.db.chain.put(storeObject);
        }
      }
    }
  }

 async trySaveSproutEvidenceTree(evidenceDid,leafKeyId,authedList){
    if(EvidenceChain.trace3) {
      console.log('EvidenceChain::trySaveSproutEvidenceTree::evidenceDid=<',evidenceDid,'>');
      console.log('EvidenceChain::trySaveSproutEvidenceTree::leafKeyId=<',leafKeyId,'>');
      console.log('EvidenceChain::trySaveSproutEvidenceTree::authedList=<',authedList,'>');
    }
    const allAuthedKeyIds = await this.db.chain.where('keyAddress').equals(leafKeyId).toArray();
    if(EvidenceChain.trace3) {
      console.log('EvidenceChain::trySaveSeedEvtrySaveSproutEvidenceTreeidenceTree::allAuthedKeyIds=<',allAuthedKeyIds,'>');
    }
    for(const authed of authedList) {
      const included = allAuthedKeyIds.reduce((acc,current) => acc || current.authedAddress ===authed ,false);
        if(EvidenceChain.trace3) {
          console.log('EvidenceChain::trySaveSproutEvidenceTree::included=<',included,'>');
        }
        if(!included) {
        const storeObject = {
          didId:evidenceDid.id,
          keyAddress:leafKeyId,
          authedAddress:authed,
          seed:false,
        }
        const checkBeforeSave = await this.db.chain.where(storeObject).toArray();
        if(EvidenceChain.trace3) {
          console.log('EvidenceChain::trySaveSproutEvidenceTree::checkBeforeSave=<',checkBeforeSave,'>');
        }
        if(checkBeforeSave.length === 0) {
          await this.db.chain.put(storeObject);
        }
      }
    }
  }

  judgeEvidenceChainType_() {
    let isRoot = false;
    let controllers = [];
    for(const evidenceDid of this.evidencesJson_) {
      if(EvidenceChain.trace1) {
        console.log('EvidenceChain::judgeEvidenceChainType_::evidenceDid=<',evidenceDid,'>');
      }
      const isInController = evidenceDid.controller.includes(evidenceDid.id);
      if(EvidenceChain.trace1) {
        console.log('EvidenceChain::judgeEvidenceChainType_::isInController=<',isInController,'>');
      }
      if(isInController) {
        isRoot = true;
      } else {
        controllers.push(evidenceDid.controller);
      }
    }
    controllers = controllers.flat();
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::judgeEvidenceChainType_::controllers=<',controllers,'>');
    }
    controllers = [...new Set(controllers)];
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::judgeEvidenceChainType_::controllers=<',controllers,'>');
    }
    const chainType = {
      root:isRoot,
      controllers:controllers
    };
    return chainType;
  }
  async buildEvidenceProofChainLeaf_() {
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::buildEvidenceProofChainLeaf_::this.evidencesJson_=<',this.evidencesJson_,'>');
    }
    for(const evidenceDid of this.evidencesJson_) {
      if(EvidenceChain.trace1) {
        console.log('EvidenceChain::buildEvidenceProofChainLeaf_::evidenceDid=<',evidenceDid,'>');
      }
      const leafKeyId = evidenceDid.id.replace('did:otmc:','');
      if(EvidenceChain.trace1) {
        console.log('EvidenceChain::buildEvidenceProofChainLeaf_::leafKeyId=<',leafKeyId,'>');
      }
      const isGoodDid = this.auth_.verifyDid(evidenceDid);
      if(EvidenceChain.trace1) {
        console.log('EvidenceChain::buildEvidenceProofChainLeaf_::isGoodDid=<',isGoodDid,'>');
      }
      if(isGoodDid && isGoodDid.proofList){
        const authedKeyList = [];
        for(const controller of evidenceDid.controller) {
          if(EvidenceChain.trace1) {
            console.log('EvidenceChain::buildEvidenceProofChainLeaf_::controller=<', controller,'>');
          }
          const isAuthedControllerList = await this.getIsAuthedControllerList_(controller);
          if(EvidenceChain.trace1) {
            console.log('EvidenceChain::buildEvidenceProofChainLeaf_::isAuthedControllerList=<', isAuthedControllerList,'>');
          }
          for(const authProof of isGoodDid.proofList.authProof) {
            if(EvidenceChain.trace1) {
              console.log('EvidenceChain::buildEvidenceProofChainLeaf_::authProof=<', authProof,'>');
            }
            if(isAuthedControllerList.includes(authProof)) {
              if(EvidenceChain.trace1) {
                console.log('EvidenceChain::buildEvidenceProofChainLeaf_::evidenceDid.authentication=<', evidenceDid.authentication,'>');
              }
              for(const auth of evidenceDid.authentication) {
                authedKeyList.push(auth.split('#')[1]);
              }
            }
          }
        }
        if(EvidenceChain.trace3) {
          console.log('EvidenceChain::buildEvidenceProofChainLeaf_::authedKeyList=<', authedKeyList,'>');
        }
        if(authedKeyList.length > 0) {
          this.trySaveLeafEvidenceTree(evidenceDid,leafKeyId,authedKeyList);
        }
      }
    }
  }
  async getIsAuthedControllerList_(controller) {
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::getIsAuthedControllerList_::controller=<', controller,'>');
    }
    const filter = {
      didId:controller
    };
    const allAuthedKeyIds = await this.db.chain.where(filter).toArray();
    if(EvidenceChain.trace3) {
      console.log('EvidenceChain::getIsAuthedControllerList_::allAuthedKeyIds=<',allAuthedKeyIds,'>');
    }
    const isAuthedControllerList = [];
    allAuthedKeyIds.forEach((authed)=>{
      if(EvidenceChain.trace3) {
        console.log('EvidenceChain::getIsAuthedControllerList_::authed=<',authed,'>');
      }
      isAuthedControllerList.push(authed.authedAddress);
    });

    return isAuthedControllerList;
  }

  async trySaveLeafEvidenceTree(evidenceDid,leafKeyId,authedList) {
    if(EvidenceChain.trace3) {
      console.log('EvidenceChain::trySaveLeafEvidenceTree::evidenceDid=<',evidenceDid,'>');
      console.log('EvidenceChain::trySaveLeafEvidenceTree::leafKeyId=<',leafKeyId,'>');
      console.log('EvidenceChain::trySaveLeafEvidenceTree::authedList=<',authedList,'>');
    }
    const filter = {
      didId:evidenceDid.id,
      keyAddress:leafKeyId
    };
    const allAuthedKeyIds = await this.db.chain.where(filter).toArray();
    if(EvidenceChain.trace3) {
      console.log('EvidenceChain::trySaveLeafEvidenceTree::allAuthedKeyIds=<',allAuthedKeyIds,'>');
    }
    for(const authed of authedList) {
      const included = allAuthedKeyIds.reduce((acc,current) => acc || current.authedAddress ===authed ,false);
        if(EvidenceChain.trace3) {
          console.log('EvidenceChain::trySaveLeafEvidenceTree::included=<',included,'>');
        }
        if(!included) {
        const storeObject = {
          didId:evidenceDid.id,
          keyAddress:leafKeyId,
          authedAddress:authed,
          seed:false,
        }
        const checkBeforeSave = await this.db.chain.where(storeObject).toArray();
        if(EvidenceChain.trace3) {
          console.log('EvidenceChain::trySaveLeafEvidenceTree::checkBeforeSave=<',checkBeforeSave,'>');
        }
        if(checkBeforeSave.length === 0) {
          await this.db.chain.put(storeObject);
        }
      }
    }
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

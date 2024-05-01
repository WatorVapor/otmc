export class EvidenceChain {
  static trace1 = true;
  static trace2 = true;
  static trace3 = true;
  static trace4 = true;
  static trace5 = true;
  static trace = true;
  static debug = true;

  constructor(auth,docTop) {
    this.auth_ = auth;
    this.docTop_ = JSON.parse(JSON.stringify(docTop));
    this.tree_ = {};
    this.seed_ = {};
    this.didRule_ = {};
  }
  
  tryMergeStoredDidDocument() {
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::tryMergeStoredDidDocument::this.docTop_=<',this.docTop_,'>');
      console.log('EvidenceChain::tryMergeStoredDidDocument::this.evidencesJson_=<',this.evidencesJson_,'>');
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
    const allAuthInNew = isSubsetByElem(this.docTop_.authentication,topEvidence.authentication);
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::tryMergeTopStoredDidDocument::allAuthInNew=<',allAuthInNew,'>');
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

  calcDidAuth() {
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::calcDidAuth::this.docTop_=<',this.docTop_,'>');
    }
    const proof = this.calcDidAuthInternal_(this.docTop_);
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::calcDidAuth::proof=<',proof,'>');
    }
    return proof;
  }

  calcDidAuthInternal_(didDoc) {
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
    const proof = this.searchProofFromChain_(isGoodDid.proofList,didAddress,myAddress,seedTracedIds);
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
    for(const proof of leafProof.proof) {
      if(EvidenceChain.trace1) {
        console.log('EvidenceChain::collectSeedTracedKeyIdFromLeaf_::proof=<',proof,'>');
      }
      tracedIds.push(proof);
      if(EvidenceChain.trace1) {
        console.log('EvidenceChain::collectSeedTracedKeyIdFromLeaf_::this.didRule_=<',this.didRule_,'>');
      }
      if(proof !== seedKeyId) {
        this.collectSeedTracedKeyIdFromLeaf_(this.tree_[proof],tracedIds);
      }
    }
  }
  searchProofFromChain_(proofList,didAddress,myAddress,seedTracedIds) {
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::searchProofFromChain_::proofList=<',proofList,'>');
      console.log('EvidenceChain::searchProofFromChain_::didAddress=<',didAddress,'>');
      console.log('EvidenceChain::searchProofFromChain_::myAddress=<',myAddress,'>');
      console.log('EvidenceChain::searchProofFromChain_::seedTracedIds=<',seedTracedIds,'>');
    }
    let proof = 'none.proof';
    if(proofList.authProof && proofList.authProof.length > 0) {
      if(proofList.authProof.includes(didAddress)) {
        proof = 'auth.proof.by.seed';
        if(myAddress === didAddress) {
          proof = 'auth.proof.is.seed';
        }
      } else if(proofList.authProof.includes(myAddress)) {
        const poofHint = includesAny(proofList.authProof,seedTracedIds);
        if(EvidenceChain.trace1) {
          console.log('EvidenceChain::searchProofFromChain_::poofHint=<',poofHint,'>');
        }
        if(poofHint) {
          proof = 'auth.proof.by.auth';
        } else {
          proof = 'auth.proof.by.none';
        }
      } else {
        const poofHint = includesAny(proofList.authProof,seedTracedIds);
        if(EvidenceChain.trace1) {
          console.log('EvidenceChain::searchProofFromChain_::poofHint=<',poofHint,'>');
        }
        if(poofHint) {
          proof = 'auth.proof.by.auth';
        } else {
          proof = 'auth.proof.by.none';
        }
      }
    } else {
      if(proofList.capabilityProof && proofList.capabilityProof.length > 0) {
        if(proofList.capabilityProof.includes(didAddress)) {
          proof = 'capability.proof.by.seed';
          if(myAddress === didAddress) {
            proof = 'capability.proof.is.seed';
          }
        } else if(proofList.capabilityProof.includes(myAddress)) {
          const poofHintCapability = includesAny(proofList.capabilityProof,seedTracedIds);
          if(EvidenceChain.trace1) {
            console.log('EvidenceChain::searchProofFromChain_::poofHintCapability=<',poofHintCapability,'>');
          }
          if(poofHintCapability) {
            proof = 'capability.proof.by.auth';
          } else {
            proof = 'capability.proof.by.none';
          }
        } else {
          proof = 'capability.proof.by.none';
        }
      }
    }
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::searchProofFromChain_::proof=<',proof,'>');
    }
    return proof;
  }



  
  buildEvidenceProofChain(evidenceChain) {
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::buildEvidenceProofChain::evidenceChain=<',evidenceChain,'>');
    }
    this.didRule_ = evidenceChain.manifest;
    this.evidencesJson_ = evidenceChain.evidence;
    
    for(const evidenceDid of evidenceChain.evidence) {
      if(EvidenceChain.trace1) {
        console.log('EvidenceChain::buildEvidenceProofChain::evidenceDid=<',evidenceDid,'>');
      }
      const seedKeyId = evidenceDid.id.replace('did:otmc:','');
      if(EvidenceChain.trace1) {
        console.log('EvidenceChain::buildEvidenceProofChain::seedKeyId=<',seedKeyId,'>');
      }
      const isGoodDid = this.auth_.verifyDid(evidenceDid);
      if(EvidenceChain.trace1) {
        console.log('EvidenceChain::buildEvidenceProofChain::isGoodDid=<',isGoodDid,'>');
      }
      if(isGoodDid && isGoodDid.proofList){
        const authedList = [];
        for(const authDid of evidenceDid.authentication) {
          const authId = authDid.split('#').slice(-1)[0];
          authedList.push(authId);
        }
        if(EvidenceChain.trace3) {
          console.log('EvidenceChain::buildEvidenceProofChain::authedList=<',authedList,'>');
        }
        if(isGoodDid.proofList && isGoodDid.proofList.authProof && isGoodDid.proofList.authProof.length > 0){
          for(const authProof of isGoodDid.proofList.authProof) {
            if(EvidenceChain.trace3) {
              console.log('EvidenceChain::buildEvidenceProofChain::evidenceDid=<',evidenceDid,'>');
            }
            if(seedKeyId === authProof) {
              this.trySaveSeedEvidenceTree(evidenceDid,seedKeyId,authedList);
            } else {
              this.trySaveLeafEvidenceTree(evidenceDid,authProof,authedList);
            }
          }
        }
      }
    }  
  }

  collectAllAuthedKeyId(did,nodeId) {
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
  
  
  trySaveSeedEvidenceTree(evidenceDid,seedKeyId,authedList) {
    if(EvidenceChain.trace3) {
      console.log('EvidenceChain::trySaveSeedEvidenceTree::authedList=<',authedList,'>');
    }
    const allAuthedKeyIds = this.collectAllAuthedKeyId(evidenceDid.id,seedKeyId);
    if(EvidenceChain.trace3) {
      console.log('EvidenceChain::trySaveSeedEvidenceTree::allAuthedKeyIds=<',allAuthedKeyIds,'>');
    }
    const savedNode = this.tree_[seedKeyId];
    if(EvidenceChain.trace3) {
      console.log('EvidenceChain::trySaveSeedEvidenceTree::savedNode=<',savedNode,'>');
    }
    if(savedNode) {
      let newComing = false;
      for(const authed of authedList) {
        if(!allAuthedKeyIds.includes(authed)) {
          savedNode.proof.push(authed);
          newComing = true; 
        }
      }
      if(EvidenceChain.trace3) {
        console.log('EvidenceChain::trySaveSeedEvidenceTree::newComing=<',newComing,'>');
      }
      if(newComing) {
        this.tree_[seedKeyId] = savedNode;
        if(EvidenceChain.trace3) {
          console.log('EvidenceChain::trySaveSeedEvidenceTree::this.tree_=<',this.tree_,'>');
        }
      }
      return;
    }
    const newNode = {};
    newNode.did = evidenceDid.id;
    newNode.keyid = seedKeyId;
    newNode.seed = true;
    newNode.roof = '';
    newNode.proof = [...authedList];
    if(EvidenceChain.trace3) {
      console.log('EvidenceChain::trySaveSeedEvidenceTree::newNode=<',newNode,'>');
    }
    this.tree_[seedKeyId] = newNode;
    if(EvidenceChain.trace3) {
      console.log('EvidenceChain::trySaveSeedEvidenceTree::this.tree_=<',this.tree_,'>');
    }
  }




  trySaveLeafEvidenceTree(evidenceDid,leafKeyId,authedList){
    if(EvidenceChain.trace3) {
      console.log('EvidenceChain::trySaveLeafEvidenceTree::authedList=<',authedList,'>');
    }
    const allAuthedKeyIds = this.collectAllAuthedKeyId(evidenceDid.id);
    if(EvidenceChain.trace3) {
      console.log('EvidenceChain::trySaveLeafEvidenceTree::allAuthedKeyIds=<',allAuthedKeyIds,'>');
    }
    const savedNode = this.tree_[leafKeyId];
    if(EvidenceChain.trace3) {
      console.log('EvidenceChain::trySaveLeafEvidenceTree::savedNode=<',savedNode,'>');
    }
    if(savedNode) {
      let newComing = false;
      for(const authed of authedList) {
        if(!allAuthedKeyIds.includes(authed)) {
          savedNode.proof.push(authed);
          newComing = true; 
        }
      }
      if(newComing) {
        this.tree_[leafKeyId] = savedNode;
      }
      return;
    }
    const newNode = {};
    newNode.did = evidenceDid.id;
    newNode.keyid = leafKeyId;
    newNode.seed = false;
    newNode.roof = '';
    newNode.proof = [];
    for(const authed of authedList) {
      if(!allAuthedKeyIds.includes(authed)) {
        newNode.proof.push(authed);
      }
    }
    if(EvidenceChain.trace3) {
      console.log('EvidenceChain::trySaveLeafEvidenceTree::newNode=<',newNode,'>');
    }
    this.tree_[leafKeyId] = newNode;
    if(EvidenceChain.trace5) {
      console.log('EvidenceChain::trySaveSeedEvidenceTree::this.tree_=<',this.tree_,'>');
    }
  }
}

const includesAny = (arr, values) => values.some(v => arr.includes(v));
const isSubsetById = (subset, superset) => {
  return subset.every(subsetItem => 
    superset.some(supersetItem => 
      subsetItem.id === supersetItem.id
    )
  );  
};

const isSubsetByElem = (subset, superset) => {
  return subset.every(subsetItem => 
    superset.some(supersetItem => 
      subsetItem === supersetItem
    )
  );  
};

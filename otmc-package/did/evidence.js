const includesAnyByDidKey = (setArr,value ) => setArr.some(attr => attr.endsWith(value));
export class EvidenceChain {
  static trace1 = false;
  static trace2 = false;
  static trace3 = false;
  static trace4 = false;
  static trace5 = false;
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

  calcDidAuth() {
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::calcDidAuth::this.docTop_=<',this.docTop_,'>');
    }
    const roleProof = this.calcDidAuthInternal_(this.docTop_);
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
  searchProofFromChain_(proofList,didAddress,myAddress,seedTracedIds) {
    if(EvidenceChain.trace) {
      console.log('EvidenceChain::searchProofFromChain_::proofList=<',proofList,'>');
      console.log('EvidenceChain::searchProofFromChain_::didAddress=<',didAddress,'>');
      console.log('EvidenceChain::searchProofFromChain_::myAddress=<',myAddress,'>');
      console.log('EvidenceChain::searchProofFromChain_::seedTracedIds=<',seedTracedIds,'>');
    }
    let proof = {
      auth:'auth.none.proof',
      capability:'capability.none.proof',
    };
    if(proofList.authProof && proofList.authProof.length > 0) {
      if(proofList.authProof.includes(didAddress)) {
        proof.auth = 'auth.proof.by.seed';
        if(myAddress === didAddress) {
          proof.auth = 'auth.proof.is.seed';
        }
      } else if(proofList.authProof.includes(myAddress)) {
        const poofHint = includesAny(proofList.authProof,seedTracedIds);
        if(EvidenceChain.trace1) {
          console.log('EvidenceChain::searchProofFromChain_::poofHint=<',poofHint,'>');
        }
        if(poofHint) {
          proof.auth = 'auth.proof.by.auth';
        } else {
          proof.auth = 'auth.proof.by.none';
        }
      } else {
        const poofHint = includesAny(proofList.authProof,seedTracedIds);
        if(EvidenceChain.trace1) {
          console.log('EvidenceChain::searchProofFromChain_::poofHint=<',poofHint,'>');
        }
        if(poofHint) {
          proof.auth = 'auth.proof.by.auth';
        } else {
          proof.auth = 'auth.proof.by.none';
        }
      }
    }
    if(proofList.capabilityProof && proofList.capabilityProof.length > 0) {
      if(proofList.capabilityProof.includes(myAddress)) {
        if(proof.auth === 'auth.proof.is.seed') {
          proof.capability = 'capability.proof.by.seed';
        }
        if(proof.auth === 'auth.proof.by.seed') {
          proof.capability = 'capability.proof.by.seed';
        }
        if(proof.auth === 'auth.proof.by.auth') {
          proof.capability = 'capability.proof.by.auth';
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
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::buildEvidenceProofChain::this.tree_=<',this.tree_,'>');
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
    const allAuthedKeyIds = this.collectAllAuthedKeyId(evidenceDid.id,leafKeyId);
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
      console.log('EvidenceChain::trySaveLeafEvidenceTree::this.tree_=<',this.tree_,'>');
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

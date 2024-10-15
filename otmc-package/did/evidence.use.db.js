import Dexie from 'dexie';

const includesAnyByDidKey = (setArr,value ) => setArr.some(attr => attr.endsWith(value));
export class EvidenceChain {
  static trace1 = true;
  static trace2 = true;
  static trace3 = true;
  static trace4 = true;
  static trace5 = true;
  static trace = true;
  static debug = true;

  constructor(auth,docTop,StoreKey) {
    this.version = '1.0';
    this.auth_ = auth;
    this.docTop_ = JSON.parse(JSON.stringify(docTop));
    this.tree_ = {};
    this.seed_ = {};
    this.didRule_ = {};
    this.authsOfDid_ = {};
    this.db = new Dexie(StoreKey.open.did.chain.dbName);
    this.db.version(this.version).stores({
      chain: '++autoId,keyAddress,authedList'
    });
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
    return 'guest.none.proof';
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
      proof = this.searchProofFromChainLeaf_(isGoodDid.proofList,didAddress,myAddress,didDoc.controller);
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
  searchProofFromChainLeaf_(proofList,didAddress,myAddress,controllers) {
    if(EvidenceChain.trace) {
      console.log('EvidenceChain::searchProofFromChainLeaf_::proofList=<',proofList,'>');
      console.log('EvidenceChain::searchProofFromChainLeaf_::didAddress=<',didAddress,'>');
      console.log('EvidenceChain::searchProofFromChainLeaf_::myAddress=<',myAddress,'>');
      console.log('EvidenceChain::searchProofFromChainLeaf_::controllers=<',controllers,'>');
    }
    let proof = {
      auth:'leaf.auth.proof.by.none',
      capability:'leaf.capability.proof.by.none',
    };
    const authControlIds = this.collectAuthFromCotrollers_(controllers);
    if(EvidenceChain.trace) {
      console.log('EvidenceChain::searchProofFromChainLeaf_::authControlIds=<',authControlIds,'>');
    }
    if(proofList.authProof && proofList.authProof.length > 0) {
      const poofHint = includesAny(proofList.authProof,authControlIds);
      if(EvidenceChain.trace1) {
        console.log('EvidenceChain::searchProofFromChainLeaf_::poofHint=<',poofHint,'>');
      }
      if(poofHint) {
        proof.auth = 'leaf.auth.proof.by.ctrl';
      } else {
        proof.auth = 'leaf.auth.proof.by.none';
      }
    }
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::searchProofFromChainLeaf_::proof=<',proof,'>');
    }
    return proof;
  }
  collectAuthFromCotrollers_(controllers) {
    if(EvidenceChain.trace) {
      console.log('EvidenceChain::collectAuthFromCotrollers_::controllers=<',controllers,'>');
    }
    const authsInCtrl = [];
    for(const control of controllers) {
      if(this.authsOfDid_[control]) {
        authsInCtrl.push(this.authsOfDid_[control]);
      }
    }
    if(EvidenceChain.trace) {
      console.log('EvidenceChain::collectAuthFromCotrollers_::controllers=<',controllers,'>');
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
    if(!this.authsOfDid_[evidenceDid.id]) {
      this.authsOfDid_[evidenceDid.id] = []
    }
    this.authsOfDid_[evidenceDid.id].push(`${evidenceDid.id}#${seedKeyId}`);
    if(EvidenceChain.trace3) {
      console.log('EvidenceChain::trySaveSeedEvidenceTree::this.authsOfDid_=<',this.authsOfDid_,'>');
    }
  }




  trySaveSproutEvidenceTree(evidenceDid,leafKeyId,authedList){
    if(EvidenceChain.trace3) {
      console.log('EvidenceChain::trySaveSproutEvidenceTree::authedList=<',authedList,'>');
    }
    const allAuthedKeyIds = this.collectAllAuthedKeyId(evidenceDid.id,leafKeyId);
    if(EvidenceChain.trace3) {
      console.log('EvidenceChain::trySaveSproutEvidenceTree::allAuthedKeyIds=<',allAuthedKeyIds,'>');
    }
    const savedNode = this.tree_[leafKeyId];
    if(EvidenceChain.trace3) {
      console.log('EvidenceChain::trySaveSproutEvidenceTree::savedNode=<',savedNode,'>');
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
      console.log('EvidenceChain::trySaveSproutEvidenceTree::newNode=<',newNode,'>');
    }
    this.tree_[leafKeyId] = newNode;
    if(EvidenceChain.trace5) {
      console.log('EvidenceChain::trySaveSproutEvidenceTree::this.tree_=<',this.tree_,'>');
    }
    if(!this.authsOfDid_[evidenceDid.id]) {
      this.authsOfDid_[evidenceDid.id] = []
    }
    this.authsOfDid_[evidenceDid.id].push(`${evidenceDid.id}#${seedKeyId}`);
    if(EvidenceChain.trace3) {
      console.log('EvidenceChain::trySaveSproutEvidenceTree::this.authsOfDid_=<',this.authsOfDid_,'>');
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
  buildEvidenceProofChainRoot_() {
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::buildEvidenceProofChainRoot_::this.evidencesJson_=<',this.evidencesJson_,'>');
    }
    for(const evidenceDid of this.evidencesJson_) {
      if(EvidenceChain.trace1) {
        console.log('EvidenceChain::buildEvidenceProofChainRoot_::evidenceDid=<',evidenceDid,'>');
      }
      const seedKeyId = evidenceDid.id.replace('did:otmc:','');
      if(EvidenceChain.trace1) {
        console.log('EvidenceChain::buildEvidenceProofChainRoot_::seedKeyId=<',seedKeyId,'>');
      }
      const isGoodDid = this.auth_.verifyDid(evidenceDid);
      if(EvidenceChain.trace1) {
        console.log('EvidenceChain::buildEvidenceProofChainRoot_::isGoodDid=<',isGoodDid,'>');
      }
      if(isGoodDid && isGoodDid.proofList){
        const authedList = [];
        for(const authDid of evidenceDid.authentication) {
          const authId = authDid.split('#').slice(-1)[0];
          authedList.push(authId);
        }
        if(EvidenceChain.trace3) {
          console.log('EvidenceChain::buildEvidenceProofChainRoot_::authedList=<',authedList,'>');
        }
        if(isGoodDid.proofList && isGoodDid.proofList.authProof && isGoodDid.proofList.authProof.length > 0){
          for(const authProof of isGoodDid.proofList.authProof) {
            if(EvidenceChain.trace3) {
              console.log('EvidenceChain::buildEvidenceProofChainRoot_::authProof=<',authProof,'>');
              console.log('EvidenceChain::buildEvidenceProofChainRoot_::evidenceDid=<',evidenceDid,'>');
            }
            if(seedKeyId === authProof) {
              this.trySaveSeedEvidenceTree(evidenceDid,seedKeyId,authedList);
            } else {
              this.trySaveSproutEvidenceTree(evidenceDid,authProof,authedList);
            }
          }
        }
      }
    }
  } 
  buildEvidenceProofChainLeaf_() {
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::buildEvidenceProofChainLeaf_::this.evidencesJson_=<',this.evidencesJson_,'>');
    }
    for(const evidenceDid of this.evidencesJson_) {
      if(EvidenceChain.trace1) {
        console.log('EvidenceChain::buildEvidenceProofChainLeaf_::evidenceDid=<',evidenceDid,'>');
      }
      const seedKeyId = evidenceDid.id.replace('did:otmc:','');
      if(EvidenceChain.trace1) {
        console.log('EvidenceChain::buildEvidenceProofChainLeaf_::seedKeyId=<',seedKeyId,'>');
      }
      const isGoodDid = this.auth_.verifyDid(evidenceDid);
      if(EvidenceChain.trace1) {
        console.log('EvidenceChain::buildEvidenceProofChainLeaf_::isGoodDid=<',isGoodDid,'>');
      }
      if(isGoodDid && isGoodDid.proofList){
        const authedControllerList = [];
        for(const controller of evidenceDid.controller) {
          if(EvidenceChain.trace1) {
            console.log('EvidenceChain::buildEvidenceProofChainLeaf_::controller=<', controller,'>');
          }
          const isAuthedControllerList = this.getIsAuthedControllerList_(controller);
          if(EvidenceChain.trace1) {
            console.log('EvidenceChain::buildEvidenceProofChainLeaf_::isAuthedControllerList=<', isAuthedControllerList,'>');
          }
          for(const authProof of isGoodDid.proofList.authProof) {
            if(EvidenceChain.trace1) {
              console.log('EvidenceChain::buildEvidenceProofChainLeaf_::authProof=<', authProof,'>');
            }
            if(isAuthedControllerList.includes(authProof)) {
            }
          }
        }
        if(EvidenceChain.trace3) {
          console.log('EvidenceChain::buildEvidenceProofChainLeaf_::authedControllerList=<', authedControllerList,'>');
        }
      }
    }
  }
  getIsAuthedControllerList_(controller) {
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::getIsAuthedControllerList_::controller=<', controller,'>');
    }
    const isAuthedControllerList = [];
    return isAuthedControllerList;
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

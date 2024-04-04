export class EvidenceChain {
  static trace1 = true;
  static trace2 = true;
  static trace3 = true;
  static trace4 = true;
  static trace5 = true;
  static trace = true;
  static debug = true;
  constructor(didMgr) {
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::constructor::didMgr=<',didMgr,'>');
    }
    this.auth_ = didMgr.auth;
    this.docTop_ = JSON.parse(JSON.stringify(didMgr.didDoc_));
    this.docDB_ = didMgr.dbDocument;
    this.manifestDb_ = didMgr.dbManifest;
    this.actor_ = didMgr.docState.actor;
    this.tree_ = {};
    this.seed_ = {};
    this.didRule_ = {};
  }

  calcDidAuth() {
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::calcDidAuth::this.docTop_=<',this.docTop_,'>');
    }
    const isGoodDid = this.auth_.verifyDid(this.docTop_);
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::calcDidAuth::isGoodDid=<',isGoodDid,'>');
    }
    const seedTracedIds = this.collectSeedTracedKeyId_();
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::calcDidAuth::seedTracedIds=<',seedTracedIds,'>');
    }
    const myAddress = this.auth_.address();
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::calcDidAuth::myAddress=<',myAddress,'>');
    }
    const didAddress = this.docTop_.id.replace('did:otmc:','');
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::calcDidAuth::didAddress=<',didAddress,'>');
    }
    let proof = 'none.proof';
    const proofList = isGoodDid.proofList;
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::calcDidAuth::proofList=<',proofList,'>');
    }
    if(proofList.authProof && proofList.authProof.length > 0) {
      if(proofList.authProof.includes(didAddress)) {
        proof = 'auth.proof.by.seed';
        if(myAddress === didAddress) {
          proof = 'auth.proof.is.seed';
        }
      } else if(proofList.authProof.includes(myAddress)) {
        if(seedTracedIds.includes(myAddress)) {
          proof = 'auth.proof.by.auth';
        } else {
          proof = 'auth.proof.by.none';
        }
      }
      else {
        proof = 'auth.proof.by.none';
      }
    }
    if(proofList.capabilityProof && proofList.capabilityProof.length > 0) {
      if(proofList.capabilityProof.includes(didAddress)) {
        proof = 'capability.proof.by.seed';
        if(myAddress === didAddress) {
          proof = 'capability.proof.is.seed';
        }
      } else if(proofList.capabilityProof.includes(myAddress)) {
        if(seedTracedIds.includes(myAddress)) {
          proof = 'capability.proof.by.auth';
        } else {
          proof = 'capability.proof.by.none';
        }
      } else {
        proof = 'capability.proof.by.none';
      }
    }
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::calcDidAuth::proof=<',proof,'>');
    }
    this.actor_.send({type:proof});
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


  async loadEvidenceChain() {
    const didRule = await this.loadDidRuleFromManifest_();
    if(EvidenceChain.trace2) {
      console.log('EvidenceChain::loadEvidenceChain::didRule=<',didRule,'>');
    }
    if(!didRule) {
      this.actor_.send({type:'manifest.lack'});
      return;
    }
    this.didRule_ = didRule;
    const evidences = await this.docDB_.values().all();
    if(EvidenceChain.trace2) {
      console.log('EvidenceChain::loadEvidenceChain::evidences=<',evidences,'>');
    }
    const evidencesJson = [];
    for(const evidence of evidences) {
      if(EvidenceChain.trace2) {
        console.log('EvidenceChain::loadEvidenceChain::evidence=<',evidence,'>');
      }
      const evidenceJson = JSON.parse(evidence);
      if(EvidenceChain.trace2) {
        console.log('EvidenceChain::loadEvidenceChain::evidenceJson=<',evidenceJson,'>');
      }
      evidencesJson.push(evidenceJson);
    }
    if(EvidenceChain.trace2) {
      console.log('EvidenceChain::loadEvidenceChain::evidencesJson=<',evidencesJson,'>');
    }
    this.calacEvidenceProofChainDB(evidencesJson);
    if(EvidenceChain.trace2) {
      console.log('EvidenceChain::loadEvidenceChain::this.tree_=<',this.tree_,'>');
    }
    this.actor_.send({type:'chain.load'});
  }
  calacEvidenceProofChainDB(evidenceDids) {
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::calacEvidenceProofChainDB::evidenceDids=<',evidenceDids,'>');
    }
    for(const evidenceDid of evidenceDids) {
      if(EvidenceChain.trace1) {
        console.log('EvidenceChain::calacEvidenceProofChainDB::evidenceDid=<',evidenceDid,'>');
      }
      const seedKeyId = evidenceDid.id.replace('did:otmc:','');
      if(EvidenceChain.trace1) {
        console.log('EvidenceChain::calacEvidenceProofChainDB::seedKeyId=<',seedKeyId,'>');
      }
      const isGoodDid = this.auth_.verifyDid(evidenceDid);
      if(EvidenceChain.trace1) {
        console.log('EvidenceChain::calacEvidenceProofChainDB::isGoodDid=<',isGoodDid,'>');
      }
      if(isGoodDid && isGoodDid.proofList){
        const authedList = [];
        for(const authDid of evidenceDid.authentication) {
          const authId = authDid.split('#').slice(-1)[0];
          authedList.push(authId);
        }
        if(EvidenceChain.trace3) {
          console.log('EvidenceChain::calacEvidenceProofChainDB::authedList=<',authedList,'>');
        }
        if(isGoodDid.proofList && isGoodDid.proofList.authProof && isGoodDid.proofList.authProof.length > 0){
          for(const authProof of isGoodDid.proofList.authProof) {
            if(EvidenceChain.trace3) {
              console.log('EvidenceChain::calacEvidenceProofChainDB::evidenceDid=<',evidenceDid,'>');
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
        const result = savedNode.save();
        if(EvidenceChain.trace3) {
          console.log('EvidenceChain::trySaveLeafEvidenceTree::result=<',result,'>');
        }
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


  async loadDidRuleFromManifest_() {
    const manifests = await this.manifestDb_.values().all();
    if(EvidenceChain.trace5) {
      console.log('EvidenceChain::loadDidRuleFromManifest_::manifests=<',manifests,'>');
    }
    const manifestsJson = [];
    for(const manifest of manifests) {
      if(EvidenceChain.trace5) {
        console.log('EvidenceChain::loadDidRuleFromManifest_::manifest=<',manifest,'>');
      }
      const manifestJson = JSON.parse(manifest);
      if(EvidenceChain.trace5) {
        console.log('EvidenceChain::loadDidRuleFromManifest_::manifestJson=<',manifestJson,'>');
      }
      manifestsJson.push(manifestJson);
    }
    if(EvidenceChain.trace5) {
      console.log('EvidenceChain::loadDidRuleFromManifest_::manifestsJson=<',manifestsJson,'>');
    }
    if(manifestsJson.length > 0) {
      return manifestsJson[0].diddoc;
    }
    return false;
  }

}

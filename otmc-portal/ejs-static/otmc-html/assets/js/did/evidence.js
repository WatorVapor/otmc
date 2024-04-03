export class EvidenceChain {
  static trace1 = true;
  static trace2 = true;
  static trace3 = true;
  static trace4 = true;
  static trace5 = true;
  static trace = true;
  static debug = true;
  constructor(auth,docTop,docDb,manifestDb) {
    if(EvidenceChain.trace1) {
      console.log('EvidenceChain::constructor::auth=<',auth,'>');
      console.log('EvidenceChain::constructor::docTop=<',docTop,'>');
      console.log('EvidenceChain::constructor::docDb=<',docDb,'>');
      console.log('EvidenceChain::constructor::manifestDb=<',manifestDb,'>');
    }
    this.auth_ = auth;
    this.docTop_ = docTop;
    this.docDB_ = docDb;
    this.manifestDb_ = manifestDb;
    const self = this;
    setTimeout(()=>{
      self.loadEvidenceChain();
    },100);
    this.tree_ = {};
    this.didRule_ = {};
  }
  async loadEvidenceChain() {
    const didRule = await this.loadDidRuleFromManifest_();
    if(EvidenceChain.trace2) {
      console.log('EvidenceChain::loadEvidenceChain::didRule=<',didRule,'>');
    }
    if(!didRule) {
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

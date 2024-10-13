export class DIDVerifiableCredential {
  constructor(auth,didDoc,util) {
    this.trace = true;
    this.debug = true;
    if(this.trace) {
      console.log('DIDVerifiableCredential::constructor::auth=:<',auth,'>');
      console.log('DIDVerifiableCredential::constructor::didDoc=:<',didDoc,'>');
    }
    this.auth_ = auth;
    this.didDoc_ = didDoc;
    this.util_ = util;
  }
  verifiable(did2VC,storeHash) {
    if(this.trace) {
      console.log('DIDVerifiableCredential::constructor::this.auth_=:<',this.auth_,'>');
      console.log('DIDVerifiableCredential::constructor::this.didDoc_=:<',this.didDoc_,'>');
      console.log('DIDVerifiableCredential::constructor::did2VC=:<',did2VC,'>');
    }
    const didVCNew = JSON.parse(JSON.stringify(did2VC));
    const oldDidProof = didVCNew.proof;
    if(this.trace) {
      console.log('DIDVerifiableCredential::constructor::oldDidProof=:<',oldDidProof,'>');
    }
    delete didVCNew.proof;
    const methodId = `${this.didDoc_.id}#${this.auth_.address()}`;
    didVCNew.authentication.push(methodId);
    const verificationMethod = {
      id:methodId,
      type: 'ed25519',
      controller:this.didDoc_.id,
      publicKeyMultibase: this.auth_.pub(),
    };
    didVCNew.verificationMethod.push(verificationMethod);
    if(this.trace) {
      console.log('DIDVerifiableCredential::constructor::didVCNew=:<',didVCNew,'>');
    }
    const signedMsgVC = this.auth_.signWithoutTS(didVCNew);
    const proofVC = {
      type:'ed25519',
      creator:methodId,
      signatureValue:signedMsgVC.auth.sign,
    };
    oldDidProof.push(proofVC);
    didVCNew.proof = oldDidProof;
    if(this.trace) {
      console.log('DIDVerifiableCredential::constructor::didVCNew=:<',didVCNew,'>');
    }
    
    const verifiableJson = {
      '@context':this.didDoc_['@context'],
      id: storeHash,
      type:['VerifiableCredential','DidTeamJoin'],
      issuer : {
        id:this.didDoc_.id,
      },
      issuanceDate:(new Date()).toISOString(),
      credentialSubject: {
        did:didVCNew,
      }
    };
    const proofs = [];
    const signedMsg = this.auth_.signWithoutTS(verifiableJson);
    const proof = {
      type:'ed25519',
      creator:methodId,
      signatureValue:signedMsg.auth.sign,
    };
    proofs.push(proof);
    
    verifiableJson.proof = proofs;
    return verifiableJson;
  }
}

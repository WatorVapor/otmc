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
  verifiable(claimsVC,storeHash) {
    if(this.trace) {
      console.log('DIDVerifiableCredential::verifiable::this.auth_=:<',this.auth_,'>');
      console.log('DIDVerifiableCredential::verifiable::this.didDoc_=:<',this.didDoc_,'>');
      console.log('DIDVerifiableCredential::verifiable::claimsVC=:<',claimsVC,'>');
    }
    if(claimsVC.did.id === this.didDoc_.id) {
      if(claimsVC.memberAsAuthentication) {
        return this.verifiableIncreaseAuthMyself_(claimsVC.memberAsAuthentication,claimsVC.did,storeHash);
      }
    } else {
      return this.verifiableOtherControllee_(claimsVC.did,storeHash);
    }
  }
  
  verifiableIncreaseAuthMyself_(authMember,didInVC,storeHash) {
    if(this.trace) {
      console.log('DIDVerifiableCredential::verifiableIncreaseAuthMyself_::this.auth_=:<',this.auth_,'>');
      console.log('DIDVerifiableCredential::verifiableIncreaseAuthMyself_::authMember=:<',authMember,'>');
      console.log('DIDVerifiableCredential::verifiableIncreaseAuthMyself_::didInVC=:<',didInVC,'>');
    }
    const didVCNew = JSON.parse(JSON.stringify(this.didDoc_));
    if(this.trace) {
      console.log('DIDVerifiableCredential::verifiableIncreaseAuthMyself_::didVCNew=:<',didVCNew,'>');
    }
    delete didVCNew.proof;
    didVCNew.updated = (new Date()).toISOString();
    for(const authId of authMember) {
      if(this.trace) {
        console.log('DIDVerifiableCredential::verifiableIncreaseAuthMyself_::authId=:<',authId,'>');
      }
      if(didInVC.authentication.includes(authId)) {
        didVCNew.authentication.push(authId);
      }
      const hintMethod = didInVC.verificationMethod.filter((veriMethod) => {
        return veriMethod.id === authId;
      });
      if(this.trace) {
        console.log('DIDVerifiableCredential::verifiableIncreaseAuthMyself_::hintMethod=:<',hintMethod,'>');
      }
      if(hintMethod.length >0) {
        didVCNew.verificationMethod.push(hintMethod[0]);
      }
    }
    if(this.trace) {
      console.log('DIDVerifiableCredential::verifiableIncreaseAuthMyself_::didVCNew=:<',didVCNew,'>');
    }
    const methodId = `${this.didDoc_.id}#${this.auth_.address()}`;
    const signedMsgVC = this.auth_.signWithoutTS(didVCNew);
    const proofVC = {
      type:'ed25519',
      creator:methodId,
      signatureValue:signedMsgVC.auth.sign,
    };
    didVCNew.proof = [proofVC];
    if(this.trace) {
      console.log('DIDVerifiableCredential::verifiableIncreaseAuthMyself_::didVCNew=:<',didVCNew,'>');
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
    if(this.trace) {
      console.log('DIDVerifiableCredential::verifiableIncreaseAuthMyself_::verifiableJson=:<',verifiableJson,'>');
    }
    return verifiableJson;
  }


  verifiableOtherControllee_(did2VC,storeHash) {
    if(this.trace) {
      console.log('DIDVerifiableCredential::verifiableOtherControllee_::this.auth_=:<',this.auth_,'>');
      console.log('DIDVerifiableCredential::verifiableOtherControllee_::did2VC=:<',did2VC,'>');
    }
    const didVCNew = JSON.parse(JSON.stringify(did2VC));
    const oldDidProof = didVCNew.proof;
    if(this.trace) {
      console.log('DIDVerifiableCredential::verifiableOtherControllee_::oldDidProof=:<',oldDidProof,'>');
    }
    delete didVCNew.proof;
    const methodId = `${this.didDoc_.id}#${this.auth_.address()}`;
    didVCNew.updated = (new Date()).toISOString();
    didVCNew.authentication.push(methodId);
    const verificationMethod = {
      id:methodId,
      type: 'ed25519',
      controller:this.didDoc_.id,
      publicKeyMultibase: this.auth_.pub(),
    };
    didVCNew.verificationMethod.push(verificationMethod);
    if(this.trace) {
      console.log('DIDVerifiableCredential::verifiableOtherControllee_::didVCNew=:<',didVCNew,'>');
    }
    const signedMsgVC = this.auth_.signWithoutTS(didVCNew);
    const proofVC = {
      type:'ed25519',
      creator:methodId,
      signatureValue:signedMsgVC.auth.sign,
    };
    didVCNew.proof = [proofVC];
    if(this.trace) {
      console.log('DIDVerifiableCredential::verifiableOtherControllee_::didVCNew=:<',didVCNew,'>');
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

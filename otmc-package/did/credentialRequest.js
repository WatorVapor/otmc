class DIDCredentialRequest {
  constructor(auth,didDoc,util) {
    this.trace = true;
    this.debug = true;
    if(this.trace) {
      console.log('DIDCredentialRequest::constructor::auth=:<',auth,'>');
      console.log('DIDCredentialRequest::constructor::didDoc=:<',didDoc,'>');
    }
    this.auth_ = auth;
    this.didDoc_ = didDoc;
    this.util_ = util;
  }
  credential(claims) {
    if(this.trace) {
      console.log('DIDCredentialRequest::constructor::this.auth_=:<',this.auth_,'>');
      console.log('DIDCredentialRequest::constructor::this.didDoc_=:<',this.didDoc_,'>');
    }
    const credentialJson = {
      '@context':this.didDoc_['@context'],
      type:'VerifiablePresentationRequest',
      created:(new Date()).toISOString(),
      holder:this.didDoc_.controller,
      credentialRequest: {
        type:['VerifiableCredential'],
        issuer:this.didDoc_.controller,
        claims:claims,
        required: true
      },
      challenge:this.util_.randomAddress(),
      domain:[
        'otmc.wator.xyz','mqtt.wator.xyz'
      ]
    };
    const proofs = [];
    const signedMsg = this.auth_.signWithoutTS(credentialJson);
    const proof = {
      type:'ed25519',
      creator:`${this.didDoc_.id}#${this.auth_.address()}`,
      signatureValue:signedMsg.auth.sign,
    };
    proofs.push(proof);
    
    credentialJson.proof = proofs;
    return credentialJson;
  }
  appendDocument(keyid) {
    return didDoc;
  }
}
export class DIDCredentialRequestJoinController extends DIDCredentialRequest {
  constructor(auth,didDoc,util) {
    super(auth,didDoc,util);
    this.trace = true;
  }
  credential() {
    const claims = {
      memberAsAuthentication:[
        `${this.didDoc_.id}#${this.auth_.address()}`
      ],
      message:'Controller Verifiable Presentation Request',
      did:this.didDoc_,
    };
    if(this.trace) {
      console.log('DIDCredentialRequestJoinController::credential:claims=<',claims,'>');
    }
    const credentialDoc = super.credential(claims);
    if(this.trace) {
      console.log('DIDCredentialRequestJoinController::credential:credentialDoc=<',credentialDoc,'>');
    }
    return credentialDoc;
  }
}

export class DIDCredentialRequestJoinTeamMate extends DIDCredentialRequest {
  constructor(auth,didDoc,util) {
    super(auth,didDoc,util);
    this.trace = true;
  }
  credential() {
    const claims = {
      memberAsAuthentication:[
        `${this.didDoc_.id}#${this.auth_.address()}`
      ],
      message:'Team Mate Verifiable Presentation Request',
      did:this.didDoc_,
    };
    if(this.trace) {
      console.log('DIDCredentialRequestJoinTeamMate::credential:claims=<',claims,'>');
    }
    const credentialDoc = super.credential(claims);
    if(this.trace) {
      console.log('DIDCredentialRequestJoinTeamMate::credential:credentialDoc=<',credentialDoc,'>');
    }
    return credentialDoc;
  }
}
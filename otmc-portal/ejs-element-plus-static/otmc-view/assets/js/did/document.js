class DIDConfig {
  static method = 'otmc';
  static context = 'https://www.wator.xyz/otmc/';
  static end_point = 'wss://mqtt.wator.xyz:8084/jwt/mqtt/otmc/public/ws';
  static version = '1.0';
  constructor() {
  }
}

export class DIDSeedDocument {
  static trace = false;
  static debug = true;
  constructor(auth,recovery) {
    this.auth_ = auth;
    this.recovery_ = recovery;
  }
  address() {
    return `did:${DIDConfig.method}:${this.auth_.address()}`;
  }
  document() {
    const didCode = `did:${DIDConfig.method}:${this.auth_.address()}`;
    const didDoc = {
      '@context':`${DIDConfig.context}`,
      id:didCode,
      version:`${DIDConfig.version}`,
      created:(new Date()).toISOString(),
      updated:(new Date()).toISOString(),
      verificationMethod:[
        {
          id:`${didCode}#${this.auth_.address()}`,
          type: 'ed25519',
          controller:didCode,
          publicKeyMultibase: this.auth_.pub(),
        },
        {
          id:`${didCode}#${this.recovery_.address()}`,
          type: 'ed25519',
          controller:didCode,
          publicKeyMultibase: this.recovery_.pub(),
        },
      ],
      authentication:[
        `${didCode}#${this.auth_.address()}`,
      ],
      recovery:[
       `${didCode}#${this.recovery_.address()}`,
     ],
     capabilityInvocation:[
     ],
      service: [
        {
          id:`${didCode}#${this.auth_.address()}`,
          type: 'mqtt',
          serviceEndpoint: `${DIDConfig.end_point}`
        },
      ],
    };
    const proofs = [];
    const signedMsg = this.auth_.signWithoutTS(didDoc);
    const proof = {
      type:'ed25519',
      creator:`${didCode}#${this.auth_.address()}`,
      signatureValue:signedMsg.auth.sign,
    };
    proofs.push(proof);
    
    didDoc.proof = proofs;
    this.didDoc_ = didDoc;
    return didDoc;
  }
  appendDocument(keyid) {
    return didDoc;
  }
}


export class DIDGuestDocument {
  static trace = false;
  static debug = true;
  constructor(address,auth) {
    this.address_ = address;
    this.auth_ = auth;
  }
  address() {
    return this.address_;
  }
  document() {
    const didDoc = {
      '@context':`${DIDConfig.context}`,
      id:this.address(),
      version:`${DIDConfig.version}`,
      created:(new Date()).toISOString(),
      updated:(new Date()).toISOString(),
      verificationMethod:[
        {
          id:`${this.address()}#${this.auth_.address()}`,
          type: 'ed25519',
          controller:this.address_,
          publicKeyMultibase: this.auth_.pub(),
        }
      ],
      authentication:[
        `${this.address()}#${this.auth_.address()}`,
      ],
      service: [
        {
          id:`${this.address()}#${this.auth_.address()}`,
          type: 'mqtt',
          serviceEndpoint: `${DIDConfig.end_point}`
        },
      ],
    };
    const proofs = [];
    const signedMsg = this.auth_.signWithoutTS(didDoc);
    const proof = {
      type:'ed25519',
      creator:`${this.address()}#${this.auth_.address()}`,
      signatureValue:signedMsg.auth.sign,
    };
    proofs.push(proof);
    didDoc.proof = proofs;
    super.didDoc_ = didDoc;
    return didDoc;
  }
}


export class DIDExpandDocument {
  static trace = true;
  static debug = true;
  constructor(nextDid,auth) {
    this.address_ = nextDid.id;
    this.auth_ = auth;
    this.nextDid_ = nextDid;
  }
  address() {
    return this.address_;
  }
  document() {
    delete this.nextDid_.proof;
    const proofs = [];
    const signedMsg = this.auth_.signWithoutTS(this.nextDid_);
    if(DIDExpandDocument.trace) {
      console.log('DIDExpandDocument::document:signedMsg=<',signedMsg,'>');
    }
    const proof = {
      type:'ed25519',
      creator:`${this.address_}#${this.auth_.address()}`,
      signatureValue:signedMsg.auth.sign,
    };
    proofs.push(proof);    
    this.nextDid_.proof = proofs;
    return this.nextDid_;
  }
}

export class DIDAscentDocument {
  static trace = true;
  static debug = true;
  constructor(baseDid,auth) {
    this.address_ = baseDid.id;
    this.auth_ = auth;
    this.baseDid_ = baseDid;
  }
  address() {
    return this.address_;
  }
  document() {
    const proofs = JSON.parse(JSON.stringify(this.baseDid_.proof));
    delete this.baseDid_.proof;
    const signedMsg = this.auth_.signWithoutTS(this.baseDid_);
    if(DIDAscentDocument.trace) {
      console.log('DIDAscentDocument::document:signedMsg=<',signedMsg,'>');
    }
    const proof = {
      type:'ed25519',
      creator:`${this.address_}#${this.auth_.address()}`,
      signatureValue:signedMsg.auth.sign,
    };
    proofs.push(proof);    
    this.baseDid_.proof = proofs;
    return this.baseDid_;
  }
}


/*
export class DIDLinkedDocument {
  static trace = false;
  static debug = true;
  constructor(evidence) {
    if(DIDLinkedDocument.trace) {
      console.log('DIDLinkedDocument::constructor:evidence=<',evidence,'>');
    }
    this.address_ = evidence.id;
    this.didDoc_ = JSON.parse(JSON.stringify(evidence));
    this.didDocWork_ = JSON.parse(JSON.stringify(evidence));
  }
  async load() {
    await this.loadAuthMass_();
  }
  address() {
    return this.address_;
  }
  document() {
    if(DIDLinkedDocument.trace) {
      console.log('DIDLinkedDocument::document:this.didDoc_=<',JSON.stringify(this.didDoc_,undefined,2),'>');
    }
    return this.didDoc_;
  }
  appendDocument(keyid,keyB64) {
    if(DIDLinkedDocument.trace) {
      console.log('DIDLinkedDocument::appendDocument:keyid=<',keyid,'>');
      console.log('DIDLinkedDocument::appendDocument:keyB64=<',keyB64,'>');
      console.log('DIDLinkedDocument::appendDocument:this.didDoc_=<',this.didDoc_,'>');
    }
    const didCode = this.didDoc_.id;
    const newDidDoc = JSON.parse(JSON.stringify(this.didDoc_));
    newDidDoc.updated = (new Date()).toISOString();
    const keyIdFull = `${didCode}#${keyid}`;

    const newPublicKey = {
      id:keyIdFull,
      type: 'ed25519',
      publicKeyBase64: keyB64,      
    };
    let isNewPubKey = true;
    for( const publicKey of newDidDoc.publicKey) {
      if(publicKey.publicKeyBase64 === keyB64) {
        isNewPubKey = false;
      }
    }
    if(isNewPubKey) {
      newDidDoc.publicKey.push(newPublicKey);
    }
    if(newDidDoc.authentication.indexOf(keyIdFull) === -1){
      newDidDoc.authentication.push(keyIdFull);
    }
    
    delete newDidDoc.proof;
    const creator = `${didCode}#${this.massAuth_.address_}`;
    const proofs = this.didDoc_.proof.filter(( proof ) => {
      return proof.creator !== creator;
    });
    const signedMsg = this.massAuth_.signWithoutTS(newDidDoc);
    const proof = {
      type:'ed25519',
      creator:creator,
      signatureValue:signedMsg.auth.sign,
    };
    proofs.push(proof); 
    newDidDoc.proof = proofs;
    return newDidDoc;
  }
  isComplete() {
    if(DIDLinkedDocument.debug) {
      console.log('DIDLinkedDocument::isComplete:this.didDocWork_=<',this.didDocWork_,'>');
    }
    const isGood = this.massAuth_.verifyDidDoc(this.didDocWork_);
    if(DIDLinkedDocument.debug) {
      console.log('DIDLinkedDocument::isComplete:isGood=<',isGood,'>');
    }
    if(isGood === false) {
      console.log('DIDLinkedDocument::isComplete:isGood=<',isGood,'>');
      return false;
    }
    for(const proof of this.didDocWork_.proof) {
      if(DIDLinkedDocument.debug) {
        console.log('DIDLinkedDocument::isComplete:proof=<',proof,'>');
      }
      const isHintProof = proof.creator.endsWith(`#${this.massAuth_.address_}`);
      if(DIDLinkedDocument.debug) {
        console.log('DIDLinkedDocument::isComplete:proof.creator=<',proof.creator,'>');
        console.log('DIDLinkedDocument::isComplete:this.massAuth_.address_=<',this.massAuth_.address_,'>');
        console.log('DIDLinkedDocument::isComplete:isHintProof=<',isHintProof,'>');
      }
      if(isHintProof) {
        return true;
      }
    }
    return false;
  }
  completeProof(){
    if(DIDLinkedDocument.debug) {
      console.log('DIDLinkedDocument::completeProof:this.didDoc_=<',this.didDoc_,'>');
    }
    const didDoc = JSON.parse(JSON.stringify(this.didDoc_));
    delete didDoc.proof;
    const signedMsg = this.massAuth_.signWithoutTS(didDoc);
    const proof = {
      type:'ed25519',
      creator:`${this.address()}#${this.massAuth_.address_}`,
      signatureValue:signedMsg.auth.sign,
    };
    const newDidDoc = JSON.parse(JSON.stringify(this.didDoc_));
    if(!newDidDoc.proof) {
      newDidDoc.proof = [];
    }
    newDidDoc.proof.push(proof);
    if(DIDLinkedDocument.debug) {
      console.log('DIDLinkedDocument::completeProof:newDidDoc=<',newDidDoc,'>');
    }
    return newDidDoc;
  }
  
  async loadAuthMass_() {
    if(DIDLinkedDocument.debug) {
      console.log('DIDLinkedDocument::loadAuthMass_:this.didDoc_=<',this.didDoc_,'>');
    }
    if(!this.didDoc_.authentication) {
      return;
    }
    for(const authentication of this.didDoc_.authentication) {
      if(DIDLinkedDocument.debug) {
        console.log('DIDLinkedDocument::loadAuthMass_:authentication=<',authentication,'>');
      }
      const authParams = authentication.split('#');
      if(authParams.length >1 ) {
        const keyId = authParams[authParams.length-1];
        if(DIDLinkedDocument.debug) {
          console.log('DIDLinkedDocument::loadAuthMass_:keyId=<',keyId,'>');
        }
        if(keyId) {
          const mass = new MassStore(keyId);
          const isGood = await mass.load();
          if(DIDLinkedDocument.debug) {
            console.log('DIDLinkedDocument::loadAuthMass_:isGood=<',isGood,'>');
          }
          if(isGood) {
            if(DIDLinkedDocument.debug) {
              console.log('DIDLinkedDocument::loadAuthMass_:this.didDoc_.service=<',this.didDoc_.service,'>');
            }
            for(const service of this.didDoc_.service) {
              if(service.id.endsWith(`#${keyId}`)) {
                this.massAuth_ = mass;            
                return;
              }
            }
          }
        }
      }
    }
  }
}
*/


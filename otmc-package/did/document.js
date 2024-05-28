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
      capabilityInvocation:[],
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

export class DIDGuestGuestDocument {
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
      authentication:[],
      recovery:[ ],
      capabilityInvocation:[ ],
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


export class DIDGuestAuthDocument {
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
      recovery:[ ],
      capabilityInvocation:[ ],
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

export class DIDGuestCapabilityDocument {
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
      authentication:[ ],
      recovery:[ ],
      capabilityInvocation:[
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


export class DIDMergeDocument {
  constructor(baseDid,auth) {
    this.trace = true;
    this.debug = true;
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
    if(this.trace) {
      console.log('DIDMergeDocument::document:signedMsg=<',signedMsg,'>');
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




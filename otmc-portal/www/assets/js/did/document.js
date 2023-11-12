import {MassStore} from './mass-store.js';

export class DIDDocument {
  static debug = true;
  static did_method = 'maap';
  static did_context = 'https://www.wator.xyz/maap/';
  static did_mqtt_end_point = 'wss://wator.xyz:8084/jwt/did';
  static did_mqtt_uri = 'wss://wator.xyz:8084/mqtt';
  constructor() {
  }
}

export class DIDSeedDocument {
  static debug = true;
  constructor(cb) {
    this.ready1_ = false;
    this.ready2_ = false;
    const self = this;
    const massAuth = new MassStore(null,(good)=>{
      if(good === true) {
        self.massAuth_ = massAuth;
      }
      self.ready1_ = true;
      self.tryCallReady_(cb);
    });
    const massRecovery = new MassStore(null,(good) => {
      if(good === true) {
        self.massRecovery_ = massRecovery;
      }
      self.ready2_ = true;
      self.tryCallReady_(cb);
    });
  }
  address() {
    return `did:${DIDDocument.did_method}:${this.massAuth_.address()}`;
  }
  document() {
    const didCode = `did:${DIDDocument.did_method}:${this.massAuth_.address()}`;
    const didDoc = {
      '@context':`${DIDDocument.did_context}`,
      id:didCode,
      version:1.0,
      created:(new Date()).toISOString(),
      updated:(new Date()).toISOString(),
      publicKey:[
        {
          id:`${didCode}#${this.massAuth_.address()}`,
          type: 'ed25519',
          publicKeyBase64: this.massAuth_.pub(),
        },
        {
          id:`${didCode}#${this.massRecovery_.address()}`,
          type: 'ed25519',
          publicKeyBase64: this.massRecovery_.pub(),
        },
      ],
      authentication:[
        `${didCode}#${this.massAuth_.address()}`,
      ],
      recovery:[
       `${didCode}#${this.massRecovery_.address()}`,
     ],
      service: [
        {
          id:`${didCode}#${this.massAuth_.address()}`,
          type: 'mqtturi',
          serviceEndpoint: `${DIDDocument.did_mqtt_end_point}`,
          serviceMqtt:{
            uri:`${DIDDocument.did_mqtt_uri}`,
            acl:{
              all:[
              `${didCode}/#`,
              ]
            }
          }
        },
      ],
    };
    const proofs = [];
    const signedMsg = this.massAuth_.signWithoutTS(didDoc);
    const proof = {
      type:'ed25519',
      creator:`${didCode}#${this.massAuth_.address_}`,
      signatureValue:signedMsg.auth.sign,
    };
    proofs.push(proof);
    
    didDoc.proof = proofs;
    this.didDoc_ = didDoc;
    return didDoc;
  }
  joinDocument(keyid) {
    return didDoc;
  }
  tryCallReady_(cb) {
    if(this.ready1_ && this.ready2_) {
      if(self.massAuth_) {
        this.document();
        cb(true);
      } else {
        cb(false);        
      }
    }
  }
}

export class DIDLinkedDocument {
  static trace = false;
  static debug = true;
  constructor(evidence,cb) {
    if(DIDLinkedDocument.trace) {
      console.log('DIDLinkedDocument::constructor:evidence=<',evidence,'>');
    }
    this.cb_ = cb;
    this.address_ = evidence.id;
    this.didDoc_ = evidence;
    this.loadAuthMass_();
  }
  address() {
    return this.address_;
  }
  document() {
    if(DIDLinkedDocument.trace) {
      console.log('DIDLinkedDocument::document:this.didDoc_=<',this.didDoc_,'>');
    }
    return this.didDoc_;
  }
  joinDocument(keyid,keyB64) {
    if(DIDLinkedDocument.trace) {
      console.log('DIDLinkedDocument::joinDocument:keyid=<',keyid,'>');
      console.log('DIDLinkedDocument::joinDocument:keyB64=<',keyB64,'>');
      console.log('DIDLinkedDocument::joinDocument:this.didDoc_=<',this.didDoc_,'>');
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
    const newService = {
      id:`${didCode}#${keyid}`,
      type: 'mqtturi',
      serviceEndpoint: `${DIDDocument.did_mqtt_end_point}`,
      serviceMqtt:{
        uri:`${DIDDocument.did_mqtt_uri}`,
        acl:{
          all:[
          `${didCode}/#`,
          ]
        }
      }      
    };
    let isNewService = true;
    for( const service of newDidDoc.service) {
      if(service.id === newService.id) {
        isNewService = false;
      }
    }
    if(isNewService) {
      newDidDoc.service.push(newService);
    }
    if(DIDLinkedDocument.trace) {
      console.log('DIDLinkedDocument::joinDocument:newDidDoc.service=<',newDidDoc.service,'>');
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

  growDocument(incomeCoc) {
    if(DIDLinkedDocument.debug) {
      console.log('DIDLinkedDocument::growDocument:incomeCoc.didDoc=<',incomeCoc.didDoc,'>');
      console.log('DIDLinkedDocument::growDocument:this.didDoc_=<',this.didDoc_,'>');
    }
    const goodIncome = this.massAuth_.verifyDidDoc(incomeCoc.didDoc);
    if(DIDLinkedDocument.debug) {
      console.log('DIDLinkedDocument::growDocument:goodIncome=<',goodIncome,'>');
    }
    if(!goodIncome) {
      console.log('DIDLinkedDocument::growDocument:goodIncome=<',goodIncome,'>');
      return false;
    }
    if(this.didDoc_.id !== incomeCoc.didDoc.id) {
      return false;
    }
    if(this.didDoc_.created !== incomeCoc.didDoc.created) {
      return false;
    }

    const didCode = this.didDoc_.id;
    const newDidDoc = JSON.parse(JSON.stringify(incomeCoc.didDoc));
    if(DIDLinkedDocument.debug) {
      console.log('DIDLinkedDocument::growDocument:newDidDoc=<',newDidDoc,'>');
    }
    let isModified = false;


    // authentication 
    for( const origAuth of this.didDoc_.authentication) {
      if(DIDLinkedDocument.trace) {
        console.log('DIDLinkedDocument::growDocument:origAuth=<',origAuth,'>');
      }
      const isIncluded = newDidDoc.authentication.includes(origAuth);
      if(DIDLinkedDocument.debug) {
        console.log('DIDLinkedDocument::growDocument:isIncluded=<',isIncluded,'>');
      }
      if(isIncluded === false) {
        newDidDoc.authentication.push(origAuth);
        isModified = true;
      }
    }
    // recovery 
    for( const origRecovery of this.didDoc_.recovery) {
      if(DIDLinkedDocument.trace) {
        console.log('DIDLinkedDocument::growDocument:origRecovery=<',origRecovery,'>');
      }
      const isIncluded = newDidDoc.recovery.includes(origRecovery);
      if(DIDLinkedDocument.debug) {
        console.log('DIDLinkedDocument::growDocument:isIncluded=<',isIncluded,'>');
      }
      if(isIncluded === false) {
        newDidDoc.recovery.push(origRecovery);
        isModified = true;
      }
    }
    // public key 
    for( const origPublicKey of this.didDoc_.publicKey) {
      if(DIDLinkedDocument.trace) {
        console.log('DIDLinkedDocument::growDocument:origPublicKey=<',origPublicKey,'>');
      }
      let isIncluded = false;
      for( const newPublicKey of newDidDoc.publicKey) {
        if(DIDLinkedDocument.trace) {
          console.log('DIDLinkedDocument::growDocument:newPublicKey=<',newPublicKey,'>');
        }
        if(newPublicKey.id === origPublicKey.id) {
          isIncluded = true;
        }
      }
      if(DIDLinkedDocument.debug) {
        console.log('DIDLinkedDocument::growDocument:isIncluded=<',isIncluded,'>');
      }
      if(isIncluded === false) {
        newDidDoc.publicKey.push(origPublicKey);
        isModified = true;
      }
    }
    // service
    for( const origService of this.didDoc_.service) {
      if(DIDLinkedDocument.trace) {
        console.log('DIDLinkedDocument::growDocument:origService=<',origService,'>');
      }
      let isIncluded = false;
      for( const newService of newDidDoc.service) {
        if(DIDLinkedDocument.trace) {
          console.log('DIDLinkedDocument::growDocument:newService=<',newService,'>');
        }
        if(newService.id === origService.id) {
          isIncluded = true;
        }
      }
      if(DIDLinkedDocument.debug) {
        console.log('DIDLinkedDocument::growDocument:isIncluded=<',isIncluded,'>');
      }
      if(isIncluded === false) {
        newDidDoc.service.push(origService);
        isModified = true;
      }
    }

    if(DIDLinkedDocument.debug) {
      console.log('DIDLinkedDocument::growDocument:isModified=<',isModified,'>');
    }
    
    let proofAgain = false;
    
    if(isModified) {
      newDidDoc.updated = (new Date()).toISOString();
      proofAgain = true;
    } else {
      // proof
      for( const origProof of this.didDoc_.proof) {
        if(DIDLinkedDocument.trace) {
          console.log('DIDLinkedDocument::growDocument:origProof=<',origProof,'>');
        }
        let isIncluded = false;
        for( const newProof of newDidDoc.proof) {
          if(DIDLinkedDocument.trace) {
            console.log('DIDLinkedDocument::growDocument:newProof=<',newProof,'>');
          }
          if(newProof.creator === origProof.creator) {
            isIncluded = true;
          }
        }
        if(DIDLinkedDocument.debug) {
          console.log('DIDLinkedDocument::growDocument:isIncluded=<',isIncluded,'>');
        }
        if(isIncluded === false) {
          proofAgain = true;
        }
      }
    }
    if(DIDLinkedDocument.debug) {
      console.log('DIDLinkedDocument::growDocument:proofAgain=<',proofAgain,'>');
    }
    
    if(proofAgain) {
      delete newDidDoc.proof;
      const creator = `${didCode}#${this.massAuth_.address_}`;
      const proofs = newDidDoc.proof.filter(( proof ) => {
        return proof.creator !== creator;
      });
      if(DIDLinkedDocument.debug) {
        console.log('DIDLinkedDocument::growDocument:proofs=<',proofs,'>');
      }
      const signedMsg = this.massAuth_.signWithoutTS(newDidDoc);
      const proof = {
        type:'ed25519',
        creator:creator,
        signatureValue:signedMsg.auth.sign,
      };
      proofs.push(proof); 
      newDidDoc.proof = proofs;
      
    } else {
      let isLongerThanMe = false;
      if(newDidDoc.proof.length > this.didDoc_.proof.length) {
        isLongerThanMe = true;
      }
      if(newDidDoc.service.length > this.didDoc_.service.length) {
        isLongerThanMe = true;
      }
      if(newDidDoc.publicKey.length > this.didDoc_.publicKey.length) {
        isLongerThanMe = true;
      }
      if(newDidDoc.recovery.length > this.didDoc_.recovery.length) {
        isLongerThanMe = true;
      }
      if(isLongerThanMe) {
        return newDidDoc;
      } else {
        return false;
      }
    }
    return false;
  }
  


  loadAuthMass_() {
    if(DIDLinkedDocument.trace) {
      console.log('DIDLinkedDocument::loadAuthMass_:this.didDoc_=<',this.didDoc_,'>');
    }
    const self = this;
    for(const authentication of this.didDoc_.authentication) {
      if(DIDLinkedDocument.trace) {
        console.log('DIDLinkedDocument::loadAuthMass_:authentication=<',authentication,'>');
      }
      const authParams = authentication.split('#');
      if(authParams.length >1 ) {
        const keyId = authParams[authParams.length-1];
        if(DIDLinkedDocument.trace) {
          console.log('DIDLinkedDocument::loadAuthMass_:keyId=<',keyId,'>');
        }
        if(keyId && !this.massAuth_) {
          const mass = new MassStore(keyId,(good)=>{
            if(DIDLinkedDocument.trace) {
              console.log('DIDLinkedDocument::loadAuthMass_:good=<',good,'>');
            }
            if(good) {
              for(const service of self.didDoc_.service) {
                if(service.id.endsWith(`#${keyId}`)) {
                  self.massAuth_ = mass;
                  if(typeof self.cb_ === 'function') {
                    self.cb_();
                  }
                }
              }
            }
          });
        }
      }
    }
  }
}


export class DIDGuestDocument {
  static debug = true;
  constructor(address,cb) {
    this.address_ = address;
    const self = this;
    this.massAuth_ = new MassStore(null,() => {
      self.document();
      cb();
    });
  }
  address() {
    return this.address_;
  }
  document() {
    const didDoc = {
      '@context':`${DIDDocument.did_context}`,
      id:this.address(),
      version:1.0,
      created:(new Date()).toISOString(),
      updated:(new Date()).toISOString(),
      publicKey:[
        {
          id:`${this.address()}#${this.massAuth_.address()}`,
          type: 'ed25519',
          publicKeyBase64: this.massAuth_.pub(),
        }
      ],
      authentication:[
        `${this.address()}#${this.massAuth_.address()}`,
      ],
      service: [
        {
          id:`${this.address()}#${this.massAuth_.address()}`,
          type: 'mqtturi',
          serviceEndpoint: `${DIDDocument.did_mqtt_end_point}`,
          serviceMqtt:{
            uri:`${DIDDocument.did_mqtt_uri}`,
            acl:{
              all:[
                `${this.address()}/invited/#`,
              ]
            }
          }
        },
      ],
    };
    const proofs = [];
    const signedMsg = this.massAuth_.signWithoutTS(didDoc);
    const proof = {
      type:'ed25519',
      creator:`${this.address()}#${this.massAuth_.address_}`,
      signatureValue:signedMsg.auth.sign,
    };
    proofs.push(proof);
    didDoc.proof = proofs;
    super.didDoc_ = didDoc;
    return didDoc;
  }
}

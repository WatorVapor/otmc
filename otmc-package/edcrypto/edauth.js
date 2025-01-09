const strConstAddressPrefix = 'otm';
export class EdAuth {
  /**
   * Constructs an instance of the EdAuth class.
   * 
   * @param {Object} edKey - The Ed25519 key object.
   * @param {Object} util - Utility object containing necessary functions and libraries.
   * @param {Object} util.nacl - NaCl cryptographic library.
   * @param {Object} [util.nacl.default] - Default export of the NaCl library, if available.
   */
  constructor(edKey,util) {
    this.trace1 = false;
    this.trace2 = false;
    this.trace = false;
    this.debug = true;
    this.edKey_ = edKey;
    this.util_ = util;
    if(util.nacl) {
      if(util.nacl.default) {
        this.nacl = util.nacl.default;
      } else {
        this.nacl = util.nacl;
      }
    }
    if(this.trace) {
      console.log('EdAuth::constructor:this.nacl=<',this.nacl,'>');
    }
  }
  /**
   * Retrieves the ID of the current key.
   * If tracing is enabled, logs the key information to the console.
   *
   * @returns {string|null} The ID of the current key if it exists, otherwise null.
   */
  address() {
    if(this.trace) {
      console.log('EdAuth::address::this.edKey_=<',this.edKey_,'>');
    }
    if(this.edKey_) {
      return this.edKey_.idOfKey;
    } else {
      return null;
    }    
  }
  /**
   * Retrieves the public key from the edKey_ object.
   * If the trace flag is set, logs the edKey_ object to the console.
   *
   * @returns {Object|null} The public key if edKey_ is defined, otherwise null.
   */
  pub() {
    if(this.trace) {
      console.log('EdAuth::pub::this.edKey_=<',this.edKey_,'>');
    }
    if(this.edKey_) {
      return this.edKey_.publicKey;
    } else {
      return null;
    }    
  }
  /**
   * Signs a message by adding a timestamp and then signing it.
   *
   * @param {Object} msgOrig - The original message object to be signed.
   * @param {Object} edKey - The key used for signing the message.
   * @returns {Object} - The signed message.
   */
  sign(msgOrig,edKey) {
    msgOrig.ts = new Date().toISOString();
    return this.signWithoutTS(msgOrig,edKey);
  }
  /**
   * Signs a message without a timestamp using the provided Ed25519 key.
   *
   * @param {Object} msgOrig - The original message object to be signed.
   * @param {Object} [edKey] - Optional Ed25519 key object containing `secretKey` and `publicKey`.
   * @returns {Object} The signed message object with an added `auth` property containing the public key and signature.
   */
  signWithoutTS(msgOrig,edKey) {
    if(this.trace) {
      console.log('EdAuth::signWithoutTS::msgOrig=<',msgOrig,'>');
      console.log('EdAuth::signWithoutTS::edKey=<',edKey,'>');
      console.log('EdAuth::signWithoutTS::this.nacl=<',this.nacl,'>');
    }
    let signkey = this.edKey_;
    if(edKey) {
      signkey = edKey;
    }
    const msgOrigStr = JSON.stringify(msgOrig);
    const hashMsgB64 = this.util_.calcMessage(msgOrigStr);
    if(this.trace) {
      console.log('EdAuth::signWithoutTS::hashMsgB64=<',hashMsgB64,'>');
    }
    const hashMsgBin = this.util_.decodeBase64(hashMsgB64);;
    if(this.trace) {
      console.log('EdAuth::signWithoutTS::hashMsgBin=<',hashMsgBin,'>');
    }
    const secretKeyBin = this.util_.decodeBase64(signkey.secretKey);;
    if(this.trace) {
      console.log('EdAuth::signWithoutTS::secretKeyBin=<',secretKeyBin,'>');
    }
    const signed = this.nacl.sign(hashMsgBin,secretKeyBin);
    if(this.trace) {
      console.log('EdAuth::signWithoutTS::signed=<',signed,'>');
    }
    const signedB64 = this.util_.encodeBase64(signed);
    if(this.trace) {
      console.log('EdAuth::signWithoutTS::signedB64=<',signedB64,'>');
    }
    const signMsgObj = JSON.parse(msgOrigStr);
    signMsgObj.auth = {};
    signMsgObj.auth.pub = signkey.publicKey;
    signMsgObj.auth.sign = signedB64;
    return signMsgObj;
  }
  /**
   * Verifies the authenticity and integrity of a given message.
   *
   * @param {Object} msg - The message object to verify.
   * @param {string} msg.ts - The timestamp of the message.
   * @param {Object} msg.auth - The authentication object containing public key and signature.
   * @param {string} msg.auth.pub - The base64 encoded public key.
   * @param {string} msg.auth.sign - The base64 encoded signature.
   * @returns {boolean} - Returns true if the message is verified successfully, otherwise false.
   */
  verify(msg) {
    if(this.trace) {
      console.log('EdAuth::verify::msg=<',msg,'>');
    }
    const created_at = new Date(msg.ts);
    const now = new Date();
    const escape_ms = now - created_at;
    if(this.trace) {
      console.log('EdAuth::verify::escape_ms=<',escape_ms,'>');
    }
    if(escape_ms > 1000*5) {
      console.log('EdAuth::verify::escape_ms=<',escape_ms,'>');
      return false;
    } 
    const calcAddress = this.util_.calcAddress(msg.auth.pub);
    if(this.trace) {
      console.log('EdAuth::verify::calcAddress=<',calcAddress,'>');
    }
    if(!calcAddress.startsWith(strConstAddressPrefix)) {
      console.log('EdAuth::verify::calcAddress=<',calcAddress,'>');
      return false;
    }
    const publicKey = this.util_.decodeBase64(msg.auth.pub);
    const signMsg = this.util_.decodeBase64(msg.auth.sign);
    if(this.trace) {
      console.log('EdAuth::verify::publicKey=<',publicKey,'>');
      console.log('EdAuth::verify::signMsg=<',signMsg,'>');
    }
    const signedHash = this.nacl.sign.open(signMsg,publicKey);
    if(!signedHash) {
      console.log('EdAuth::verify::signedHash=<',signedHash,'>');
      return false;
    }
    const signedHashB64 = this.util_.encodeBase64(signedHash);
    if(this.trace) {
      console.log('EdAuth::verify::signedHashB64=<',signedHashB64,'>');
    }
    const msgCal = JSON.parse(JSON.stringify(msg));
    delete msgCal.auth;
    const msgCalcStr = JSON.stringify(msgCal);
    if(this.trace) {
      console.log('EdAuth::verify::msgCalcStr=<',msgCalcStr,'>');
    }
    const hashCalclB64 = this.util_.calcMessage(msgCalcStr);
    if(signedHashB64 === hashCalclB64) {
      msg.auth_address = calcAddress;
      return true;
    } else {
      console.log('EdAuth::verify::signedHashB64=<',signedHashB64,'>');
      console.log('EdAuth::verify::hashCalclB64=<',hashCalclB64,'>');
    }
    return false;
  }
  /**
   * Verifies the authenticity of a message without a timestamp.
   *
   * @param {Object} msg - The message object to verify.
   * @param {Object} msg.auth - The authentication object within the message.
   * @param {string} msg.auth.pub - The public key in base64 format.
   * @param {string} msg.auth.sign - The signature in base64 format.
   * @returns {boolean} - Returns true if the message is verified successfully, otherwise false.
   */
  verifyWithoutTS(msg) {
    if(this.trace) {
      console.log('EdAuth::verifyWithoutTS::msg=<',msg,'>');
    }
    const calcAddress = this.util_.calcAddress(msg.auth.pub);
    if(this.trace) {
      console.log('EdAuth::verifyWithoutTS::calcAddress=<',calcAddress,'>');
    }
    if(!calcAddress.startsWith(strConstAddressPrefix)) {
      console.log('EdAuth::verifyWithoutTS::calcAddress=<',calcAddress,'>');
      return false;
    }
    const publicKey = this.util_.decodeBase64(msg.auth.pub);
    const signMsg = this.util_.decodeBase64(msg.auth.sign);
    if(this.trace) {
      console.log('EdAuth::verifyWithoutTS::publicKey=<',publicKey,'>');
      console.log('EdAuth::verifyWithoutTS::signMsg=<',signMsg,'>');
    }
    const signedHash = this.nacl.sign.open(signMsg,publicKey);
    if(!signedHash) {
      console.log('EdAuth::verifyWithoutTS::signedHash=<',signedHash,'>');
      return false;
    }
    const signedHashB64 = this.util_.encodeBase64(signedHash);
    if(this.trace) {
      console.log('EdAuth::verifyWithoutTS::signedHashB64=<',signedHashB64,'>');
    }
    const msgCal = JSON.parse(JSON.stringify(msg));
    delete msgCal.auth;
    const msgCalcStr = JSON.stringify(msgCal);
    if(this.trace) {
      console.log('EdAuth::verifyWithoutTS::msgCalcStr=<',msgCalcStr,'>');
    }
    const hashCalclB64 = this.util_.calcMessage(msgCalcStr);
    if(signedHashB64 === hashCalclB64) {
      msg.auth_address = calcAddress;
      return true;
    } else {
      console.log('EdAuth::verifyWithoutTS::signedHashB64=<',signedHashB64,'>');
      console.log('EdAuth::verifyWithoutTS::hashCalclB64=<',hashCalclB64,'>');
    }
    return false;
  }
  /**
   * Verifies the DID Document.
   *
   * @param {Object} didDoc - The DID Document to verify.
   * @param {Array} didDoc.verificationMethod - Array of verification methods.
   * @param {Array} didDoc.proof - Array of proofs.
   * @param {string} didDoc.id - The DID Document ID.
   * @param {string} didDoc.controller - The DID Document controller.
   * @returns {Object|boolean} - Returns an object containing the calculated hash and proofer addresses if verification is successful, otherwise returns false.
   */
  verifyDid(didDoc) {
    if(this.trace2) {
      console.log('EdAuth::verifyDid::didDoc=<',didDoc,'>');
    }
    for(const method of didDoc.verificationMethod) {
      const goodMethod = this.verificationMethod_(method,didDoc.id,didDoc.controller);
      if(this.trace2) {
        console.log('EdAuth::verifyDid::goodMethod=<',goodMethod,'>');
      }
      if(!goodMethod) {
        if(this.debug) {
          console.log('EdAuth::verifyDid::method=<',method,'>');
        }
        return false;
      }
    }
    const didDocCal = JSON.parse(JSON.stringify(didDoc));
    delete didDocCal.proof;
    const didDocCalcStr = JSON.stringify(didDocCal);
    const hashCalcledB64 = this.util_.calcMessage(didDocCalcStr);
    if(this.trace2) {
      console.log('EdAuth::verifyDid::hashCalcledB64=<',hashCalcledB64,'>');
    }
    const results = {
      hashCalcledB64:hashCalcledB64,
      prooferAddress:[]
    }
    for(const proof of didDoc.proof) {
      if(this.trace2) {
        console.log('EdAuth::verifyDid::proof=<',proof,'>');
      }
      const verifyResult = this.verificationProof_(proof,didDoc.verificationMethod);
      if(!verifyResult) {
        console.log('EdAuth::verifyDid::proof=<',proof,'>');
        console.log('EdAuth::verifyDid::verifyResult=<',verifyResult,'>');
        return false;
      }
      if(this.trace2) {
        console.log('EdAuth::verifyDid::hashCalcledB64=<',hashCalcledB64,'>');
        console.log('EdAuth::verifyDid::verifyResult=<',verifyResult,'>');
      }
      if(hashCalcledB64 !== verifyResult.signedHashB64) {
        console.log('EdAuth::verifyDid::hashCalcledB64=<',hashCalcledB64,'>');
        console.log('EdAuth::verifyDid::verifyResult=<',verifyResult,'>');
        return false;        
      }
      results.prooferAddress.push(proof.creator);
    }
    results.proofList = this.collectVerificationMember_(didDoc);
    if(this.trace2) {
      console.log('EdAuth::verifyDid::results=<',results,'>');
    }
    return results;
  }
  /**
   * Verifies the authenticity and integrity of a message using a weak verification method.
   *
   * @param {Object} msg - The message object to verify.
   * @param {string} msg.ts - The timestamp of the message.
   * @param {Object} msg.auth - The authentication object containing public key and signature.
   * @param {string} msg.auth.pub - The base64 encoded public key.
   * @param {string} msg.auth.sign - The base64 encoded signature.
   * @returns {boolean} - Returns true if the message is verified successfully, otherwise false.
   */
  verifyWeak(msg) {
    if(this.trace) {
      console.log('EdAuth::verifyWeak::msg=<',msg,'>');
    }
    const created_at = new Date(msg.ts);
    const now = new Date();
    const escape_ms = now - created_at;
    if(this.trace) {
      console.log('EdAuth::verifyWeak::escape_ms=<',escape_ms,'>');
    }
    if(escape_ms > 1000*5) {
      console.log('EdAuth::verifyWeak::escape_ms=<',escape_ms,'>');
      return false;
    } 
    const calcAddress = this.util_.calcAddress(msg.auth.pub);
    if(this.trace) {
      console.log('EdAuth::verifyWeak::calcAddress=<',calcAddress,'>');
    }
    const publicKey = this.nacl.util.decodeBase64(msg.auth.pub);
    const signMsg = this.nacl.util.decodeBase64(msg.auth.sign);
    if(this.trace) {
      console.log('EdAuth::verifyWeak::publicKey=<',publicKey,'>');
      console.log('EdAuth::verifyWeak::signMsg=<',signMsg,'>');
    }
    const signedHash = this.nacl.sign.open(signMsg,publicKey);
    if(!signedHash) {
      console.log('EdAuth::verifyWeak::signedHash=<',signedHash,'>');
      return false;
    }
    const signedHashB64 = this.nacl.util.encodeBase64(signedHash);
    if(this.trace) {
      console.log('EdAuth::verifyWeak::signedHashB64=<',signedHashB64,'>');
    }
    const msgCal = JSON.parse(JSON.stringify(msg));
    delete msgCal.auth;
    const msgCalcStr = JSON.stringify(msgCal);
    const hashCalclB64 = this.util_.calcMessage(msgCalcStr);
    if(signedHashB64 === hashCalclB64) {
      msg.auth_address = calcAddress;
      return true;
    } else {
      console.log('EdAuth::verifyWeak::signedHashB64=<',signedHashB64,'>');
      console.log('EdAuth::verifyWeak::hashCalclB64=<',hashCalclB64,'>');
    }
    return false;
  }
  /**
   * Verifies the credential request.
   *
   * @param {Object} credReq - The credential request object to verify.
   * @param {Object} credReq.credentialRequest - The credential request details.
   * @param {Object} credReq.credentialRequest.claims - The claims within the credential request.
   * @param {Object} credReq.credentialRequest.claims.did - The DID (Decentralized Identifier) within the claims.
   * @param {Array} credReq.proof - The proof array within the credential request.
   * @returns {Object|boolean} - Returns an object containing the calculated hash and proof list if verification is successful, otherwise returns false.
   */
  verifyCredReq(credReq) {
    if(this.trace1) {
      console.log('EdAuth::verifyCredReq::credReq=<',credReq,'>');
    }
    if(!credReq) {
      return false;
    }
    if(!credReq.credentialRequest) {
      return false;
    }
    if(!credReq.credentialRequest.claims) {
      return false;
    }
    if(!credReq.credentialRequest.claims.did) {
      return false;
    }
    const goodDid = this.verifyDid(credReq.credentialRequest.claims.did);
    if(this.trace1) {
      console.log('EdAuth::verifyCredReq::goodDid=<',goodDid,'>');
    }
    const credReqCal = JSON.parse(JSON.stringify(credReq));
    delete credReqCal.proof;
    const credReqCalcStr = JSON.stringify(credReqCal);
    const hashCalcledB64 = this.util_.calcMessage(credReqCalcStr);
    if(this.trace1) {
      console.log('EdAuth::verifyCredReq::hashCalcledB64=<',hashCalcledB64,'>');
    }
    const results = {
      hashCalcledB64:hashCalcledB64
    }
    const verificationMethods = credReq.credentialRequest.claims.did.verificationMethod;
    if(this.trace1) {
      console.log('EdAuth::verifyCredReq::verificationMethods=<',verificationMethods,'>');
    }
    for(const proof of credReq.proof) {
      if(this.trace1) {
        console.log('EdAuth::verifyCredReq::proof=<',proof,'>');
      }
      const verifyResult = this.verificationProof_(proof,verificationMethods);
      if(!verifyResult) {
        console.log('EdAuth::verifyCredReq::proof=<',proof,'>');
        console.log('EdAuth::verifyCredReq::verifyResult=<',verifyResult,'>');
        return false;
      }
      if(this.trace1) {
        console.log('EdAuth::verifyCredReq::hashCalcledB64=<',hashCalcledB64,'>');
        console.log('EdAuth::verifyCredReq::verifyResult=<',verifyResult,'>');
      }
      if(hashCalcledB64 !== verifyResult.signedHashB64) {
        console.log('EdAuth::verifyCredReq::hashCalcledB64=<',hashCalcledB64,'>');
        console.log('EdAuth::verifyCredReq::verifyResult=<',verifyResult,'>');
        return false;        
      }
    }
    const authentications = credReq.credentialRequest.claims.did.authentication;
    const resultAuth = this.collectAuthentication_(credReq.proof,authentications);
    if(this.trace1) {
      console.log('EdAuth::verifyCredReq::resultAuth=<',resultAuth,'>');
    }
    results.proofList = resultAuth;
    return results;
  }

  verifyVerifiableCredential(verifyCred) {
    if(this.trace1) {
      console.log('EdAuth::verifyVerifiableCredential::verifyCred=<',verifyCred,'>');
    }
    if(!verifyCred) {
      return false;
    }
    if(!verifyCred.credentialSubject) {
      return false;
    }
    if(!verifyCred.credentialSubject.did) {
      return false;
    }
    const goodDid = this.verifyDid(verifyCred.credentialSubject.did);
    if(this.trace1) {
      console.log('EdAuth::verifyVerifiableCredential::goodDid=<',goodDid,'>');
    }
    const verifyCredCalc = JSON.parse(JSON.stringify(verifyCred));
    delete verifyCredCalc.proof;
    const verifyCredCalcStr = JSON.stringify(verifyCredCalc);
    const hashCalcledB64 = this.util_.calcMessage(verifyCredCalcStr);
    if(this.trace1) {
      console.log('EdAuth::verifyVerifiableCredential::hashCalcledB64=<',hashCalcledB64,'>');
    }
    const results = {
      hashCalcledB64:hashCalcledB64
    }
    const verificationMethods = verifyCred.credentialSubject.did.verificationMethod;
    if(this.trace1) {
      console.log('EdAuth::verifyVerifiableCredential::verificationMethods=<',verificationMethods,'>');
    }
    for(const proof of verifyCred.proof) {
      if(this.trace1) {
        console.log('EdAuth::verifyVerifiableCredential::proof=<',proof,'>');
      }
      const verifyResult = this.verificationProof_(proof,verificationMethods);
      if(!verifyResult) {
        console.log('EdAuth::verifyVerifiableCredential::proof=<',proof,'>');
        console.log('EdAuth::verifyVerifiableCredential::verifyResult=<',verifyResult,'>');
        return false;
      }
      if(this.trace1) {
        console.log('EdAuth::verifyVerifiableCredential::hashCalcledB64=<',hashCalcledB64,'>');
        console.log('EdAuth::verifyVerifiableCredential::verifyResult=<',verifyResult,'>');
      }
      if(hashCalcledB64 !== verifyResult.signedHashB64) {
        console.log('EdAuth::verifyVerifiableCredential::hashCalcledB64=<',hashCalcledB64,'>');
        console.log('EdAuth::verifyVerifiableCredential::verifyResult=<',verifyResult,'>');
        return false;        
      }
    }
    const authentications = verifyCred.credentialSubject.did.authentication;
    const resultAuth = this.collectAuthentication_(verifyCred.proof,authentications);
    if(this.trace1) {
      console.log('EdAuth::verifyVerifiableCredential::resultAuth=<',resultAuth,'>');
    }
    results.proofList = resultAuth;
    return results;
  }
  /**
   * Generates a random address.
   * 
   * This function creates a random hexadecimal value using the NaCl library's
   * randomBytes method with a size of 1024 bytes. If tracing is enabled, it logs
   * the generated random hexadecimal value. Finally, it calculates and returns
   * the address using the utility's calcAddress method.
   * 
   * @returns {string} The calculated address based on the random hexadecimal value.
   */
  randomAddress() {
    const randomHex = this.nacl.randomBytes(1024);
    if(this.trace) {
      console.log('EdAuth::randomAddress:randomHex=<',randomHex,'>');
    }
    return this.util_.calcAddress(randomHex);
  }
  /**
   * Generates a random password.
   * 
   * This function generates a random password by creating a random hex value
   * using the `nacl.randomBytes` method with a length of 1024 bytes. It then
   * calculates an address from this random hex value using the `calcAddress`
   * method of the `util_` object. The resulting address is sliced to the first
   * 6 characters and returned as the password.
   * 
   * @returns {string} A random password consisting of the first 6 characters of the calculated address.
   */
  randomPassword() {
    const randomHex = this.nacl.randomBytes(1024);
    if(this.trace) {
      console.log('EdAuth::randomAddress:randomHex=<',randomHex,'>');
    }
    const address = this.util_.calcAddress(randomHex);
    return address.slice(0,6);
  }
  /**
   * Generates a Key ID (KID) from a PEM encoded string.
   * 
   * This function takes a PEM encoded string, trims any whitespace, 
   * and generates a Key ID (KID) by first hashing the PEM string 
   * using SHA-512 and then hashing the result using RIPEMD-160.
   * 
   * @param {string} pem - The PEM encoded string.
   * @returns {string} The generated Key ID (KID) in base64 format.
   */
  cacKeyIdOfPem (pem) {
    const crypto = require('node:crypto');
    const encoder = new TextEncoder();
    const dataPem = encoder.encode(pem.trim());
    if(this.trace) {
      console.log('EdAuth::cacKeyIdOfPem::dataPem:=<',dataPem,'>');  
    }
    const hashsha512 = crypto.createHash('sha512').update(dataPem).digest('base64')
    if(this.trace) {
      console.log('EdAuth::cacKeyIdOfPem::hashsha512:=<',hashsha512,'>');
    }
    const kid = crypto.createHash('rmd160').update(hashsha512).digest('base64');
    if(this.trace) {
      console.log('EdAuth::cacKeyIdOfPem::kid:=<',kid,'>');
    }
    return kid;
  }
  /**
   * Verifies the given verification method against the provided document ID and controller.
   *
   * @param {Object} verificationMethod - The verification method object containing the public key and ID.
   * @param {string} docId - The document ID to be used for verification.
   * @param {Array<string>} controller - An array of controller IDs.
   * @returns {boolean} - Returns true if the verification method is valid, otherwise false.
   */
  verificationMethod_(verificationMethod,docId,controller) {
    if(this.trace2) {
      console.log('EdAuth::verificationMethod_::verificationMethod=<',verificationMethod,'>');
      console.log('EdAuth::verificationMethod_::docId=<',docId,'>');
      console.log('EdAuth::verificationMethod_::controller=<',controller,'>');
    }
    const calcAddress = this.util_.calcAddress(verificationMethod.publicKeyMultibase);
    if(this.trace2) {
      console.log('EdAuth::verificationMethod_::calcAddress=<',calcAddress,'>');
    }
    if(!calcAddress.startsWith(strConstAddressPrefix)) {
      console.log('EdAuth::verificationMethod_::calcAddress=<',calcAddress,'>');
      return false;
    }
    const selfFullId = `${docId}#${calcAddress}`;
    if(this.trace2) {
      console.log('EdAuth::verificationMethod_::selfFullId=<',selfFullId,'>');
    }
    if(verificationMethod.id !== selfFullId) {
      console.log('EdAuth::verificationMethod_::verificationMethod.id=<',verificationMethod.id,'>');
      console.log('EdAuth::verificationMethod_::calcAddress=<',calcAddress,'>');
      let isController = false;
      for(const ctrlId of controller) {
        console.log('EdAuth::verificationMethod_::ctrlId=<',ctrlId,'>');
        const ctrlFullId = `${ctrlId}#${calcAddress}`;
        console.log('EdAuth::verificationMethod_::ctrlFullId=<',ctrlFullId,'>');
        if(verificationMethod.id === ctrlFullId) {
          isController = true;
          break;
        }
      }
      console.log('EdAuth::verificationMethod_::isController=<',isController,'>');
      if(!isController) {
        return false;
      }
    }
    return true;
  }
  /**
   * Verifies the given proof using the provided verification methods.
   *
   * @param {Object} proof - The proof object containing the signature to verify.
   * @param {Array<Object>} verificationMethods - An array of verification methods to use for verification.
   * @param {string} verificationMethods[].id - The ID of the verification method.
   * @param {string} verificationMethods[].publicKeyMultibase - The public key in multibase format.
   * @returns {Object|boolean} - Returns an object containing the signed hash in base64 format and a flag indicating if it is a seed proof, or false if verification fails.
   */
  verificationProof_(proof,verificationMethods) {
    if(this.trace) {
      console.log('EdAuth::verificationProof_::proof=<',proof,'>');
      console.log('EdAuth::verificationProof_::verificationMethods=<',verificationMethods,'>');
    }
    let verificationMethod = false;
    for(const method of verificationMethods) {
      if(method.id === proof.creator) {
        verificationMethod = method;
      }
    }
    if(this.trace) {
      console.log('EdAuth::verificationProof_::verificationMethod=<',verificationMethod,'>');
    }
    if(verificationMethod === false) {
      console.log('EdAuth::verificationProof_:: dismatch proof=<',proof,'>');
      console.log('EdAuth::verificationProof_:: dismatch verificationMethods=<',verificationMethods,'>');
      return false;
    }
    const publicKey = this.util_.decodeBase64(verificationMethod.publicKeyMultibase);
    const signMsg = this.util_.decodeBase64(proof.signatureValue);
    if(this.trace) {
      console.log('EdAuth::verificationProof_::publicKey=<',publicKey,'>');
      console.log('EdAuth::verificationProof_::signMsg=<',signMsg,'>');
    }
    const signedHash = this.nacl.sign.open(signMsg,publicKey);
    if(!signedHash) {
      console.log('EdAuth::verificationProof_::signedHash=<',signedHash,'>');
      return false;
    }
    const signedHashB64 = this.util_.encodeBase64(signedHash);
    if(this.trace) {
      console.log('EdAuth::verificationProof_::signedHashB64=<',signedHashB64,'>');
    }
    const idParts = verificationMethod.id.split('#');
    if(this.trace) {
      console.log('EdAuth::verificationProof_::idParts=<',idParts,'>');
    }
    const results = {
      signedHashB64:signedHashB64
    };
    if(idParts.length > 1) {
      if(idParts[0].endsWith(idParts[1])) {
        results.isSeedProof = true;
      }
    }
    return results;
  }
  /**
   * Collects and combines authentication and capability invocation members from a DID document.
   *
   * @param {Object} didDoc - The DID document containing proof, authentication, and capability invocation information.
   * @param {Object} didDoc.proof - The proof object within the DID document.
   * @param {Array} didDoc.authentication - The authentication array within the DID document.
   * @param {Array} didDoc.capabilityInvocation - The capability invocation array within the DID document.
   * @returns {Object} An object containing combined authentication and capability invocation members.
   * @private
   */
  collectVerificationMember_(didDoc) {
    if(this.trace) {
      console.log('EdAuth::collectVerificationMember_::didDoc=<',didDoc,'>');
    }
    const resultAuth = this.collectAuthentication_(didDoc.proof,didDoc.authentication);
    const resultCapability = this.collectCapability_(didDoc.proof,didDoc.capabilityInvocation);
    return Object.assign(resultAuth, resultCapability);
  }

  /**
   * @function collectAuthentication_
   * @description collects the proofs that is in authentication members.
   * @param {Array} proofs - array of proofs
   * @param {Array} authentication - array of member identifiers in authentication
   * @returns {Object} result - an object with property authProof which is an array of member identifiers that are in authentication
   */
  collectAuthentication_(proofs,authentication) {
    if(this.trace) {
      console.log('EdAuth::collectAuthentication_::proofs=<',proofs,'>');
      console.log('EdAuth::collectAuthentication_::authentication=<',authentication,'>');
    }
    const result = {
      authProof:[],
    };
    if(!authentication) {
      return result;
    }
    for(const proof of proofs) {
      if(this.trace) {
        console.log('EdAuth::collectAuthentication_::proof=<',proof,'>');
      }
      if(!authentication.includes(proof.creator)){
        continue;
      }
      const creatorParts = proof.creator.replace('did:otmc:','').split('#');
      if(this.trace) {
        console.log('EdAuth::collectAuthentication_::creatorParts=<',creatorParts,'>');
      }
      const proofCreator = {};
      if(creatorParts.length > 1) {
        proofCreator.team = creatorParts[0];
        proofCreator.member = creatorParts[1];
      }
      result.authProof.push(proofCreator.member);
    }
    return result;
  }
  /**
   * Collects capability proofs from the provided proofs array based on the given capability.
   *
   * @param {Array} proofs - An array of proof objects, each containing a `creator` property.
   * @param {Array} capability - An array of strings representing the allowed creators.
   * @returns {Object} An object containing an array of `capabilityProof` with the member parts of the creators.
   */
  collectCapability_(proofs,capability) {
    if(this.trace) {
      console.log('EdAuth::collectCapability_::proofs=<',proofs,'>');
      console.log('EdAuth::collectCapability_::capability=<',capability,'>');
    }
    const result = {
      capabilityProof:[],
    };
    if(!capability) {
      return result;
    }
    for(const proof of proofs) {
      if(this.trace) {
        console.log('EdAuth::collectAuthentication_::proof=<',proof,'>');
      }
      if(!capability.includes(proof.creator)) {
        continue;
      }
      const creatorParts = proof.creator.replace('did:otmc:','').split('#');
      if(this.trace) {
        console.log('EdAuth::collectAuthentication_::creatorParts=<',creatorParts,'>');
      }
      const proofCreator = {};
      if(creatorParts.length > 1) {
        proofCreator.team = creatorParts[0];
        proofCreator.member = creatorParts[1];
      }
      result.capabilityProof.push(proofCreator.member);
    }
    return result;
  }
}

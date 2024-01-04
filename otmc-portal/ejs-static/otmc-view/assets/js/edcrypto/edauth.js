import { default as nacl } from 'nacl';
const strConstAddressPrefix = 'otm';
export class EdAuth {
  constructor(edKey,util) {
    this.trace = false;
    this.debug = true;
    this.edKey_ = edKey;
    this.util_ = util;
  }
  
  
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
  
  
  sign(msgOrig,edKey) {
    msgOrig.ts = new Date().toISOString();
    return this.signWithoutTS(msgOrig,edKey);
  }
  signWithoutTS(msgOrig,edKey) {
    if(this.trace) {
      console.log('EdAuth::signWithoutTS::msgOrig=<',msgOrig,'>');
      console.log('EdAuth::signWithoutTS::edKey=<',edKey,'>');
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
    const signed = nacl.sign(hashMsgBin,secretKeyBin);
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
    const signedHash = nacl.sign.open(signMsg,publicKey);
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
  verifyDid(didDoc) {
    if(this.trace) {
      console.log('EdAuth::verifyDid::didDoc=<',didDoc,'>');
    }
    for(const method of didDoc.verificationMethod) {
      const goodMethod = this.verificationMethod_(method,didDoc.id);
      if(this.trace) {
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
    if(this.trace) {
      console.log('EdAuth::verifyDid::hashCalcledB64=<',hashCalcledB64,'>');
    }
    const results = {
      hashCalcledB64:hashCalcledB64
    }
    for(const proof of didDoc.proof) {
      if(this.trace) {
        console.log('EdAuth::verifyDid::proof=<',proof,'>');
      }
      const verifyResult = this.verificationProof_(proof,didDoc.verificationMethod);
      if(!verifyResult) {
        console.log('EdAuth::verifyDid::proof=<',proof,'>');
        console.log('EdAuth::verifyDid::verifyResult=<',verifyResult,'>');
        return false;
      }
      if(this.trace) {
        console.log('EdAuth::verifyDid::hashCalcledB64=<',hashCalcledB64,'>');
        console.log('EdAuth::verifyDid::verifyResult=<',verifyResult,'>');
      }
      if(hashCalcledB64 !== verifyResult.signedHashB64) {
        console.log('EdAuth::verifyDid::hashCalcledB64=<',hashCalcledB64,'>');
        console.log('EdAuth::verifyDid::verifyResult=<',verifyResult,'>');
        return false;        
      }
    }
    results.proofList = this.collectVerificationMember_(didDoc);
    return results;
  }
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
    const publicKey = nacl.util.decodeBase64(msg.auth.pub);
    const signMsg = nacl.util.decodeBase64(msg.auth.sign);
    if(this.trace) {
      console.log('EdAuth::verifyWeak::publicKey=<',publicKey,'>');
      console.log('EdAuth::verifyWeak::signMsg=<',signMsg,'>');
    }
    const signedHash = nacl.sign.open(signMsg,publicKey);
    if(!signedHash) {
      console.log('EdAuth::verifyWeak::signedHash=<',signedHash,'>');
      return false;
    }
    const signedHashB64 = nacl.util.encodeBase64(signedHash);
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
  
  randomAddress() {
    const randomHex = nacl.randomBytes(1024);
    if(this.trace) {
      console.log('EdAuth::randomAddress:randomHex=<',randomHex,'>');
    }
    return this.util_.calcAddress(randomHex);
  }
  randomPassword() {
    const randomHex = nacl.randomBytes(1024);
    if(this.trace) {
      console.log('EdAuth::randomAddress:randomHex=<',randomHex,'>');
    }
    const address = this.util_.calcAddress(randomHex);
    return address.slice(0,6);
  }
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



  verificationMethod_(verificationMethod,docId) {
    if(this.trace) {
      console.log('EdAuth::verificationMethod_::verificationMethod=<',verificationMethod,'>');
    }
    const calcAddress = this.util_.calcAddress(verificationMethod.publicKeyMultibase);
    if(this.trace) {
      console.log('EdAuth::verificationMethod_::calcAddress=<',calcAddress,'>');
    }
    if(!calcAddress.startsWith(strConstAddressPrefix)) {
      console.log('EdAuth::verificationMethod_::calcAddress=<',calcAddress,'>');
      return false;
    }
    const fullId = `${docId}#${calcAddress}`;
    if(this.trace) {
      console.log('EdAuth::verificationMethod_::fullId=<',fullId,'>');
    }
    if(verificationMethod.id !== fullId) {
      console.log('EdAuth::verificationMethod_::verificationMethod.id=<',verificationMethod.id,'>');
      console.log('EdAuth::verificationMethod_::calcAddress=<',calcAddress,'>');
      return false;
    }
    return true;
  }
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
    const signedHash = nacl.sign.open(signMsg,publicKey);
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
  
  
  collectVerificationMember_(didDoc) {
    if(this.trace) {
      console.log('EdAuth::collectVerificationMember_::didDoc=<',didDoc,'>');
    }
    const resultAuth = this.collectAuthentication_(didDoc.proof,didDoc.authentication);
    const resultCapability = this.collectCapability_(didDoc.proof,didDoc.capabilityInvocation);
    return Object.assign(resultAuth, resultCapability);
  }

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

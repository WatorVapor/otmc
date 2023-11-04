const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');
const base32  = require('base32.js');
const EdUtils = require('./edutils.js');


class EdAuth {
  constructor(edKey) {
    this.trace = true;
    this.debug = true;
    this.edKey_ = edKey;
    this.util_ = new EdUtils();
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
    const hashMsgBin = nacl.util.decodeBase64(hashMsgB64);;
    if(this.trace) {
      console.log('EdAuth::signWithoutTS::hashMsgBin=<',hashMsgBin,'>');
    }    const secretKeyBin = nacl.util.decodeBase64(signkey.secretKey);;
    if(this.trace) {
      console.log('EdAuth::signWithoutTS::secretKeyBin=<',secretKeyBin,'>');
    }
    const signed = nacl.sign(hashMsgBin,secretKeyBin);
    if(this.trace) {
      console.log('EdAuth::signWithoutTS::signed=<',signed,'>');
    }
    const signedB64 = nacl.util.encodeBase64(signed);
    const signMsgObj = JSON.parse(msgOrigStr);
    signMsgObj.auth = {};
    signMsgObj.auth.pub = signkey.publicKey;
    signMsgObj.auth.sign = signedB64;
    return signMsgObj;
  }


  verify(msg) {
    console.log('EdAuth::verify::msg=<',msg,'>');
    const created_at = new Date(msg.ts);
    const now = new Date();
    const escape_ms = now - created_at;
    //console.log('EdAuth::verify::escape_ms=<',escape_ms,'>');
    if(escape_ms > 1000*5) {
      console.log('EdAuth::verify::escape_ms=<',escape_ms,'>');
      return false;
    } 
    const calcAddress = this.util_.calcAddress(msg.auth.pub);
    //console.log('EdAuth::verify::calcAddress=<',calcAddress,'>');
    if(!calcAddress.startsWith('mp')) {
      console.log('EdAuth::verify::calcAddress=<',calcAddress,'>');
      return false;
    }
    const publicKey = nacl.util.decodeBase64(msg.auth.pub);
    const signMsg = nacl.util.decodeBase64(msg.auth.sign);
    //console.log('EdAuth::verify::publicKey=<',publicKey,'>');
    //console.log('EdAuth::verify::signMsg=<',signMsg,'>');
    const signedHash = nacl.sign.open(signMsg,publicKey);
    if(!signedHash) {
      console.log('EdAuth::verify::signedHash=<',signedHash,'>');
      return false;
    }
    const signedHashB64 = nacl.util.encodeBase64(signedHash);
    //console.log('EdAuth::verify::signedHashB64=<',signedHashB64,'>');
    
    const msgCal = JSON.parse(JSON.stringifymsg());
    delete msgCal.auth;
    const msgCalcStr = JSON.stringify(msgCal);
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
  randomAddress() {
    const randomHex = nacl.randomBytes(1024);
    if(this.trace) {
      console.log('EdAuth::randomAddress:randomHex=<',randomHex,'>');
    }
    return this.calcAddressBin_(randomHex);
  }
  randomPassword() {
    const randomHex = nacl.randomBytes(1024);
    if(this.trace) {
      console.log('EdAuth::randomAddress:randomHex=<',randomHex,'>');
    }
    const address = this.calcAddressBin_(randomHex);
    return address.slice(0,6);
  }
}

module.exports = EdAuth;

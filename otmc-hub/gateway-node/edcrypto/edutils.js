const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');
const base32  = require('base32.js');
const iConstLengAddress = 32;
const iConstLengMessage = 32;

class EdUtil {
  constructor() {
    this.trace = false;
    this.debug = true;
  } 
  calcAddress(textMsg) {
    const shaS1 = this.sha2b32_(textMsg);
    const shaS2 = this.sha2b32_(shaS1);
    if(this.trace) {
      console.log('EdUtil::calcAddress:shaS2=<',shaS2,'>');
    }
    const address = shaS2.slice(0,iConstLengAddress);
    if(this.trace) {
      console.log('EdUtil::calcAddress:address=<',address,'>');
    }
    return address;
  }
  sha2b32_(textMsg,typeFn) {
    const encoder = new TextEncoder();
    const data = encoder.encode(textMsg);
    const hash = nacl.hash(data);
    const hashArray = Array.from(new Uint8Array(hash)); 
    const b32Hash = base32.encode(hashArray);
    if(this.trace) {
      console.log('EdUtil::sha2b32_:b32Hash=<',b32Hash,'>');
    }
    return b32Hash.toLowerCase();
  }

  calcMessage(textMsg) {
    const shaS1 = this.sha2b64_(textMsg);
    const shaS2 = this.sha2b64_(shaS1);
    if(this.trace) {
      console.log('EdUtil::calcMessage:shaS2=<',shaS2,'>');
    }
    const address = shaS2.slice(0,iConstLengMessage);
    if(this.trace) {
      console.log('EdUtil::calcMessage:address=<',address,'>');
    }
    return address;
  }
  sha2b64_(textMsg,typeFn) {
    const encoder = new TextEncoder();
    const data = encoder.encode(textMsg);
    const hash = nacl.hash(data);
    const hashArray = Array.from(new Uint8Array(hash)); 
    const b64Hash = nacl.util.encodeBase64(hashArray);
    if(this.trace) {
      console.log('EdUtil::sha2b64_:b64Hash=<',b64Hash,'>');
    }
    return b64Hash;
  }
  

}
module.exports = EdUtil;

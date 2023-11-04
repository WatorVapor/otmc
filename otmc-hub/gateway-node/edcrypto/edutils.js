const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');
const base32  = require('base32.js');
const iConstLengAddress = 32;
class EdUtil {
  constructor() {
    this.trace = false;
    this.debug = true;
  } 
  calcAddress(textMsg) {
    const shaS1 = this.sha2b64(textMsg);
    const shaS2 = this.sha2b64(shaS1);
    if(this.trace) {
      console.log('EdUtil::calcAddress:shaS2=<',shaS2,'>');
    }
    const address = shaS2.substring(0,iConstLengAddress);
    if(this.trace) {
      console.log('EdUtil::calcAddress:address=<',address,'>');
    }
    return address;
  }
  sha2b64(textMsg,typeFn) {
    const encoder = new TextEncoder();
    const data = encoder.encode(textMsg);
    const hash = nacl.hash(data);
    const hashArray = Array.from(new Uint8Array(hash)); 
    const b32Hash = base32.encode(hashArray);
    if(this.trace) {
      console.log('EdUtil::sha2b64:b32Hash=<',b32Hash,'>');
    }
    return b32Hash.toLowerCase();
  }
}
module.exports = EdUtil;

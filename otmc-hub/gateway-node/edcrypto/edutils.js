const base32  = require('base32.js');
const { subtle } = require('crypto').webcrypto;
class EDUtil {
  constructor() {
    this.trace = false;
    this.debug = true;
  } 
  async calcKeyId(pubKeyB64) {
    const sha512B64 = await sha2B64(pubKeyB64,'SHA-512');
    const sha1b64 = await sha2B64(sha512B64,'SHA-1');
    const address = sha1b64;
    if(this.trace) {
      console.log('EDDSAKey::calcKeyId:address=<',address,'>');
    }
    return address;
  }
  async sha2B64(textMsg,type) {
    const encoder = new TextEncoder();
    const data = encoder.encode(textMsg);
    const hash = await subtle.digest(type, data);
    if(this.trace) {
      console.log('EDDSAKey::sha2B64:hash=<',hash,'>');
    }    
    const hashArray = Array.from(new Uint8Array(hash)); 
    const b32Hash = base32.encode(hashArray);
    if(this.trace) {
      console.log('EDDSAKey::sha2B64:b32Hash=<',b32Hash,'>');
    }
    return b32Hash.toLowerCase();
  }
}
module.exports = EDUtil;

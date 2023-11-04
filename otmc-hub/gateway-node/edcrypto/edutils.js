/*
const base32  = require('base32.js');
const { subtle } = require('crypto').webcrypto;
class EDUtil {
  constructor() {
    this.trace = false;
    this.debug = true;
  } 
  async calcKeyId(pubKeyB64) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pubKeyB64);
    const hash512 = await subtle.digest('SHA-512', data);
    if(this.trace) {
      console.log('EDDSAKey::calcKeyId:hash512=<',hash512,'>');
    }
    const hashArray512 = Array.from(new Uint8Array(hash512)); 
    const b32Hash512 = base32.encode(hashArray512);
    if(this.trace) {
      console.log('EDDSAKey::calcKeyId:b32Hash512=<',b32Hash512,'>');
    }
    const dataSha1 = encoder.encode(b32Hash512);
    const hashsha1 = await subtle.digest('SHA-1', dataSha1);
    if(this.trace) {
      console.log('EDDSAKey::calcKeyId:hashsha1=<',hashsha1,'>');
    }
    const hashArraysha1 = Array.from(new Uint8Array(hashsha1)); 
    const address = base32.encode(hashArraysha1).toLowerCase();
    if(this.trace) {
      console.log('EDDSAKey::calcKeyId:address=<',address,'>');
    }
    return address;
  }
}
module.exports = EDUtil;
*/


const { subtle } = require('crypto').webcrypto;
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');
const base32  = require('base32.js');

class EDUtil {
  constructor() {
    this.trace = false;
    this.debug = true;
  }
  async calcKeyId(pubKeyB64) {
    const binPub = nacl.util.decodeBase64(pubKeyB64);
    const hash512 = nacl.hash(binPub);
    if(this.trace) {
      console.log('EDDSAKey::calcKeyId:hash512=<',Buffer.from(hash512).toString('hex'),'>');
    }
    const hash512B64 = Buffer.from(hash512).toString('base64');
    if(this.trace) {
      console.log('EDDSAKey::calcKeyId:hash512B64=<',hash512B64,'>');
    }
    const encoder = new TextEncoder();
    const dataSha1 = encoder.encode(hash512B64);
    const hashsha1 = await subtle.digest('SHA-1', dataSha1);
    if(this.trace) {
      console.log('EDDSAKey::calcKeyId:hashsha1=<',hashsha1,'>');
    }
    const hash1pubBuffer = Array.from(new Uint8Array(hashsha1)); 
    if(this.trace) {
      console.log('EDDSAKey::calcKeyId:hash1pubBuffer=<',hash1pubBuffer,'>');
    }
    const sha1Buffer = Buffer.from(hash1pubBuffer);
    if(this.trace) {
      console.log('EDDSAKey::calcKeyId:sha1Buffer=<',sha1Buffer.toString('hex'),'>');
    }
    const address = base32.encode(sha1Buffer);
    if(this.trace) {
      console.log('EDDSAKey::calcKeyId:address=<',address,'>');
    }
    return address.toLowerCase();
  }
}
module.exports = EDUtil;


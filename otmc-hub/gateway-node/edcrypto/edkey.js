const base32  = require('base32.js');
const { subtle } = require('crypto').webcrypto;
class EDDSAKey {
  constructor() {
    this.trace = false;
    this.debug = true;
  }
  id() {
    return this.keyJson.idOfKey;
  }
  async createKey() {
    const {
      publicKey,
      privateKey,
    } = await subtle.generateKey({
      name: 'Ed25519',
    }, true, ['sign', 'verify']);
    if(this.trace) {
      console.log('EDDSAKey::createKeys:publicKey=<',publicKey,'>');
      console.log('EDDSAKey::createKeys:privateKey=<',privateKey,'>');
    }
    const publicJwk = await subtle.exportKey('jwk', publicKey);
    if(this.trace) {
      console.log('EDDSAKey::createKeys:publicJwk=<',publicJwk,'>');
    }
    const privateJwk = await subtle.exportKey('jwk', privateKey);
    if(this.trace) {
      console.log('EDDSAKey::createKeys:privateJwk=<',privateJwk,'>');
    }
    const keyid = await this.calcKeyId(publicJwk.x);
    const keyObject = {
      idOfKey:keyid,
      publicKey:publicJwk,
      secretKey:privateJwk,
      created:(new Date()).toISOString(),
    };
    this.keyJson = keyObject;
    if(this.trace) {
      console.log('EDDSAKey::createKeys:keyObject=<',keyObject,'>');
    }
    return keyObject;
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
module.exports = EDDSAKey;

/*
const { subtle } = require('crypto').webcrypto;
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');
const base32  = require('base32.js');

class EDDSAKey {
  constructor() {
  }
  id() {
    return this.keyJson.idOfKey;
  }
  async createKey() {
    const keyPair = nacl.sign.keyPair();
    //console.log('EDDSAKey::createKeys:keyPair=<',keyPair,'>');
    const pubKeyB64 = nacl.util.encodeBase64(keyPair.publicKey);
    //console.log('EDDSAKey::createKeys:pubKeyB64=<',pubKeyB64,'>');
    const scrKeyB64 = nacl.util.encodeBase64(keyPair.secretKey);
    //console.log('EDDSAKey::createKeys:scrKeyB64=<',scrKeyB64,'>');
    const keyid = await this.calcKeyId(pubKeyB64);
    const keyObject = {
      idOfKey:keyid,
      publicKey:pubKeyB64,
      secretKey:scrKeyB64,
      created:(new Date()).toISOString(),
    };
    this.keyJson = keyObject;
    return keyObject;
  }
  
  async calcKeyId(pubKeyB64) {
    const binPub = nacl.util.decodeBase64(pubKeyB64);
    const hash512 = nacl.hash(binPub);
    //console.log('EDDSAKey::calcAddressBin_:hash512=<',Buffer.from(hash512).toString('hex'),'>');
    const hash512B64 = Buffer.from(hash512).toString('base64');
    //console.log('EDDSAKey::calcAddressBin_:hash512B64=<',hash512B64,'>');
    const encoder = new TextEncoder();
    const dataSha1 = encoder.encode(hash512B64);
    const hashsha1 = await subtle.digest('SHA-1', dataSha1);
    if(this.trace) {
      console.log('EDDSAKey::calcKeyId:hashsha1=<',hashsha1,'>');
    }
    const hash1Pub = Array.from(new Uint8Array(hashsha1)); 
    //console.log('EDDSAKey::calcAddressBin_:hash1Pub=<',hash1Pub,'>');
    const hash1pubBuffer = nacl.util.decodeBase64(hash1Pub);
    //console.log('EDDSAKey::calcAddressBin_:hash1pubBuffer=<',hash1pubBuffer,'>');
    const sha1Buffer = Buffer.from(hash1pubBuffer);
    //console.log('EDDSAKey::calcAddressBin_:sha1Buffer=<',sha1Buffer.toString('hex'),'>');
    const address = base32.encode(sha1Buffer);
    console.log('EDDSAKey::calcAddressBin_:address=<',address,'>');
    return address.toLowerCase();
  }
}
module.exports = EDDSAKey;
*/

/*
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
    const util = new EdUtils();
    const keyid = await util.calcKeyId(publicJwk.x);
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
}
module.exports = EDDSAKey;
*/


const { subtle } = require('crypto').webcrypto;
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');
const base32  = require('base32.js');

const EdUtils = require('./edutils.js');

class EDDSAKey {
  constructor() {
    this.trace = false;
    this.debug = true;
  }
  id() {
    return this.keyJson.idOfKey;
  }
  async createKey() {
    const keyPair = nacl.sign.keyPair();
    if(this.trace) {
      console.log('EDDSAKey::createKeys:keyPair=<',keyPair,'>');
    }
    const pubKeyB64 = nacl.util.encodeBase64(keyPair.publicKey);
    if(this.trace) {
      console.log('EDDSAKey::createKeys:pubKeyB64=<',pubKeyB64,'>');
    }
    const scrKeyB64 = nacl.util.encodeBase64(keyPair.secretKey);
    if(this.trace) {
      console.log('EDDSAKey::createKeys:scrKeyB64=<',scrKeyB64,'>');
    }
    const util = new EdUtils();
    const keyid = await util.calcKeyId(pubKeyB64);
    const keyObject = {
      idOfKey:keyid,
      publicKey:pubKeyB64,
      secretKey:scrKeyB64,
      created:(new Date()).toISOString(),
    };
    this.keyJson = keyObject;
    return keyObject;
  }
}
module.exports = EDDSAKey;


import nacl from 'https://cdn.jsdelivr.net/npm/tweetnacl-es6@1.0.3/nacl-fast-es.min.js';
export class EdDsaKey {
  constructor(util) {
    this.trace = false;
    this.debug = true;
    this.util = util;
  }
  id() {
    return this.keyJson.idOfKey;
  }
  createKey() {
    if(this.trace) {
      console.log('EdDsaKey::createKeys:nacl=<',nacl,'>');
    }
    const keyPair = nacl.sign.keyPair();
    if(this.trace) {
      console.log('EdDsaKey::createKeys:keyPair=<',keyPair,'>');
    }
    const pubKeyB64 = this.util.encodeBase64(keyPair.publicKey);
    if(this.trace) {
      console.log('EdDsaKey::createKeys:pubKeyB64=<',pubKeyB64,'>');
    }
    const scrKeyB64 = this.util.encodeBase64(keyPair.secretKey);
    if(this.trace) {
      console.log('EdDsaKey::createKeys:scrKeyB64=<',scrKeyB64,'>');
    }
    const keyid = this.util.calcAddress(pubKeyB64);
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


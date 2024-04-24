export class EdDsaKey {
  constructor(util) {
    this.trace = false;
    this.debug = true;
    this.util = util;
    if(util.nacl) {
      if(util.nacl.default) {
        this.nacl = util.nacl.default;
      } else {
        this.nacl = util.nacl;
      }
    }
    if(this.trace) {
      console.log('EdDsaKey::constructor:this.nacl=<',this.nacl,'>');
    }
  }
  id() {
    return this.keyJson.idOfKey;
  }
  createKey() {
    if(this.trace) {
      console.log('EdDsaKey::createKeys:nacl=<',nacl,'>');
    }
    let keyPair = this.nacl.sign.keyPair();
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
    keyPair = null;
    return keyObject;
  }
}


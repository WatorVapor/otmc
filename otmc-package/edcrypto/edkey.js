export class EdDsaKey {
  /**
   * Constructs an instance of the EdDsaKey class.
   * 
   * @param {Object} util - Utility object containing necessary dependencies.
   * @param {Object} util.nacl - NaCl (Networking and Cryptography library) object.
   * @param {Object} [util.nacl.default] - Default export of the NaCl library, if available.
   */
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
  /**
   * Retrieves the ID of the key from the keyJson object.
   *
   * @returns {string} The ID of the key.
   */
  id() {
    return this.keyJson.idOfKey;
  }
  /**
   * Creates a new EdDSA key pair, encodes the keys in Base64, and calculates the key ID.
   * The generated key object contains the key ID, public key, secret key, and creation timestamp.
   * 
   * @returns {Object} The generated key object containing:
   * - `idOfKey` {string}: The calculated key ID.
   * - `publicKey` {string}: The Base64 encoded public key.
   * - `secretKey` {string}: The Base64 encoded secret key.
   * - `created` {string}: The ISO string representation of the creation date.
   */
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


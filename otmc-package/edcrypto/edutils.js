const iConstLengAddress = 32;
const iConstLengMessage = 32;
export class EdUtil {
  /**
   * Constructs an instance of EdUtil.
   * 
   * @constructor
   * @param {Object} base32 - The base32 encoding/decoding library.
   * @param {Object} nacl - The NaCl cryptographic library. If it has a default property, it will be used.
   */
  constructor(base32,nacl) {
    this.trace = false;
    this.debug = true;
    if(this.trace) {
      console.log('EdUtil::constructor:base32=<',base32,'>');
      console.log('EdUtil::constructor:nacl=<',nacl,'>');
    }
    this.base32 = base32;
    if(nacl) {
      if(nacl.default) {
        this.nacl = nacl.default;
      } else {
        this.nacl = nacl;
      }
    }
    if(this.trace) {
      console.log('EdUtil::constructor:this.nacl=<',this.nacl,'>');
    }
  } 
  /**
   * Calculates an address from a given text message.
   *
   * This function takes a text message, hashes it twice using the SHA-256 algorithm,
   * and then slices the resulting hash to generate an address of a specified length.
   *
   * @param {string} textMsg - The input text message to be hashed.
   * @returns {string} The calculated address.
   */
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
  /**
   * Generates a random address.
   * 
   * This function creates a random hexadecimal value using the NaCl library's
   * randomBytes method with a size of 1024 bytes. If tracing is enabled, it logs
   * the generated random hexadecimal value. Finally, it calculates and returns
   * the address based on the generated random hexadecimal value.
   * 
   * @returns {string} The calculated address based on the random hexadecimal value.
   */
  randomAddress() {
    const randomHex = this.nacl.randomBytes(1024);
    if(this.trace) {
      console.log('EdUtil::randomAddress:randomHex=<',randomHex,'>');
    }
    return this.calcAddress(randomHex);
  }
  /**
   * Calculates a message address based on the provided text message.
   * It performs a double SHA-256 hash on the input text message and returns
   * a portion of the resulting hash as the address.
   *
   * @param {string} textMsg - The input text message to be hashed.
   * @returns {string} The calculated address derived from the double-hashed message.
   */
  calcMessage(textMsg) {
    if(this.trace) {
      console.log('EdUtil::calcMessage:textMsg=<',textMsg,'>');
    }
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
  /**
   * Encodes a given string message to Base64 format.
   *
   * @param {string} strMsg - The string message to be encoded.
   * @returns {string} The Base64 encoded string.
   */
  encodeBase64Str(strMsg) {
    const encoder = new TextEncoder();
    const data = encoder.encode(strMsg);
    return this.encodeBase64(data);
  }
  /**
   * Encodes a given array of bytes into a Base64 string.
   *
   * @param {Uint8Array} arr - The array of bytes to encode.
   * @returns {string} The Base64 encoded string.
   */
  encodeBase64(arr) {
    let i, s = [], len = arr.length;
    for (i = 0; i < len; i++) s.push(String.fromCharCode(arr[i]));
    return btoa(s.join(''));    
  }
  /**
   * Decodes a Base64 encoded string into a Uint8Array.
   *
   * @param {string} s - The Base64 encoded string to decode.
   * @returns {Uint8Array} - The decoded byte array.
   * @throws {Error} - Throws an error if the input string is not valid Base64.
   */
  decodeBase64(s) {
    validateBase64(s);
    let i, d = atob(s), b = new Uint8Array(d.length);
    for (i = 0; i < d.length; i++) b[i] = d.charCodeAt(i);
    return b;    
  }

  /**
   * Decodes a Base64 encoded string into a string.
   *
   * @param {string} strMsg - The Base64 encoded string to decode.
   * @returns {Uint8Array} - The decoded byte array.
   * @throws {Error} - Throws an error if the input string is not valid Base64.
   */
  decodeBase64Str(strMsg) {
    const binB64 = this.decodeBase64(strMsg);
    return new TextDecoder('utf-8').decode(binB64);    
  }

  /**
   * Generates a base32-encoded SHA-512 hash of the given text message.
   *
   * @param {string} textMsg - The text message to be hashed.
   * @param {Function} typeFn - A function parameter (not used in the current implementation).
   * @returns {string} The base32-encoded SHA-512 hash of the input text message, in lowercase.
   */
  sha2b32_(textMsg,typeFn) {
    const encoder = new TextEncoder();
    const data = encoder.encode(textMsg);
    const hash = this.nacl.hash(data);
    const hashArray = Array.from(new Uint8Array(hash)); 
    const b32Hash = this.base32.encode(hashArray);
    if(this.trace) {
      console.log('EdUtil::sha2b32_:b32Hash=<',b32Hash,'>');
    }
    return b32Hash.toLowerCase();
  }

  /**
   * Generates a SHA-256 hash of the given text message and encodes it in Base64.
   *
   * @param {string} textMsg - The text message to hash.
   * @param {Function} typeFn - A function parameter (not used in the current implementation).
   * @returns {string} The Base64 encoded SHA-256 hash of the input text message.
   */
  sha2b64_(textMsg,typeFn) {
    const encoder = new TextEncoder();
    const data = encoder.encode(textMsg);
    const hash = this.nacl.hash(data);
    const hashArray = Array.from(new Uint8Array(hash)); 
    if(this.trace) {
      console.log('EdUtil::sha2b64_:hashArray=<',hashArray,'>');
    }
    const b64Hash = this.encodeBase64(hashArray);
    if(this.trace) {
      console.log('EdUtil::sha2b64_:b64Hash=<',b64Hash,'>');
    }
    return b64Hash;
  }
}

const validateBase64 = (s) => {
  if (!(/^(?:[A-Za-z0-9+\/]{2}[A-Za-z0-9+\/]{2})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/.test(s))) {
    throw new TypeError('invalid encoding');
  }
}



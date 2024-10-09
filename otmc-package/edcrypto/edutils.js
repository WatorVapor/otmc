const iConstLengAddress = 32;
const iConstLengMessage = 32;
export class EdUtil {
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
  randomAddress() {
    const randomHex = this.nacl.randomBytes(1024);
    if(this.trace) {
      console.log('EdUtil::randomAddress:randomHex=<',randomHex,'>');
    }
    return this.calcAddress(randomHex);
  }
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
  encodeBase64Str(strMsg) {
    const encoder = new TextEncoder();
    const data = encoder.encode(strMsg);
    return this.encodeBase64(data);
  }
  encodeBase64(arr) {
    let i, s = [], len = arr.length;
    for (i = 0; i < len; i++) s.push(String.fromCharCode(arr[i]));
    return btoa(s.join(''));    
  }
  decodeBase64(s) {
    validateBase64(s);
    let i, d = atob(s), b = new Uint8Array(d.length);
    for (i = 0; i < d.length; i++) b[i] = d.charCodeAt(i);
    return b;    
  }

  
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



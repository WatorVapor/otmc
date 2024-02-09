const iConstOneDayMs = 1000*3600*24;
export class Mass {
  static debug = false;
  constructor(storePrefix) {
    if(storePrefix) {
      this.secretKeyPath_ = `${storePrefix}/secretKey`;
      this.publicKeyPath_ = `${storePrefix}/publicKey`;
      this.addressPath_ = `${storePrefix}/address`;
      const result = this.loadMassKey_();
      if(!result) {
        this.createMassKey_();
        this.loadMassKey_();
      }
    }
  }
  sign(msgOrig) {
    msgOrig.ts = new Date().toISOString();
    const msgOrigStr = JSON.stringify(msgOrig);
    const encoder = new TextEncoder();
    const hash = nacl.hash(encoder.encode(msgOrigStr));
    if(Mass.debug) {
      console.log('Mass::sign::hash=<',hash,'>');
    }
    const hash512B64 = nacl.util.encodeBase64(hash);
    if(Mass.debug) {
      console.log('Mass::sign::hash512B64=<',hash512B64,'>');
    }
    const sha1MsgB64 = CryptoJS.SHA1(hash512B64).toString(CryptoJS.enc.Base64);
    if(Mass.debug) {
      console.log('Mass::sign::sha1MsgB64=<',sha1MsgB64,'>');
    }
    const sha1MsgBin = nacl.util.decodeBase64(sha1MsgB64);;
    const signed = nacl.sign(sha1MsgBin,this.secretKey_);
    if(Mass.debug) {
      console.log('Mass::sign::signed=<',signed,'>');
    }
    const signedB64 = nacl.util.encodeBase64(signed);
    const signMsgObj = JSON.parse(msgOrigStr);
    signMsgObj.auth = {};
    signMsgObj.auth.pub = this.publicKeyB64_;
    signMsgObj.auth.sign = signedB64;
    return signMsgObj;
  }
  signWithoutTS(msgOrig) {
    const msgOrigStr = JSON.stringify(msgOrig);
    const encoder = new TextEncoder();
    const hash = nacl.hash(encoder.encode(msgOrigStr));
    if(Mass.debug) {
      console.log('Mass::sign::hash=<',hash,'>');
    }
    const hash512B64 = nacl.util.encodeBase64(hash);
    if(Mass.debug) {
      console.log('Mass::sign::hash512B64=<',hash512B64,'>');
    }
    const sha1MsgB64 = CryptoJS.SHA1(hash512B64).toString(CryptoJS.enc.Base64);
    if(Mass.debug) {
      console.log('Mass::sign::sha1MsgB64=<',sha1MsgB64,'>');
    }
    const sha1MsgBin = nacl.util.decodeBase64(sha1MsgB64);;
    const signed = nacl.sign(sha1MsgBin,this.secretKey_);
    if(Mass.debug) {
      console.log('Mass::sign::signed=<',signed,'>');
    }
    const signedB64 = nacl.util.encodeBase64(signed);
    const signMsgObj = JSON.parse(msgOrigStr);
    signMsgObj.auth = {};
    signMsgObj.auth.pub = this.publicKeyB64_;
    signMsgObj.auth.sign = signedB64;
    return signMsgObj;
  }

  verify(msg) {
    //console.log('Mass::verify::msg=<',msg,'>');
    const created_at = new Date(msg.ts);
    const now = new Date();
    const escape_ms = now - created_at;
    //console.log('Mass::verify::escape_ms=<',escape_ms,'>');
    if(escape_ms > iConstOneDayMs) {
      console.log('Mass::verify::escape_ms=<',escape_ms,'>');
      return false;
    } 
    const calcAddress = this.calcAddress_(msg.auth.pub);
    //console.log('Mass::verify::calcAddress=<',calcAddress,'>');
    if(!calcAddress.startsWith('mp')) {
      console.log('Mass::verify::calcAddress=<',calcAddress,'>');
      return false;
    }
    const publicKey = nacl.util.decodeBase64(msg.auth.pub);
    const signMsg = nacl.util.decodeBase64(msg.auth.sign);
    //console.log('Mass::verify::publicKey=<',publicKey,'>');
    //console.log('Mass::verify::signMsg=<',signMsg,'>');
    const signedHash = nacl.sign.open(signMsg,publicKey);
    if(!signedHash) {
      console.log('Mass::verify::signedHash=<',signedHash,'>');
      return false;
    }
    const signedHashB64 = nacl.util.encodeBase64(signedHash);
    //console.log('Mass::verify::signedHashB64=<',signedHashB64,'>');
    
    const msgCal = Object.assign({},msg);
    delete msgCal.auth;
    const msgCalcStr = JSON.stringify(msgCal);
    const encoder = new TextEncoder();
    const hashCalc = nacl.hash(encoder.encode(msgCalcStr));
    //console.log('Mass::verify::hashCalc=<',hashCalc,'>');
    const hashCalc512B64 = nacl.util.encodeBase64(hashCalc);
    //console.log('Mass::verify::hashCalc512B64=<',hashCalc512B64,'>');
    const hashCalclB64 = CryptoJS.SHA1(hashCalc512B64).toString(CryptoJS.enc.Base64);   
    if(signedHashB64 === hashCalclB64) {
      msg.from = calcAddress;
      return true;
    } else {
      console.log('Mass::verify::signedHashB64=<',signedHashB64,'>');
      console.log('Mass::verify::hashCalclB64=<',hashCalclB64,'>');
    }
    return false;
  }
  load(secretKey) {
    if(Mass.debug) {
      console.log('Mass::load::secretKey=<',secretKey,'>');
    }
    const secretBin = nacl.util.decodeBase64(secretKey);
    if(Mass.debug) {
      console.log('Mass::load::secretBin=<',secretBin,'>');
    }
    const keyPair = nacl.sign.keyPair.fromSecretKey(secretBin);
    if(Mass.debug) {
      console.log('Mass::load::keyPair=<',keyPair,'>');
    }
    this.secretKey_ = keyPair.secretKey;
    this.publicKey_ = keyPair.publicKey;
    const b64Pub = nacl.util.encodeBase64(keyPair.publicKey);
    if(Mass.debug) {
      console.log('Mass::load:b64Pub=<',b64Pub,'>');
    }
    this.publicKeyB64_ = b64Pub;
    const address = this.calcAddress_(b64Pub);
    this.address_ = address;
    return address;
  }
  pub() {
    return this.pubKeyB64_;
  }
  secret() {
    return this.priKeyB64_;
  }
  address() {
    return this.address_;
  }
  destory() {
    localStorage.removeItem(this.secretKeyPath_);
    localStorage.removeItem(this.publicKeyPath_);
    localStorage.removeItem(this.addressPath_);
  }
  verifySecretKey(secretKey) {
    if(Mass.debug) {
      console.log('Mass::verifySecretKey::secretKey=<',secretKey,'>');
    }
    const secretBin = nacl.util.decodeBase64(secretKey);
    if(Mass.debug) {
      console.log('Mass::verifySecretKey::secretBin=<',secretBin,'>');
    }
    const keyPair = nacl.sign.keyPair.fromSecretKey(secretBin);
    if(Mass.debug) {
      console.log('Mass::verifySecretKey::keyPair=<',keyPair,'>');
    }
    if(keyPair) {
      return true;
    }
    return false;
  }
  importSecretKey(secretKey) {
    if(Mass.debug) {
      console.log('Mass::importSecretKey::secretKey=<',secretKey,'>');
    }
    const secretBin = nacl.util.decodeBase64(secretKey);
    if(Mass.debug) {
      console.log('Mass::importSecretKey::secretBin=<',secretBin,'>');
    }
    const keyPair = nacl.sign.keyPair.fromSecretKey(secretBin);
    if(Mass.debug) {
      console.log('Mass::importSecretKey::keyPair=<',keyPair,'>');
    }
    if(keyPair) {
      save2Storage_(keyPair);
      loadMassKey_();
      return true;
    }
    return false;
  }
  createMassKey_() {
    while(true) {
      const address = this.mineMassKey_();
      if(address.startsWith('mp')) {
        break;
      }
    }
  }
  mineMassKey_() {
    const keyPair = nacl.sign.keyPair();
    if(Mass.debug) {
      console.log('Mass::mineMassKey_:keyPair=<',keyPair,'>');
    }
    return this.save2Storage_(keyPair);
  }
  save2Storage_(keyPair){
    const b64Pri = nacl.util.encodeBase64(keyPair.secretKey);
    if(Mass.debug) {
      console.log('Mass::save2Storage_:b64Pri=<',b64Pri,'>');
    }
    localStorage.setItem(this.secretKeyPath_,b64Pri);    
    const b64Pub = nacl.util.encodeBase64(keyPair.publicKey);
    if(Mass.debug) {
      console.log('Mass::save2Storage_:b64Pub=<',b64Pub,'>');
    }
    localStorage.setItem(this.publicKeyPath_,b64Pub);
    const address = this.calcAddress_(b64Pub);
    if(Mass.debug) {
      console.log('Mass::save2Storage_:address=<',address,'>');
    }
    localStorage.setItem(this.addressPath_,address);
    return address;
  }
  loadMassKey_() {
    try {
      const address = localStorage.getItem(this.addressPath_);
      if(Mass.debug) {
        console.log('Mass::loadMassKey_:address=<',address,'>');
      }
      this.address_ = address;
      const PriKey = localStorage.getItem(this.secretKeyPath_);
      if(Mass.debug) {
        console.log('Mass::loadMassKey_:PriKey=<',PriKey,'>');
      }
      this.priKeyB64_ = PriKey;
      this.priKey_ = nacl.util.decodeBase64(PriKey);
      if(Mass.debug) {
        console.log('Mass::loadMassKey_:this.priKey_=<',this.priKey_,'>');
      }
      const keyPair = nacl.sign.keyPair.fromSecretKey(this.priKey_);
      if(Mass.debug) {
        console.log('Mass::loadMassKey_:keyPair=<',keyPair,'>');
      }    
      this.secretKey_ = keyPair.secretKey;
      this.publicKey_ = keyPair.publicKey;
      const pubKey = localStorage.getItem(this.publicKeyPath_);
      if(Mass.debug) {
        console.log('Mass::loadMassKey_:pubKey=<',pubKey,'>');
      }
      this.pubKeyB64_ = pubKey;
      this.publicKeyB64_ = pubKey;
      this.pubKey_ = nacl.util.decodeBase64(pubKey);
    } catch(err) {
      console.log('Mass::loadMassKey_:err=<',err,'>');
      return false;
    }
    return true;
  }
  calcAddress_(b64Pub) {
    const binPub = nacl.util.decodeBase64(b64Pub);
    const hash512 = nacl.hash(binPub);
    const hash512B64 = nacl.util.encodeBase64(hash512);
    const hash1Pub = CryptoJS.SHA1(hash512B64).toString(CryptoJS.enc.Base64);
    if(Mass.debug) {
      console.log('Mass::load:hash1Pub=<',hash1Pub,'>');
    }
    const hash1pubBuffer = nacl.util.decodeBase64(hash1Pub);
    if(Mass.debug) {
      console.log('Mass::load:hash1pubBuffer=<',hash1pubBuffer,'>');
    }
    const encoder = new base32.Encoder({ type: "rfc4648", lc: true });
    const address = encoder.write(hash1pubBuffer).finalize();
    if(Mass.debug) {
      console.log('Mass::load:address=<',address,'>');
    }
    return address;
  }
}









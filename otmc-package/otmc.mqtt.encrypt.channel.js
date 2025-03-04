import Dexie from 'dexie';
import { StoreKey } from './otmc.const.js';
import { base64 } from '@scure/base';

/**
*
*/
export class MqttEncryptChannel {
  constructor(eeInternal) {
    this.version = '1.0';
    this.ee = eeInternal;
    this.trace0 = true;
    this.trace = true;
    this.debug = true;
    this.db = new Dexie(StoreKey.secret.mqtt.encrypt.channel.dbName);
    this.db.version(this.version).stores({
      ecdh: '++autoId,did,nodeId,createdDate,key.pubBase64,key.privBase64',
    });
    this.db.version(this.version).stores({
      secret: '++autoId,did,myNodeId,remoteNodeId,secretBase64,issuedDate,expireDate',
    });
    this.ListenEventEmitter_();
  }
  ListenEventEmitter_() {
    if(this.trace0) {
      console.log('MqttEncryptChannel::ListenEventEmitter_::this.ee=:<',this.ee,'>');
    }
    const self = this;
    this.ee.on('sys.authKey.ready',(evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.otmc = evt.otmc;
      self.auth = evt.auth;
      self.base32 = evt.base32;
      self.util = evt.util;
    });
    this.ee.on('did:document',(evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.loadMyECKey_();
    });
  }
  async loadMyECKey_() {
    if(this.trace0) {
      console.log('MqttEncryptChannel::loadMyECKey_::this.otmc=:<',this.otmc,'>');
      console.log('MqttEncryptChannel::loadMyECKey_::this.otmc.did=:<',this.otmc.did,'>');
      console.log('MqttEncryptChannel::loadMyECKey_::this.otmc.did.didDoc_=:<',this.otmc.did.didDoc_,'>');
    }
    const did = this.otmc.did.didDoc_.id;
    if(this.trace0) {
      console.log('MqttEncryptChannel::loadMyECKey_::did=:<',did,'>');
    }
    const nodeId = this.auth.address();
    if(this.trace0) {
      console.log('MqttEncryptChannel::loadMyECKey_::nodeId=:<',nodeId,'>');
    }
    let myECDH = await this.db.ecdh.where({did:did,nodeId:nodeId}).first();
    if(this.trace0) {
      console.log('MqttEncryptChannel::loadMyECKey_::myECDH:<',myECDH,'>'); 
    }
    if(!myECDH) {
      await this.tryCreateMyECKey_(did,nodeId);
      myECDH = await this.db.ecdh.where({did:did,nodeId:nodeId}).first();
      if(this.trace0) {
        console.log('MqttEncryptChannel::loadMyECKey_::myECDH:<',myECDH,'>'); 
      }
    }
    this.myECDH = myECDH;
    const myPublicKey = JSON.parse(base64Decode(myECDH.key.pubBase64));
    if(this.trace0) {
      console.log('MqttEncryptChannel::loadMyECKey_::myPublicKey=<',myPublicKey,'>');
    }
    const myPrivateKey = JSON.parse(base64Decode(myECDH.key.privBase64));
    if(this.trace0) {
      console.log('MqttEncryptChannel::loadMyECKey_::myPrivateKey=<',myPrivateKey,'>');
    }
    this.myPublicKeyJwk = myPublicKey;
    this.myPrivateKeyJwk = myPrivateKey;
    this.myPublicKey = await crypto.subtle.importKey("jwk", this.myPublicKeyJwk, {
      name: "ECDH",
      namedCurve: "P-256"
    }, true, []);
    this.myPrivateKey = await crypto.subtle.importKey("jwk", this.myPrivateKeyJwk, {
      name: "ECDH",
      namedCurve: "P-256"
    }, true, ["deriveBits"]);
    if(this.trace0) {
      console.log('MqttEncryptChannel::loadMyECKey_::this.myPublicKey=<',this.myPublicKey,'>');
    }
    if(this.trace0) {
      console.log('MqttEncryptChannel::loadMyECKey_::this.myPrivateKey=<',this.myPrivateKey,'>');
    }
  }

  async tryCreateMyECKey_(did,nodeId) {
    const myKeyPair = await window.crypto.subtle.generateKey(
      {
        name: "ECDH",
        namedCurve: "P-256",
      },
      true, 
      ["deriveBits"]
    );
    if(this.trace0) {
      console.log('MqttEncryptChannel::tryCreateMyECKey_::myKeyPair=:<',myKeyPair,'>');
    }
    const myPublicKey = await window.crypto.subtle.exportKey('jwk',myKeyPair.publicKey);
    if(this.trace0) {
      console.log('MqttEncryptChannel::tryCreateMyECKey_::myPublicKey=:<',myPublicKey,'>');
    }
    const myPublicKeyBase64 = base64Encode(JSON.stringify(myPublicKey));
    if(this.trace0) {
      console.log('MqttEncryptChannel::tryCreateMyECKey_::myPublicKeyBase64=:<',myPublicKeyBase64,'>');
    }
    const myPrivateKey = await window.crypto.subtle.exportKey('jwk',myKeyPair.privateKey);
    if(this.trace0) {
      console.log('MqttEncryptChannel::tryCreateMyECKey_::myPrivateKey=:<',myPrivateKey,'>');
    }
    const myPrivateKeyBase64 = base64Encode(JSON.stringify(myPrivateKey));
    if(this.trace0) {
      console.log('MqttEncryptChannel::tryCreateMyECKey_::myPrivateKeyBase64=:<',myPrivateKeyBase64,'>');
    }
    const ecdh = {
      did:did,
      nodeId:nodeId,
      createdDate:(new Date()).toISOString(),
      key:{
        pubBase64:myPublicKeyBase64,
        privBase64:myPrivateKeyBase64
      }
    }
    if(this.trace0) {
      console.log('MqttEncryptChannel::tryCreateMyECKey_::ecdh=<',ecdh,'>');
    }
    const ecdhResult = await this.db.ecdh.put(ecdh);
    if(this.trace0) {
      console.log('MqttEncryptChannel::tryCreateMyECKey_::ecdhResult=<',ecdhResult,'>');
    }
  }
}

const base64Encode = (str) => {
  const data = new TextEncoder().encode(str);
  return base64.encode(data);
}

const base64Decode = (base64Str) => {
  const b64Bin = base64.decode(base64Str)
  return new TextDecoder().decode(b64Bin);
}


import Dexie from 'dexie';
import { StoreKey } from './otmc.const.js';
import { base64 } from '@scure/base';

/**
*
*/
export class MqttEncryptChannel {
  constructor(eeInternal) {
    this.eeInternal = eeInternal;
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
  }
  async tryCreateMyECKey_() {
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
  }
}

const base64Encode = (str) => {
  const data = new TextEncoder().encode(str);
  return base64.encode(data);
}

const base64Decode = (base64Str) => {
  const data = new TextEncoder().encode(base64Str);
  return base64.encode(data);
}


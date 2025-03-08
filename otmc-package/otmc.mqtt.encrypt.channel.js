import Dexie from 'dexie';
import { StoreKey } from './otmc.const.js';
import { base64 } from '@scure/base';

/**
*
*/
export class MqttEncryptChannel {
  constructor(eeInternal) {
    this.ee = eeInternal;
    this.trace0 = true;
    this.trace = true;
    this.debug = true;
    this.ListenEventEmitter_();
    if(this.trace0) {
      console.log('MqttEncryptChannel::constructor::this.ee=:<',this.ee,'>');
    }
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
      if(!self.ecdh)  {
        self.ecdh = new MqttEncryptECDH(self.otmc,self.auth,self.base32,self.util);
      }
    });
    this.ee.on('did:document',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
      await self.ecdh.loadMyECKey();
      await self.ecdh.loadMemeberPubKey();
      const topic = 'teamspace/secret/encrypt/ecdh/pubKey/jwk';
      const payload = {
        did:self.otmc.did.didDoc_.id,
        nodeId:self.auth.address(),
        pubKeyJwk:self.ecdh.myPublicKeyJwk
      }
      self.ee.emit('otmc.mqtt.publish',{msg:{topic:topic,payload:payload}});
    });
    this.ee.on('teamspace/secret/encrypt/ecdh/pubKey/jwk',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.ecdh.storeRemotePubKey(evt.payload);
    });
  }
}

class MqttEncryptECDH {
  constructor(otmc,auth,base32,util) {
    this.version = '1.0';
    this.trace0 = true;
    this.trace = true;
    this.debug = true;
    this.otmc = otmc;
    this.auth = auth;
    this.base32 = base32;
    this.util = util;
    this.initDB_();
    if(this.trace0) {
      console.log('MqttEncryptECDH::constructor::this.otmc=:<',this.otmc,'>');
    }
  }
  async loadMyECKey() {
    if(this.trace0) {
      console.log('MqttEncryptECDH::loadMyECKey::this.otmc=:<',this.otmc,'>');
      console.log('MqttEncryptECDH::loadMyECKey::this.otmc.did=:<',this.otmc.did,'>');
      console.log('MqttEncryptECDH::loadMyECKey::this.otmc.did.didDoc_=:<',this.otmc.did.didDoc_,'>');
    }
    const did = this.otmc.did.didDoc_.id;
    if(this.trace0) {
      console.log('MqttEncryptECDH::loadMyECKey::did=:<',did,'>');
    }
    const nodeId = this.auth.address();
    if(this.trace0) {
      console.log('MqttEncryptECDH::loadMyECKey::nodeId=:<',nodeId,'>');
    }
    let myECDH = await this.db.ecdh.where({did:did,nodeId:nodeId}).first();
    if(this.trace0) {
      console.log('MqttEncryptECDH::loadMyECKey::myECDH:<',myECDH,'>'); 
    }
    if(!myECDH) {
      await this.tryCreateMyECKey_(did,nodeId);
      myECDH = await this.db.ecdh.where({did:did,nodeId:nodeId}).first();
      if(this.trace0) {
        console.log('MqttEncryptECDH::loadMyECKey::myECDH:<',myECDH,'>'); 
      }
    }
    this.myECDH = myECDH;
    const myPublicKey = JSON.parse(base64Decode(myECDH.pubBase64));
    if(this.trace0) {
      console.log('MqttEncryptECDH::loadMyECKey::myPublicKey=<',myPublicKey,'>');
    }
    const myPrivateKey = JSON.parse(base64Decode(myECDH.privBase64));
    if(this.trace0) {
      console.log('MqttEncryptECDH::loadMyECKey::myPrivateKey=<',myPrivateKey,'>');
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
      console.log('MqttEncryptECDH::loadMyECKey::this.myPublicKey=<',this.myPublicKey,'>');
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::loadMyECKey::this.myPrivateKey=<',this.myPrivateKey,'>');
    }
  }

  async loadMemeberPubKey() {
    if(this.trace0) {
      console.log('MqttEncryptECDH::loadMemeberPubKey::this.otmc=:<',this.otmc,'>');
      console.log('MqttEncryptECDH::loadMemeberPubKey::this.otmc.did=:<',this.otmc.did,'>');
      console.log('MqttEncryptECDH::loadMemeberPubKey::this.otmc.did.didDoc_=:<',this.otmc.did.didDoc_,'>');
    }
    const did = this.otmc.did.didDoc_.id;
    if(this.trace0) {
      console.log('MqttEncryptECDH::loadMemeberPubKey::did=:<',did,'>');
    }
    const memberAuths = this.otmc.did.didDoc_.authentication;
    if(this.trace0) {
      console.log('MqttEncryptECDH::loadMemeberPubKey::memberAuths=<',memberAuths,'>');
    }
    const memberNodeIds = [];
    for(const authentication of memberAuths) {
      if(this.trace0) {
        console.log('MqttEncryptECDH::loadMemeberPubKey::authentication=<',authentication,'>');
      }
      const authItems =  authentication.split('#');
      if(this.trace0) { 
        console.log('MqttEncryptECDH::loadMemeberPubKey::authItems=<',authItems,'>');
      }
      if(authItems.length > 1) {
        const nodeId = authItems[1];
        if(nodeId !== this.auth.address()) {
          memberNodeIds.push(nodeId);
        }
      }
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::loadMemeberPubKey::memberNodeIds=<',memberNodeIds,'>');
    }
    this.memberPublicKeysJwk = {};
    this.memberPublicKeysJwk[did] = {};
    this.memberPublicKeys = {};
    this.memberPublicKeys[did] = {};
    for(const nodeId of memberNodeIds) {
      let memberECDH = await this.db.ecdh.where({did:did,nodeId:nodeId}).first();
      if(this.trace0) {
        console.log('MqttEncryptECDH::loadMemeberPubKey::memberECDH=<',memberECDH,'>');
      }
      if(memberECDH && memberECDH.key && memberECDH.key.pubBase64) {
        this.tryLoadMemberPubKey_(did,nodeId,memberECDH.key.pubBase64);
      }
    }
  }

  initDB_() {
    this.db = new Dexie(StoreKey.secret.mqtt.encrypt.channel.dbName);
    this.db.version(this.version).stores({
      ecdh: '++autoId,did,nodeId,createdDate,pubBase64,privBase64',
    });
    this.db.version(this.version).stores({
      secret: '++autoId,did,myNodeId,remoteNodeId,secretBase64,issuedDate,expireDate',
    });
  }

  async tryCreateMyECKey_(did,nodeId) {
    if(this.trace0) {
      console.log('MqttEncryptECDH::tryCreateMyECKey_::this.creating_=:<',this.creating_,'>');
    }
    if(this.creating_)  {
      return;
    }
    this.creating_ = true;
    const myKeyPair = await window.crypto.subtle.generateKey(
      {
        name: "ECDH",
        namedCurve: "P-256",
      },
      true, 
      ["deriveBits"]
    );
    if(this.trace0) {
      console.log('MqttEncryptECDH::tryCreateMyECKey_::myKeyPair=:<',myKeyPair,'>');
    }
    const myPublicKey = await window.crypto.subtle.exportKey('jwk',myKeyPair.publicKey);
    if(this.trace0) {
      console.log('MqttEncryptECDH::tryCreateMyECKey_::myPublicKey=:<',myPublicKey,'>');
    }
    const myPublicKeyBase64 = base64Encode(JSON.stringify(myPublicKey));
    if(this.trace0) {
      console.log('MqttEncryptECDH::tryCreateMyECKey_::myPublicKeyBase64=:<',myPublicKeyBase64,'>');
    }
    const myPrivateKey = await window.crypto.subtle.exportKey('jwk',myKeyPair.privateKey);
    if(this.trace0) {
      console.log('MqttEncryptECDH::tryCreateMyECKey_::myPrivateKey=:<',myPrivateKey,'>');
    }
    const myPrivateKeyBase64 = base64Encode(JSON.stringify(myPrivateKey));
    if(this.trace0) {
      console.log('MqttEncryptECDH::tryCreateMyECKey_::myPrivateKeyBase64=:<',myPrivateKeyBase64,'>');
    }
    const ecdh = {
      did:did,
      nodeId:nodeId,
      createdDate:(new Date()).toISOString(),
      pubBase64:myPublicKeyBase64,
      privBase64:myPrivateKeyBase64
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::tryCreateMyECKey_::ecdh=<',ecdh,'>');
    }
    const ecdhResult = await this.db.ecdh.put(ecdh);
    if(this.trace0) {
      console.log('MqttEncryptECDH::tryCreateMyECKey_::ecdhResult=<',ecdhResult,'>');
    }
  }

  tryLoadMemberPubKey_(did,nodeId,pubBase64) {
    if(this.trace0) {
      console.log('MqttEncryptECDH::tryLoadMemberPubKey_::did=<',did,'>');
      console.log('MqttEncryptECDH::tryLoadMemberPubKey_::nodeId=<',nodeId,'>');
      console.log('MqttEncryptECDH::tryLoadMemberPubKey_::pubBase64=<',pubBase64,'>');
    }
    const memberPublicKey = JSON.parse(base64Decode(pubBase64));
    if(this.trace0) {
      console.log('MqttEncryptECDH::tryLoadMemberPubKey_::memberPublicKey=<',memberPublicKey,'>');
    }
    const memberPublicKeyJwk = memberPublicKey;
    if(this.trace0) {
      console.log('MqttEncryptECDH::tryLoadMemberPubKey_::memberPublicKeyJwk=<',memberPublicKeyJwk,'>');
    }
    const memberPublicKeyKey = crypto.subtle.importKey("jwk", memberPublicKeyJwk, {
      name: "ECDH",
      namedCurve: "P-256"
    }, true, []);
    if(this.trace0) {
      console.log('MqttEncryptECDH::tryLoadMemberPubKey_::memberPublicKeyKey=<',memberPublicKeyKey,'>');
    }
    this.memberPublicKeysJwk[did][nodeId] = memberPublicKeyJwk;
    this.memberPublicKeys[did][nodeId] = memberPublicKeyKey;
  }
  async storeRemotePubKey(keyMsg) {
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeRemotePubKey::keyMsg=<',keyMsg,'>');
    }
    const remotePublicKeyBase64 = base64Encode(JSON.stringify(keyMsg.pubKeyJwk));
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeRemotePubKey::remotePublicKeyBase64=:<',remotePublicKeyBase64,'>');
    }
    const filter = {
      did:keyMsg.did,
      nodeId:keyMsg.nodeId,
      pubBase64:remotePublicKeyBase64
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeRemotePubKey::filter=:<',filter,'>');
    }
    let hitnECDH = await this.db.ecdh.where(filter).first();
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeRemotePubKey::hitnECDH=<',hitnECDH,'>');
    }
    if(hitnECDH) {
      return;
    }

    const ecdh = {
      did:keyMsg.did,
      nodeId:keyMsg.nodeId,
      createdDate:(new Date()).toISOString(),
      pubBase64:remotePublicKeyBase64,
      privBase64:null
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeRemotePubKey::ecdh=<',ecdh,'>');
    }
    const ecdhResult = await this.db.ecdh.put(ecdh);
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeRemotePubKey::ecdhResult=<',ecdhResult,'>');
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


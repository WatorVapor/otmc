import Dexie from 'dexie';
import { StoreKey } from './otmc.const.js';
import { base64 } from '@scure/base';

//const iConstIssueMilliSeconds = 1000 * 60 * 60;
const iConstIssueMilliSeconds = 1000 * 60 * 5;
const iConstLastTopSharedKey = 5;

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
      await self.ecdh.calcSharedKeysOfNode();
      const topic = 'teamspace/secret/encrypt/ecdh/pubKey/jwk';
      const payload = {
        did:self.otmc.did.didDoc_.id,
        nodeId:self.auth.address(),
        pubKeyJwk:self.ecdh.myPublicKeyJwk
      }
      self.ee.emit('otmc.mqtt.publish',{msg:{topic:topic,payload:payload}});
      //await self.ecdh.prepareSharedKeysOfTeamSpace();
    });
    this.ee.on('teamspace/secret/encrypt/ecdh/pubKey/jwk',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.ecdh.storeRemotePubKey(evt.payload);
    });
    this.ee.on('otmc.mqtt.encrypt.channel.encrypt',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.encryptMsgPayload4TeamSpace_(evt);
    });
    this.ee.on('otmc.mqtt.encrypt.sharedkey.spaceteam.refresh',async (evt)=>{
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::evt=:<',evt,'>');
      }
      await self.ecdh.prepareSharedKeysOfTeamSpace();
      const unicastMsg = await self.ecdh.createUnicastMessage4SharedKeysOfTeamSpace();
      if(self.trace0) {
        console.log('MqttEncryptChannel::ListenEventEmitter_::unicastMsg=:<',unicastMsg,'>');
      }
    });
  }
  async encryptMsgPayload4TeamSpace_(mqttMsg) {
    if(this.trace0) {
      console.log('MqttEncryptChannel::encryptMsgPayload4TeamSpace_::mqttMsg=:<',mqttMsg,'>');
    }
    const did = this.otmc.did.didDoc_.id;
    if(this.trace0) {
      console.log('MqttEncryptChannel::encryptMsgPayload4TeamSpace_::did=:<',did,'>');
    }
    const encyptMsg = await this.ecdh.encryptData4TeamSpace(mqttMsg,did);
    if(this.trace0) {
      console.log('MqttEncryptChannel::encryptMsgPayload4TeamSpace_::encyptMsg=:<',encyptMsg,'>');
    }
    if(encyptMsg === false) {
      this.ee.emit('otmc.mqtt.encrypt.sharedkey.spaceteam.refresh',{});
      return;
    }
    return encyptMsg;
  }
  async encryptMsgPayloadByPublicKey_(mqttMsg) {
    const didPublicKeys = this.ecdh.memberPublicKeys[did];
    if(this.trace0) {
      console.log('MqttEncryptChannel::encryptMsgPayloadByPublicKey_::didPublicKeys=:<',didPublicKeys,'>');
    }
    for(const nodeId in didPublicKeys) {
      if(this.trace0) {
        console.log('MqttEncryptChannel::encryptMsgPayloadByPublicKey_::nodeId=:<',nodeId,'>');
      }
      const pubKey = didPublicKeys[nodeId];
      if(this.trace0) {
        console.log('MqttEncryptChannel::encryptMsgPayloadByPublicKey_::pubKey=:<',pubKey,'>');
      }
      const encryptPayload = await this.ecdh.encryptData(mqttMsg.payload,did,nodeId);
      if(this.trace0) {
        console.log('MqttEncryptChannel::encryptMsgPayloadByPublicKey_::encryptPayload=:<',encryptPayload,'>');
      }
    }
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
      const filter = {
        did:did,
        nodeId:nodeId
      };
      if(this.trace0) {
        console.log('MqttEncryptECDH::loadMemeberPubKey::filter=<',filter,'>');
      }
      const memberECDHs = await this.db.ecdh.where(filter).sortBy('createdDate');
      if(this.trace0) {
        console.log('MqttEncryptECDH::loadMemeberPubKey::memberECDHs=<',memberECDHs,'>');
      }
      if(memberECDHs && memberECDHs.length > 0 ) {
        const memberECDH = memberECDHs[memberECDHs.length - 1];
        if(this.trace0) {
          console.log('MqttEncryptECDH::loadMemeberPubKey::memberECDH=<',memberECDH,'>');
        }
        await this.tryLoadMemberPubKey_(did,nodeId,memberECDH.pubBase64);
      }
    }
  }
  async calcSharedKeysOfNode() {
    if(this.trace0) {
      console.log('MqttEncryptECDH::calcSharedKeysOfNode::this.myPrivateKey=<',this.myPrivateKey,'>');
      console.log('MqttEncryptECDH::calcSharedKeysOfNode::this.memberPublicKeys=<',this.memberPublicKeys,'>');
    }
    for(const did in this.memberPublicKeys) {
      const spacePublicKeys = this.memberPublicKeys[did];
      if(this.trace0) {
        console.log('MqttEncryptECDH::calcSharedKeysOfNode::did=<',did,'>');
        console.log('MqttEncryptECDH::calcSharedKeysOfNode::spacePublicKeys=<',spacePublicKeys,'>');
      }
      for(const nodeId in spacePublicKeys) {
        const nodePublicKey = spacePublicKeys[nodeId];
        if(this.trace0) {
          console.log('MqttEncryptECDH::calcSharedKeysOfNode::nodeId=<',nodeId,'>');
          console.log('MqttEncryptECDH::calcSharedKeysOfNode::nodePublicKey=<',nodePublicKey,'>');
        }
        const sharedSecret = await crypto.subtle.deriveBits(
          {
            name: "ECDH",
            public: nodePublicKey,
          },
          this.myPrivateKey,
          256
        );
        if(this.trace0) {
          console.log('MqttEncryptECDH::calcSharedKeysOfNode::sharedSecret=<',sharedSecret,'>');
        }
        const sharedSecretData =  new Uint8Array(sharedSecret);
        if(this.trace0) {
          console.log('MqttEncryptECDH::calcSharedKeysOfNode::sharedSecretData=<',sharedSecretData,'>');
        }
        const sharedSecretBase64 = base64EncodeBin(sharedSecretData);
        if(this.trace0) {
          console.log('MqttEncryptECDH::calcSharedKeysOfNode::sharedSecretBase64=<',sharedSecretBase64,'>');
        }
        const filter = {
          did:did,
          myNodeId:this.auth.address(),
          remoteNodeId:nodeId,
          secretBase64:sharedSecretBase64
        }
        if(this.trace0) {
          console.log('MqttEncryptECDH::calcSharedKeysOfNode::filter=<',filter,'>');
        }
        let hitnSecret = await this.db.secret.where(filter).first();
        if(this.trace0) {
          console.log('MqttEncryptECDH::calcSharedKeysOfNode::hitnSecret=<',hitnSecret,'>');
        }
        if(hitnSecret) {
          return;
        }
        const secret = {
          did:did,
          myNodeId:this.auth.address(),
          remoteNodeId:nodeId,
          secretBase64:sharedSecretBase64,
          issuedDate:(new Date()).toISOString(),
          expireDate:null
        }
        if(this.trace0) {
          console.log('MqttEncryptECDH::calcSharedKeysOfNode::secret=<',secret,'>');
        }
        const secretResult = await this.db.secret.put(secret);
        if(this.trace0) {
          console.log('MqttEncryptECDH::calcSharedKeysOfNode::secretResult=<',secretResult,'>');
        }
      }
    }
  }
  async prepareSharedKeysOfTeamSpace() {
    if(this.trace0) {
      console.log('MqttEncryptECDH::prepareSharedKeysOfTeamSpace::this.otmc.did.didDoc_=<',this.otmc.did.didDoc_,'>');
    }
    const filterSpace = {
      did:this.otmc.did.didDoc_.id,
    }

    const secretsOfTeamSpace = await this.db.secretOfTeamSpace.where(filterSpace).sortBy('issuedDate');
    if(this.trace0) {
      console.log('MqttEncryptECDH::prepareSharedKeysOfTeamSpace::secretsOfTeamSpace=<',secretsOfTeamSpace,'>');
    }
    if(secretsOfTeamSpace && secretsOfTeamSpace.length > 0 ) {
      const secretOfTeamSpace = secretsOfTeamSpace[secretsOfTeamSpace.length - 1];
      if(this.trace0) {
        console.log('MqttEncryptECDH::prepareSharedKeysOfTeamSpace::secretOfTeamSpace=<',secretOfTeamSpace,'>');
      }
      const issuedDate = new Date(secretOfTeamSpace.issuedDate);
      const now = new Date();
      const diff = now - issuedDate;
      const diffOneHour = diff / (1000 * 60 * 60);
      if(this.trace0) {
        console.log('MqttEncryptECDH::prepareSharedKeysOfTeamSpace::diffOneHour=<',diffOneHour,'>');
      }
      if(diffOneHour < 1) {
        return;
      }
    }

    const teamSharedKey = await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]      
    );
    if(this.trace0) {
      console.log('MqttEncryptECDH::prepareSharedKeysOfTeamSpace::teamSharedKey=<',teamSharedKey,'>');
    }
    const teamSharedKeyJwk = await crypto.subtle.exportKey('jwk',teamSharedKey);
    if(this.trace0) {
      console.log('MqttEncryptECDH::prepareSharedKeysOfTeamSpace::teamSharedKeyJwk=<',teamSharedKeyJwk,'>');
    }
    const teamSharedKeyBase64 = base64Encode(JSON.stringify(teamSharedKeyJwk));
    if(this.trace0) {
      console.log('MqttEncryptECDH::prepareSharedKeysOfTeamSpace::teamSharedKeyBase64=<',teamSharedKeyBase64,'>');
    }
    const filter = {
      did:this.otmc.did.didDoc_.id,
      secretBase64:teamSharedKeyBase64
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::prepareSharedKeysOfTeamSpace::filter=<',filter,'>');
    }
    let hitnSecretTeam = await this.db.secretOfTeamSpace.where(filter).first();
    if(this.trace0) {
      console.log('MqttEncryptECDH::prepareSharedKeysOfTeamSpace::hitnSecretTeam=<',hitnSecretTeam,'>');
    }
    if(hitnSecretTeam) {
      return;
    }
    const secret = {
      did:this.otmc.did.didDoc_.id,
      secretBase64:teamSharedKeyBase64,
      issuedDate:(new Date()).toISOString(),
      expireDate:null
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::prepareSharedKeysOfTeamSpace::secret=<',secret,'>');
    }
    const secretResult = await this.db.secretOfTeamSpace.put(secret);
    if(this.trace0) {
      console.log('MqttEncryptECDH::prepareSharedKeysOfTeamSpace::secretResult=<',secretResult,'>');
    }
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
  async encryptData4Node(dataObject,did,nodeId) {
    if(this.trace0) {
      console.log('MqttEncryptECDH::encryptData4Node::dataObject=<',dataObject,'>');
      console.log('MqttEncryptECDH::encryptData4Node::did=<',did,'>');
      console.log('MqttEncryptECDH::encryptData4Node::nodeId=<',nodeId,'>');
    }
  }
  
  async encryptData4TeamSpace(mqttMsg,did) {
    if(this.trace0) {
      console.log('MqttEncryptECDH::encryptData4TeamSpace::mqttMsg=<',mqttMsg,'>');
      console.log('MqttEncryptECDH::encryptData4TeamSpace::did=<',did,'>');
    }
    const teamSharedKeys = await this.db.secretOfTeamSpace.where({did:did}).sortBy('issuedDate');
    if(this.trace0) {
      console.log('MqttEncryptECDH::encryptData4TeamSpace::teamSharedKeys=<',teamSharedKeys,'>');
    }
    if(teamSharedKeys && teamSharedKeys.length > 0 ) {
      const teamSharedKey = teamSharedKeys[teamSharedKeys.length - 1];
      if(this.trace0) {
        console.log('MqttEncryptECDH::encryptData4TeamSpace::teamSharedKey=<',teamSharedKey,'>');
      }
      const issuedDate = new Date(teamSharedKey.issuedDate);
      const now = new Date();
      const diff = now - issuedDate;
      if(diff > iConstIssueMilliSeconds) {
        // renew teamSharedKey
        return false;
      }
      const teamSharedKeyJwk = JSON.parse(base64Decode(teamSharedKey.secretBase64));
      if(this.trace0) {
        console.log('MqttEncryptECDH::encryptData4TeamSpace::teamSharedKeyJwk=<',teamSharedKeyJwk,'>');
      }
      const teamSharedKeyKey = await crypto.subtle.importKey("jwk", teamSharedKeyJwk, {
        name: "AES-GCM",
        length: 256
      }, true, ["encrypt"]);
      if(this.trace0) {
        console.log('MqttEncryptECDH::encryptData4TeamSpace::teamSharedKeyKey=<',teamSharedKeyKey,'>');
      }
      this.teamSharedKeyKey = teamSharedKeyKey;
      const data = JSON.stringify(mqttMsg);
      if(this.trace0) {
        console.log('MqttEncryptECDH::encryptData4TeamSpace::data=<',data,'>');
      }
      const dataBin = new TextEncoder().encode(data);
      if(this.trace0) {
        console.log('MqttEncryptECDH::encryptData4TeamSpace::dataBin=<',dataBin,'>');
      }
      const iv = crypto.getRandomValues(new Uint8Array(16));
      if(this.trace0) {
        console.log('MqttEncryptECDH::encryptData4TeamSpace::iv=<',iv,'>');
      }
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        teamSharedKeyKey,
        dataBin
      );
      if(this.trace0) {
        console.log('MqttEncryptECDH::encryptData4TeamSpace::encryptedData=<',encryptedData,'>');
      }
      const encryptedDataBin = new Uint8Array(encryptedData);
      if(this.trace0) {
        console.log('MqttEncryptECDH::encryptData4TeamSpace::encryptedDataBin=<',encryptedDataBin,'>');
      }
      const encryptedDataBase64 = base64EncodeBin(encryptedDataBin);
      if(this.trace0) {
        console.log('MqttEncryptECDH::encryptData4TeamSpace::encryptedData=<',encryptedDataBase64,'>');
      }
      return encryptedDataBase64;
    }
  }

  async createUnicastMessage4SharedKeysOfTeamSpace() {
    const did = this.otmc.did.didDoc_.id;
    if(this.trace0) {
      console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::did=:<',did,'>');
    }
    const teamSharedKeys = await this.db.secretOfTeamSpace.where({did:did}).sortBy('issuedDate');
    if(this.trace0) {
      console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::teamSharedKeys=<',teamSharedKeys,'>');
    }
    const lastTeamSharedKeys = teamSharedKeys.slice(Math.max(teamSharedKeys.length - iConstLastTopSharedKey, 1));
    if(this.trace0) {
      console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::lastTeamSharedKeys=<',lastTeamSharedKeys,'>');
    }


    const didPublicKeys = this.memberPublicKeys[did];
    if(this.trace0) {
      console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::didPublicKeys=<',didPublicKeys,'>');
    }
    for(const didKey in didPublicKeys) {
      if(this.trace0) {
        console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::didKey=<',didKey,'>');
      }
      const filter = {
        did:did,
        myNodeId:this.auth.address(),
        remoteNodeId:didKey
      }
      if(this.trace0) {
        console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::filter=<',filter,'>');
      }
      let hintSecrets = await this.db.secret.where(filter).sortBy('issuedDate');
      if(this.trace0) {
        console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::hintSecrets=<',hintSecrets,'>');
      }
      if(hintSecrets && hintSecrets.length > 0 ) {
        const hintSecret = hintSecrets[hintSecrets.length - 1];
        if(this.trace0) {
          console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::hintSecret=<',hintSecret,'>');
        }
        const sharedSecret = base64DecodeBin(hintSecret.secretBase64);
        if(this.trace0) {
          console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::sharedSecret=<',sharedSecret,'>');
        }
        const iv = crypto.getRandomValues(new Uint8Array(16));
        if(this.trace0) {
          console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::sharedSecret=<',sharedSecret,'>');
        }
        const encoded = new TextEncoder().encode(JSON.stringify(lastTeamSharedKeys));
        if(this.trace0) {
          console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::encoded=<',encoded,'>');
        }
        const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv },sharedSecret,encoded);
        if(this.trace0) {
          console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::ciphertext=<',ciphertext,'>');
        }
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
    this.db.version(this.version).stores({
      secretOfTeamSpace: '++autoId,did,issuedDate,expireDate',
    });
    this.db.version(this.version).stores({
      vote: '++autoId,did,nodeId,issuedDate,expireDate,zhuang,nonce',
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

  async tryLoadMemberPubKey_(did,nodeId,pubBase64) {
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
    const memberPublicKeyKey = await crypto.subtle.importKey("jwk", memberPublicKeyJwk, {
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

const base64EncodeBin = (Bin) => {
  return base64.encode(Bin);
}

const base64Decode = (base64Str) => {
  const b64Bin = base64.decode(base64Str)
  return new TextDecoder().decode(b64Bin);
}

const base64DecodeBin = (base64Str) => {
  return base64.decode(base64Str);
}

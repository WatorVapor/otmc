import Dexie from 'dexie';
import { StoreKey } from './otmc.const.js';
import { base64 } from '@scure/base';


const iConstSharedKeyRegenMiliSec = 1000 * 60 * 60;
//const iConstSharedKeyRegenMiliSec = 1000 * 5;
const iConstIssueMilliSeconds = 1000 * 60 * 60;
//const iConstIssueMilliSeconds = 1000 * 5;
const iConstRevoteMilliSeconds = 1000 * 60 * 60;
//const iConstRevoteMilliSeconds = 1000 * 6;




const iConstLastTopSharedKey = 5;


export class MqttEncryptECDH {
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
    this.teamSharedKeys = {};
    this.teamTopSharedKey = {};
    this.voteTimeout = iConstRevoteMilliSeconds;
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
  async loadSharedKeyOfTeamSpace() {
    const did = this.otmc.did.didDoc_.id;
    if(this.trace0) {
      console.log('MqttEncryptECDH::loadSharedKeyOfTeamSpace::did=:<',did,'>');
    }
    const filter = {
      did:did,
    }
    this.teamSharedKeys[did] = {};
    this.teamTopSharedKey[did] = {};
    const self = this;
    const teamSharedKeys1 = await this.db.secretOfTeamSpace.where(filter)
    .and((secret)=>{
      return self.filterOutTimeIsssed_(secret,iConstSharedKeyRegenMiliSec);
    })
    .sortBy('issuedDate');
    if(this.trace0) {
      console.log('MqttEncryptECDH::loadSharedKeyOfTeamSpace::teamSharedKeys1=<',teamSharedKeys1,'>');
    }
    const teamSharedKeys = teamSharedKeys1.toReversed();;
    if(this.trace0) {
      console.log('MqttEncryptECDH::loadSharedKeyOfTeamSpace::teamSharedKeys=<',teamSharedKeys,'>');
    }
    let topKeyId = null;
    let topKey = null;
    for(const teamKey of teamSharedKeys ) {
      const teamSharedKeyJwk = JSON.parse(base64Decode(teamKey.secretBase64));
      if(this.trace0) {
        console.log('MqttEncryptECDH::loadSharedKeyOfTeamSpace::teamSharedKeyJwk=<',teamSharedKeyJwk,'>');
      }
      const teamSharedKeyImported = await crypto.subtle.importKey("jwk", teamSharedKeyJwk, {
        name: "AES-GCM",
        length: 256
      }, true, ["encrypt","decrypt"]);
      if(this.trace0) {
        console.log('MqttEncryptECDH::loadSharedKeyOfTeamSpace::teamSharedKeyImported=<',teamSharedKeyImported,'>');
      }
      const keyId = this.util.calcAddress(teamKey.secretBase64);
      if(this.trace0) {
        console.log('MqttEncryptECDH::loadSharedKeyOfTeamSpace::keyId=<',keyId,'>');
      }
      this.teamSharedKeys[did][keyId] = teamSharedKeyImported;
      if(!topKeyId) {
        topKeyId = keyId;
        topKey = teamSharedKeyImported;
      }
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::loadSharedKeyOfTeamSpace::this.teamSharedKeys=<',this.teamSharedKeys,'>');
    }
    if(topKeyId) {
      this.teamTopSharedKey[did][topKeyId] = topKey;
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::loadSharedKeyOfTeamSpace::this.teamTopSharedKey=<',this.teamTopSharedKey,'>');
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
          issuedDate:(new Date()).toLocaleString(),
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
    const self = this;
    const filterSpace = {
      did:this.otmc.did.didDoc_.id,
    }
    const secretsOfTeamSpace = await this.db.secretOfTeamSpace.where(filterSpace).and((secret) =>{
      return self.filterOutTimeIsssed_(secret,iConstSharedKeyRegenMiliSec);
    }).first();
    if(this.trace0) {
      console.log('MqttEncryptECDH::prepareSharedKeysOfTeamSpace::secretsOfTeamSpace=<',secretsOfTeamSpace,'>');
    }
    if(secretsOfTeamSpace ) {
      return;
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
    const secretId = this.util.calcAddress(teamSharedKeyBase64);
    if(this.trace0) {
      console.log('MqttEncryptECDH::prepareSharedKeysOfTeamSpace::secretId=<',secretId,'>');
    }
    const secret = {
      did:this.otmc.did.didDoc_.id,
      secretId:secretId,
      secretBase64:teamSharedKeyBase64,
      issuedDate:(new Date()).toLocaleString(),
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
      createdDate:(new Date()).toLocaleString(),
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
    let teamSharedKeyPair = this.teamTopSharedKey[did];
    if(this.trace0) {
      console.log('MqttEncryptECDH::encryptData4TeamSpace::teamSharedKeyPair=<',teamSharedKeyPair,'>');
    }
    if(!teamSharedKeyPair) {
      this.loadSharedKeyOfTeamSpace();
      teamSharedKeyPair = this.teamTopSharedKey[did];
    }
    if(!teamSharedKeyPair) {
      // TODO:
      return false;
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::encryptData4TeamSpace::teamSharedKeyPair=<',teamSharedKeyPair,'>');
    }
    const teamSharedKeyId = Object.keys(teamSharedKeyPair)[0];
    if(this.trace0) {
      console.log('MqttEncryptECDH::encryptData4TeamSpace::teamSharedKeyId=<',teamSharedKeyId,'>');
    }
    if(!teamSharedKeyId) {
      // TODO:
      return false;
    }
    const teamSharedKey = teamSharedKeyPair[teamSharedKeyId];
    if(this.trace0) {
      console.log('MqttEncryptECDH::encryptData4TeamSpace::teamSharedKey=<',teamSharedKey,'>');
    }
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
      teamSharedKey,
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
    return {
      keyId:teamSharedKeyId,
      ivBase64:base64EncodeBin(iv),
      encryptedBase64:encryptedDataBase64
    };
  }


  async decryptData4TeamSpace(mqttPayload,did) {
    if(this.trace0) {
      console.log('MqttEncryptECDH::decryptData4TeamSpace::mqttPayload=<',mqttPayload,'>');
      console.log('MqttEncryptECDH::decryptData4TeamSpace::did=<',did,'>');
    }
    const srcKeyId = mqttPayload.keyId;
    if(this.trace0) {
      console.log('MqttEncryptECDH::decryptData4TeamSpace::srcKeyId=<',srcKeyId,'>');
    }
    let teamSharedKey = this.teamSharedKeys[did];
    if(!teamSharedKey) {
      this.loadSharedKeyOfTeamSpace();
      teamSharedKey = this.teamSharedKeys[did];
      if(!teamSharedKey) {
        // TODO:
        return false;
      }
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::decryptData4TeamSpace::teamSharedKey=<',teamSharedKey,'>');
    }
    const encryptedKey = teamSharedKey[srcKeyId]
    if(this.trace0) {
      console.log('MqttEncryptECDH::decryptData4TeamSpace::encryptedKey=<',encryptedKey,'>');
    }
    if(!encryptedKey) {
      // TODO:
      return false;
    }
    const ivBin = base64DecodeBin(mqttPayload.ivBase64);
    if(this.trace0) {
      console.log('MqttEncryptECDH::decryptData4TeamSpace::ivBin=<',ivBin,'>');
    }
    const encryptedDataBin = base64DecodeBin(mqttPayload.encryptedBase64);
    if(this.trace0) {
      console.log('MqttEncryptECDH::decryptData4TeamSpace::encryptedDataBin=<',encryptedDataBin,'>');
    }
    const decryptedDataBin = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivBin,
      },
      encryptedKey,
      encryptedDataBin
    )
    if(this.trace0) {
      console.log('MqttEncryptECDH::decryptData4TeamSpace::decryptedDataBin=<',decryptedDataBin,'>');
    }
    const decryptedMessage = JSON.parse(new TextDecoder().decode(decryptedDataBin));
    if(this.trace0) {
      console.log('MqttEncryptECDH::decryptData4TeamSpace::decryptedMessage=<',decryptedMessage,'>');
    }
    return decryptedMessage;
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
    const castMessages = [];
    for(const nodeId in didPublicKeys) {
      if(this.trace0) {
        console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::nodeId=<',nodeId,'>');
      }
      const nodePublicKey = didPublicKeys[nodeId];
      const sharedSecret = await window.crypto.subtle.deriveBits(
        {
          name: "ECDH",
          public: nodePublicKey,
        },
        this.myPrivateKey,
        256
      );
      if(this.trace0) {
        console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::sharedSecret=<',sharedSecret,'>');
      }
      const encryptRaw = await window.crypto.subtle.importKey("raw", sharedSecret, {name: "AES-GCM"}, true, ["encrypt"]);
      if(this.trace0) {
        console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::encryptRaw=<',encryptRaw,'>');
      }
      const iv = window.crypto.getRandomValues(new Uint8Array(16));
      if(this.trace0) {
        console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::iv=<',iv,'>');
      }
      const encoded = new TextEncoder().encode(JSON.stringify(lastTeamSharedKeys));
      if(this.trace0) {
        console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::encoded=<',encoded,'>');
      }
      const ciphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv },encryptRaw,encoded);
      if(this.trace0) {
        console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::ciphertext=<',ciphertext,'>');
      }
      const decryptRaw = await window.crypto.subtle.importKey("raw", sharedSecret, {name: "AES-GCM"}, true, ["decrypt"]);
      if(this.trace0) {
        console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::decryptRaw=<',decryptRaw,'>');
      }
      const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv },decryptRaw,ciphertext);
      if(this.trace0) {
        console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::decrypted=<',decrypted,'>');
      }
      const ivBase64 = base64EncodeBin(new Uint8Array(iv));
      if(this.trace0) {
        console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::ivBase64=<',ivBase64,'>');
      }
      const encryptBase64 = base64EncodeBin(new Uint8Array(ciphertext));
      if(this.trace0) {
        console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::encryptBase64=<',encryptBase64,'>');
      }
      castMessages.push({
        topic:`teamspace/secret/encrypt/ecdh/secret/space`,
        payload:{
          srcNodeId:this.auth.address(),
          distNodeId:nodeId,
          iv:ivBase64,
          encrypt:encryptBase64
        }
      });
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::castMessages=<',castMessages,'>');
    }
    return castMessages;
  }
  async storeSharedKeySecretOfSpace(secretMsg,did) {
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace::secretMsg=<',secretMsg,'>');
      console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace::did=<',did,'>');
    }
    if(secretMsg.distNodeId !== this.auth.address()) {
      if(this.trace0) {
        console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace::secretMsg.distNodeId=<',secretMsg.distNodeId,'>');
        console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace::this.auth.address()=<',this.auth.address(),'>');
      }
      return;
    }
    const memberPubKeys = this.memberPublicKeys[did];
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace::memberPubKeys=<',memberPubKeys,'>');
    }
    const nodePublicKey = memberPubKeys[secretMsg.srcNodeId];
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace::nodePublicKey=<',nodePublicKey,'>');
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
      console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace::sharedSecret=<',sharedSecret,'>');
    }
    const encryptRaw = await window.crypto.subtle.importKey("raw", sharedSecret, {name: "AES-GCM"}, true, ["decrypt"]);
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace::encryptRaw=<',encryptRaw,'>');
    }
    const iv = base64DecodeBin(secretMsg.iv);
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace::iv=<',iv,'>');
    }
    const ciphertext = base64DecodeBin(secretMsg.encrypt);
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace::ciphertext=<',ciphertext,'>');
    }
    const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv },encryptRaw,ciphertext);
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace::decrypted=<',decrypted,'>');
    }
    const sharedKeysOfTeamSpace = JSON.parse(new TextDecoder().decode(decrypted));
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace::sharedKeysOfTeamSpace=<',sharedKeysOfTeamSpace,'>');
    }
    if(sharedKeysOfTeamSpace) {
      for(const sharedKeyOfTeamSpace of sharedKeysOfTeamSpace) {
        await this.storeSharedKeySecretOfSpace_(sharedKeyOfTeamSpace);
      }
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
      createdDate:(new Date()).toLocaleString(),
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

  async checkServantVoteExpired() {
    const did = this.otmc.did.didDoc_.id;
    if(this.trace0) {
      console.log('MqttEncryptECDH::checkServantVoteExpired::did=<',did,'>');
    }
    const self = this;

    const filter1 = {
      did:did,
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::checkServantVoteExpired::filter1=:<',filter1,'>');
    }
    const servantVotes = await this.db.servantVote.where(filter1).and((vote)=>{
      return self.filterOutTimeIsssed_(vote,iConstRevoteMilliSeconds);
    }).toArray();
    if(this.trace0) {
      console.log('MqttEncryptECDH::checkServantVoteExpired::servantVotes=<',servantVotes,'>');
    }
    const result = {};
    if(servantVotes.length === 0) {
      result.reVote = true;
      result.servant = false;
    }

    let nonceMax = 0.0;
    let nodeIdOfMax = ''; 
    for(const servantVote of servantVotes ) {
      if(this.trace0) {
        console.log('MqttEncryptECDH::checkServantVoteExpired::servantVote=<',servantVote,'>');
      }
      result.reVote = false;
      if(servantVote.nonce > nonceMax) {
        nonceMax = servantVote.nonce;
        nodeIdOfMax = servantVote.nodeId;
      }
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::checkServantVoteExpired::nonceMax=<',nonceMax,'>');
      console.log('MqttEncryptECDH::checkServantVoteExpired::nodeIdOfMax=<',nodeIdOfMax,'>');
    }
    if(nodeIdOfMax === this.auth.address()) {
      result.servant = true;
    } else {
      result.servant = false;
      // if other servant is down try revote.
      result.reVote = true;
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::checkServantVoteExpired::result=<',result,'>');
    }

    const filter2 = {
      did:did,
      nodeId:this.auth.address()
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::checkServantVoteExpired::filter2=:<',filter2,'>');
    }
    let mySerantNonce = await this.db.servantVote.where(filter2).and((vote)=>{
      return self.filterOutTimeIsssed_(vote,iConstRevoteMilliSeconds)
    }).first();
    if(this.trace0) {
      console.log('MqttEncryptECDH::checkServantVoteExpired::mySerantNonce=:<',mySerantNonce,'>');
    }
    if(!mySerantNonce) {
      const storeVote = {
        did:did,
        nodeId:this.auth.address(),
        issuedDate:(new Date()).toLocaleString(),
        expireDate:null,
        nonce:Math.random(),
      }
      const storeReult = await this.db.servantVote.put(storeVote);
      if(this.trace0) {
        console.log('MqttEncryptECDH::checkServantVoteExpired::storeReult=<',storeReult,'>');
      }
    }
    return result;
  }

  async getServantVoteInTimeBound() {
    const did = this.otmc.did.didDoc_.id;
    if(this.trace0) {
      console.log('MqttEncryptECDH::getServantVoteInTimeBound::did=<',did,'>');
    }
    const self = this;
    const filter1 = {
      did:did,
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::getServantVoteInTimeBound::filter1=:<',filter1,'>');
    }
    const servantVotes = await this.db.servantVote.where(filter1).and((vote)=>{
      return self.filterOutTimeIsssed_(vote,iConstRevoteMilliSeconds);
    }).toArray();
    if(this.trace0) {
      console.log('MqttEncryptECDH::getServantVoteInTimeBound::servantVotes=<',servantVotes,'>');
    }
    return servantVotes;
  }

  async collectServantVoteAtDeadline() {
    const did = this.otmc.did.didDoc_.id;
    if(this.trace0) {
      console.log('MqttEncryptECDH::collectServantVoteAtDeadline::did=<',did,'>');
    }
    const self = this;
    const filter1 = {
      did:did,
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::collectServantVoteAtDeadline::filter1=:<',filter1,'>');
    }
    const servantVotes = await this.db.servantVote.where(filter1).and((vote)=>{
      return self.filterOutTimeIsssed_(vote,iConstRevoteMilliSeconds);
    }).toArray();
    if(this.trace0) {
      console.log('MqttEncryptECDH::collectServantVoteAtDeadline::servantVotes=<',servantVotes,'>');
    }
    const result = {};
    let nonceMax = 0.0;
    let nodeIdOfMax = ''; 
    for(const servantVote of servantVotes ) {
      if(this.trace0) {
        console.log('MqttEncryptECDH::collectServantVoteAtDeadline::servantVote=<',servantVote,'>');
      }
      if(servantVote.nonce > nonceMax) {
        nonceMax = servantVote.nonce;
        nodeIdOfMax = servantVote.nodeId;
      }
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::collectServantVoteAtDeadline::nonceMax=<',nonceMax,'>');
      console.log('MqttEncryptECDH::collectServantVoteAtDeadline::nodeIdOfMax=<',nodeIdOfMax,'>');
    }
    if(nodeIdOfMax === this.auth.address()) {
      result.servant = true;
    } else {
      result.servant = false;
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::collectServantVoteAtDeadline::result=<',result,'>');
    }
    return result;
  }


  async voteServant(did) {
    if(this.trace0) {
      console.log('MqttEncryptECDH::voteServant::did=<',did,'>');
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::voteServant::did=<',did,'>');
    }
    const filter = {
      did:did,
      nodeId:this.auth.address()
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::voteServant::filter=<',filter,'>');
    }
    const servantVotes = await this.db.servantVote.where(filter).sortBy('issuedDate');
    if(this.trace0) {
      console.log('MqttEncryptECDH::voteServant::servantVotes=<',servantVotes,'>');
    }
    if(servantVotes && servantVotes.length >0) {
      const lastVote = servantVotes[servantVotes.length - 1];
      if(this.trace0) {
        console.log('MqttEncryptECDH::voteServant::lastVote=<',lastVote,'>');
      }
      const issuedDate = new Date(lastVote.issuedDate);
      const now = new Date();
      const diff = now - issuedDate;
      if(diff < iConstRevoteMilliSeconds) {
        if(this.trace0) {
          console.log('MqttEncryptECDH::voteServant::lastVote=<',lastVote,'>');
        }
        return lastVote;
      } else {
        lastVote.nonce = Math.random();
        lastVote.issuedDate = (new Date()).toLocaleString();
        if(this.trace0) {
          console.log('MqttEncryptECDH::voteServant::lastVote=<',lastVote,'>');
        }
        const updateReult = await this.db.servantVote.update(lastVote.autoId,lastVote);
        if(this.trace0) {
          console.log('MqttEncryptECDH::voteServant::updateReult=<',updateReult,'>');
        }
        return lastVote;
      }
    }
    // create a new vote.
    const storeVote = {
      did:did,
      nodeId:this.auth.address(),
      issuedDate:(new Date()).toLocaleString(),
      expireDate:null,
      nonce:Math.random(),
    }
    const storeReult = await this.db.servantVote.put(storeVote);
    if(this.trace0) {
      console.log('MqttEncryptECDH::voteServant::storeReult=<',storeReult,'>');
    }
    return storeVote;
  }
  async collectRemoteVoteServant(remoteVoteServant) {
    if(this.trace0) {
      console.log('MqttEncryptECDH::collectRemoteVoteServant::remoteVoteServant=<',remoteVoteServant,'>');
    }
    delete remoteVoteServant.autoId;
    const filter = {
      did:remoteVoteServant.did,
      nodeId:remoteVoteServant.nodeId
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::collectRemoteVoteServant::filter=<',filter,'>');
    }
    const servantVoteHint = await this.db.servantVote.where(filter).first();
    if(this.trace0) {
      console.log('MqttEncryptECDH::collectRemoteVoteServant::servantVoteHint=<',servantVoteHint,'>');
    }
    if(servantVoteHint) {
      const updateReult = await this.db.servantVote.update(servantVoteHint.autoId,remoteVoteServant);
      if(this.trace0) {
        console.log('MqttEncryptECDH::collectRemoteVoteServant::updateReult=<',updateReult,'>');
      }      
    } else {
      const putReult = await this.db.servantVote.put(remoteVoteServant);
      if(this.trace0) {
        console.log('MqttEncryptECDH::collectRemoteVoteServant::putReult=<',putReult,'>');
      }
    }
  }

  async updateAnnouncementRemoteServant(remoteVoteServantAnnouncement) {
    if(this.trace0) {
      console.log('MqttEncryptECDH::updateAnnouncementRemoteServant::remoteVoteServantAnnouncement=<',remoteVoteServantAnnouncement,'>');
    }
    for(const remoteVoteServant of remoteVoteServantAnnouncement) {
      await this.collectRemoteVoteServant(remoteVoteServant);
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
      secretOfTeamSpace: '++autoId,did,secretId,issuedDate,expireDate',
    });
    this.db.version(this.version).stores({
      servantVote: '++autoId,did,nodeId,issuedDate,expireDate,nonce',
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
      createdDate:(new Date()).toLocaleString(),
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
  
  async storeSharedKeySecretOfSpace_(sharedKeyOfTeamSpace) {
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace_::sharedKeyOfTeamSpace=<',sharedKeyOfTeamSpace,'>');
    }
    const secretId = this.util.calcAddress(sharedKeyOfTeamSpace.secretBase64);
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace_::secretId=<',secretId,'>');
    }
    const filter = {
      did:sharedKeyOfTeamSpace.did,
      secretId:secretId,
      issuedDate:sharedKeyOfTeamSpace.issuedDate,
      expireDate:sharedKeyOfTeamSpace.expireDate,
      secretBase64:sharedKeyOfTeamSpace.secretBase64
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace_::filter=<',filter,'>');
    }
    let hitnSecret = await this.db.secretOfTeamSpace.where(filter).first();
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace_::hitnSecret=<',hitnSecret,'>');
    }
    if(hitnSecret) {
      return;
    }
    const secret = {
      did:sharedKeyOfTeamSpace.did,
      secretId:secretId,
      secretBase64:sharedKeyOfTeamSpace.secretBase64,
      issuedDate:sharedKeyOfTeamSpace.issuedDate,
      expireDate:sharedKeyOfTeamSpace.expireDate
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace_::secret=<',secret,'>');
    }
    const secretResult = await this.db.secretOfTeamSpace.put(secret);
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace_::secretResult=<',secretResult,'>');
    }
  }
  filterOutTimeIsssed_(storeData,deadLine) {
    const issuedDate = new Date(storeData.issuedDate);
    const now = new Date();
    const diff = now - issuedDate;
    if(diff < deadLine) {
      return true;
    } else {
      return false;
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

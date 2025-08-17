import Dexie from 'dexie';
import { StoreKey } from './otmc.const.js';
import { base64 } from '@scure/base';

import { StoreNodeWrapper } from './otmc.store.node.wrapper.js';
const isNode = typeof global !== 'undefined' && typeof window === 'undefined';

const iConstSharedKeyRegenMiliSec = 1000 * 60 * 60;
//const iConstSharedKeyRegenMiliSec = 1000 * 5;
const iConstIssueMilliSeconds = 1000 * 60 * 60;
//const iConstIssueMilliSeconds = 1000 * 5;


const iConstLastTopSharedKey = 5;


export class MqttEncryptECDH {
  constructor(otmc,auth,base32,util) {
    this.version = '1.0';
    this.trace0 = true;
    this.trace1 = true;
    this.trace2 = false;
    this.trace = true;
    this.debug = true;
    this.otmc = otmc;
    this.auth = auth;
    this.base32 = base32;
    this.util = util;
    this.config = this.otmc.config;
    this.initDB_();
    if(this.trace0) {
      console.log('MqttEncryptECDH::constructor::this.otmc=:<',this.otmc,'>');
    }
    this.teamSharedKeys = {};
    this.teamTopSharedKey = {};
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
    if(this.trace2) {
      console.log('MqttEncryptECDH::loadMemeberPubKey::this.otmc=:<',this.otmc,'>');
      console.log('MqttEncryptECDH::loadMemeberPubKey::this.otmc.did=:<',this.otmc.did,'>');
    }
    if(this.trace0) {
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
    const teamSharedKeys11 = await this.db.secretOfTeamSpace.where(filter)
    .and((secret)=>{
      return self.filterOutTimeIsssed_(secret,iConstSharedKeyRegenMiliSec);
    }).toArray();
    if(this.trace0) {
      console.log('MqttEncryptECDH::loadSharedKeyOfTeamSpace::teamSharedKeys11=<',teamSharedKeys11,'>');
    }
    const teamSharedKeys1 = teamSharedKeys11.sort((a, b) => new Date(a.issuedDate) - new Date(b.issuedDate));
    if(this.trace0) {
      console.log('MqttEncryptECDH::loadSharedKeyOfTeamSpace::teamSharedKeys1=<',teamSharedKeys1,'>');
    }
    const teamSharedKeys = teamSharedKeys1.toReversed();;
    if(this.trace0) {
      console.log('MqttEncryptECDH::loadSharedKeyOfTeamSpace::teamSharedKeys=<',teamSharedKeys,'>');
    }
    if(teamSharedKeys.length < 1) {
      console.log('MqttEncryptECDH::loadSharedKeyOfTeamSpace::teamSharedKeys is empty');
      return;
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
  async trySyncSharedKeysOfTeamSpace() {
    const did = this.otmc.did.didDoc_.id;
    if(this.trace0) {
      console.log('MqttEncryptECDH::trySyncSharedKeysOfTeamSpace::did=:<',did,'>');
    }
   const filter = {
      did:did,
    }
    const self = this;
    const teamSharedKeys11 = await this.db.secretOfTeamSpace.where(filter)
    .and((secret)=>{
      return self.filterOutTimeIsssed_(secret,iConstSharedKeyRegenMiliSec);
    }).toArray();
    if(this.trace0) {
      console.log('MqttEncryptECDH::trySyncSharedKeysOfTeamSpace::teamSharedKeys11=<',teamSharedKeys11,'>');
    }
    const teamSharedKeys1 = teamSharedKeys11.sort((a, b) => new Date(a.issuedDate) - new Date(b.issuedDate));
    if(this.trace0) {
      console.log('MqttEncryptECDH::trySyncSharedKeysOfTeamSpace::teamSharedKeys1=<',teamSharedKeys1,'>');
    }
    const teamSharedKeys = teamSharedKeys1.toReversed();;
    if(this.trace0) {
      console.log('MqttEncryptECDH::trySyncSharedKeysOfTeamSpace::teamSharedKeys=<',teamSharedKeys,'>');
    }
    if(teamSharedKeys.length < 1) {
      return {
        noSpaceSecret:true,
      }
    }
    else {
      return {
        noSpaceSecret:false,
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
        let hintSecret = await this.db.secretOfNode.where(filter).first();
        if(this.trace0) {
          console.log('MqttEncryptECDH::calcSharedKeysOfNode::hintSecret=<',hintSecret,'>');
        }
        if(hintSecret) {
          continue;
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
        const secretResult = await this.db.secretOfNode.put(secret);
        if(this.trace0) {
          console.log('MqttEncryptECDH::calcSharedKeysOfNode::secretResult=<',secretResult,'>');
        }
        if(isNode) {
          await this.wrapper.exportData();
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
    let hintSecretTeam = await this.db.secretOfTeamSpace.where(filter).first();
    if(this.trace0) {
      console.log('MqttEncryptECDH::prepareSharedKeysOfTeamSpace::hintSecretTeam=<',hintSecretTeam,'>');
    }
    if(hintSecretTeam) {
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
      expireDate:null,
      owner:this.auth.address(),
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::prepareSharedKeysOfTeamSpace::secret=<',secret,'>');
    }
    const secretResult = await this.db.secretOfTeamSpace.put(secret);
    if(this.trace0) {
      console.log('MqttEncryptECDH::prepareSharedKeysOfTeamSpace::secretResult=<',secretResult,'>');
    }
    if(isNode) {
      await this.wrapper.exportData();
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
    if(isNode) {
      await this.wrapper.exportData();
    }
    await this.loadMemeberPubKey();
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
    if(this.trace0) {
      console.log('MqttEncryptECDH::encryptData4TeamSpace::this.teamTopSharedKey=<',this.teamTopSharedKey,'>');
    }
    let teamSharedKeyPair = this.teamTopSharedKey[did];
    if(this.trace0) {
      console.log('MqttEncryptECDH::encryptData4TeamSpace::teamSharedKeyPair=<',teamSharedKeyPair,'>');
    }
    if(Object.keys(teamSharedKeyPair).length === 0) {
      this.loadSharedKeyOfTeamSpace();
      teamSharedKeyPair = this.teamTopSharedKey[did];
    }
    if(!teamSharedKeyPair) {
      // TODO:
      console.log('MqttEncryptECDH::encryptData4TeamSpace::teamSharedKeyPair is null');
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
    if(this.trace0) {
      console.log('MqttEncryptECDH::decryptData4TeamSpace::teamSharedKey=<',teamSharedKey,'>');
    }
    if(!teamSharedKey) {
      this.loadSharedKeyOfTeamSpace();
      teamSharedKey = this.teamSharedKeys[did];
      if(!teamSharedKey) {
        // TODO:
        if(this.trace0) {
          console.log('MqttEncryptECDH::decryptData4TeamSpace::teamSharedKey=<',teamSharedKey,'>');
        }
        return {keyMiss:true};
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
      return {keyMiss:true};
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
    return {decrypt:decryptedMessage};
  }


  async createUnicastMessage4SharedKeysOfTeamSpace(secretId) {
    const did = this.otmc.did.didDoc_.id;
    if(this.trace0) {
      console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::did=:<',did,'>');
    }
    const filter = {
      did:did
    };
    if(secretId) {
      filter.secretId = secretId;
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::filter=:<',filter,'>');
    }    
    const teamSharedKeys1 = await this.db.secretOfTeamSpace.where(filter).toArray();
    const teamSharedKeys = teamSharedKeys1.sort((a, b) => new Date(a.issuedDate) - new Date(b.issuedDate));
    if(this.trace0) {
      console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::teamSharedKeys=<',teamSharedKeys,'>');
    }
    let lastTeamSharedKeys = teamSharedKeys;
    if(!secretId) {
      lastTeamSharedKeys = teamSharedKeys.slice(Math.max(teamSharedKeys.length - iConstLastTopSharedKey, 1));
    }
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
      const sharedSecret = await crypto.subtle.deriveBits(
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
      const encryptRaw = await crypto.subtle.importKey("raw", sharedSecret, {name: "AES-GCM"}, true, ["encrypt"]);
      if(this.trace0) {
        console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::encryptRaw=<',encryptRaw,'>');
      }
      const iv = crypto.getRandomValues(new Uint8Array(16));
      if(this.trace0) {
        console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::iv=<',iv,'>');
      }
      const encoded = new TextEncoder().encode(JSON.stringify(lastTeamSharedKeys));
      if(this.trace0) {
        console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::encoded=<',encoded,'>');
      }
      const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv },encryptRaw,encoded);
      if(this.trace0) {
        console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::ciphertext=<',ciphertext,'>');
      }
      const decryptRaw = await crypto.subtle.importKey("raw", sharedSecret, {name: "AES-GCM"}, true, ["decrypt"]);
      if(this.trace0) {
        console.log('MqttEncryptECDH::createUnicastMessage4SharedKeysOfTeamSpace::decryptRaw=<',decryptRaw,'>');
      }
      const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv },decryptRaw,ciphertext);
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
      return {nodeMissMatch:true};
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace::this.memberPublicKeys=<',this.memberPublicKeys,'>');
    }
    const memberPubKeys = this.memberPublicKeys[did];
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace::memberPubKeys=<',memberPubKeys,'>');
    }
    const nodePublicKey = memberPubKeys[secretMsg.srcNodeId];
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace::nodePublicKey=<',nodePublicKey,'>');
    }
    if(!nodePublicKey) {
      // request publicKey.
      await this.storeSharedKeySecretOfSpace2Cache_(secretMsg);
      return {nodeKeyMiss:true,nodeId:secretMsg.srcNodeId};
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
    const encryptRaw = await crypto.subtle.importKey("raw", sharedSecret, {name: "AES-GCM"}, true, ["decrypt"]);
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
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv },encryptRaw,ciphertext);
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
    return true;
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
    if(isNode) {
      await this.wrapper.exportData();
    }
  }




  initDB_() {
    if(isNode) {
      StoreNodeWrapper.addIndexedDBDependencies(Dexie);
    }
    this.db = new Dexie(StoreKey.secret.mqtt.encrypt.channel.dbName);
    this.db.version(this.version).stores({
      ecdh: '++autoId,did,nodeId,createdDate,pubBase64,privBase64',
    });
    this.db.version(this.version).stores({
      secretOfNode: '++autoId,did,myNodeId,remoteNodeId,secretBase64,issuedDate,expireDate',
    });
    this.db.version(this.version).stores({
      secretOfTeamSpace: '++autoId,did,secretId,issuedDate,expireDate',
    });
    this.db.version(this.version).stores({
      cacheEncryptedMsgOfTeamSpace: '++autoId,distNodeId,encrypt,iv,srcNodeId,keyId',
    }); 
    if(isNode) {
      this.wrapper = new StoreNodeWrapper(this.db,this.config);
      this.wrapper.importData();
    }
  }

  async tryCreateMyECKey_(did,nodeId) {
    if(this.trace0) {
      console.log('MqttEncryptECDH::tryCreateMyECKey_::this.creating_=:<',this.creating_,'>');
    }
    if(this.creating_)  {
      return;
    }
    this.creating_ = true;
    const myKeyPair = await crypto.subtle.generateKey(
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
    const myPublicKey = await crypto.subtle.exportKey('jwk',myKeyPair.publicKey);
    if(this.trace0) {
      console.log('MqttEncryptECDH::tryCreateMyECKey_::myPublicKey=:<',myPublicKey,'>');
    }
    const myPublicKeyBase64 = base64Encode(JSON.stringify(myPublicKey));
    if(this.trace0) {
      console.log('MqttEncryptECDH::tryCreateMyECKey_::myPublicKeyBase64=:<',myPublicKeyBase64,'>');
    }
    const myPrivateKey = await crypto.subtle.exportKey('jwk',myKeyPair.privateKey);
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
    if(isNode) {
      await this.wrapper.exportData();
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
    if(secretId !== sharedKeyOfTeamSpace.secretId) {
      if(this.debug) {
        console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace_::secretId=<',secretId,'>');
        console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace_::v=<',sharedKeyOfTeamSpace.secretId,'>');
      }     
      return;
    }
    const filter = {
      did:sharedKeyOfTeamSpace.did,
      secretId:secretId,
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace_::filter=<',filter,'>');
    }
    let hintSecret = await this.db.secretOfTeamSpace.where(filter).first();
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace_::hintSecret=<',hintSecret,'>');
    }
    if(hintSecret) {
      if(this.trace0) {
        console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace_::hintSecret=<',hintSecret,'>');
      }
      return;
    }
    const secret = {
      did:sharedKeyOfTeamSpace.did,
      secretId:secretId,
      secretBase64:sharedKeyOfTeamSpace.secretBase64,
      issuedDate:sharedKeyOfTeamSpace.issuedDate,
      expireDate:sharedKeyOfTeamSpace.expireDate,
      owner:sharedKeyOfTeamSpace.owner
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace_::secret=<',secret,'>');
    }
    const secretResult = await this.db.secretOfTeamSpace.put(secret);
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace_::secretResult=<',secretResult,'>');
    }
    if(isNode) {
      await this.wrapper.exportData();
    }
  }
  async storeEncryptedCacheSharedKeysOfTeamSpace(mqttMsg) {
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeEncryptedCacheSharedKeysOfTeamSpace::mqttMsg=<',mqttMsg,'>');
    }
    const distNodeId = this.auth.address();
    const encryptedCache = {
      distNodeId:distNodeId,
      srcNodeId:mqttMsg.auth_address,
      encryptedBase64:mqttMsg.payload.encryptedBase64,
      ivBase64:mqttMsg.payload.ivBase64,
      keyId:mqttMsg.payload.keyId,
    };
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeEncryptedCacheSharedKeysOfTeamSpace::encryptedCache=<',encryptedCache,'>');
    }
    const filter = {
      keyId:mqttMsg.payload.keyId,
      srcNodeId:mqttMsg.payload.srcNodeId,
      distNodeId:distNodeId,
    };
    let hintCached = await this.db.cacheEncryptedMsgOfTeamSpace.where(filter).first();
    if(hintCached) {
      return;
    }
    const encryptedCacheResult = await this.db.cacheEncryptedMsgOfTeamSpace.put(encryptedCache);
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeEncryptedCacheSharedKeysOfTeamSpace::encryptedCacheResult=<',encryptedCacheResult,'>');
    }
    if(isNode) {
      await this.wrapper.exportData();
    }
  }
  async getEncryptedCacheMsg() {
    const cachedMsg = await this.db.cacheEncryptedMsgOfTeamSpace
    .filter((msg) => {
      return this.filterOutTimeIsssed_(msg,iConstSharedKeyRegenMiliSec);
    })
    .toArray();
    if(this.trace0) {
      console.log('MqttEncryptECDH::getEncryptedCacheMsg::cachedMsg=<',cachedMsg,'>');
    }
    const cacheMqttMsg = [];
    for(const msg of cachedMsg) {
      const mqttMsg = {
        auth_address:msg.srcNodeId,
        payload:{
          encryptedBase64:msg.encryptedBase64,
          ivBase64:msg.ivBase64,
          keyId:msg.keyId,
        }
      };
      cacheMqttMsg.push(mqttMsg);
    }
    if(this.trace0) {
      console.log('MqttEncryptECDH::getEncryptedCacheMsg::cacheMqttMsg=<',cacheMqttMsg,'>');
    }
    return cacheMqttMsg;
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
  async storeSharedKeySecretOfSpace2Cache_(secretMsg) {
    if(this.trace0) {
      console.log('MqttEncryptECDH::storeSharedKeySecretOfSpace2Cache_::secretMsg=<',secretMsg,'>');
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

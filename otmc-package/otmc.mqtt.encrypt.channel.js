import Dexie from 'dexie';
import { StoreKey } from './otmc.const.js';
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
}

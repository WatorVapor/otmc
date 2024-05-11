import fs from 'fs';
import nacl from 'tweetnacl-es6';
import  { Base32 } from 'otmc-client/edcrypto/base32';
console.log('::::Base32=<',Base32,'>');
import  { EdUtil } from 'otmc-client/edcrypto/edutils';
console.log('::::EdUtil=<',EdUtil,'>');
import  { EdDsaKey } from 'otmc-client/edcrypto/edkey';
const base64 = new Base32();
const util = new EdUtil(base64,nacl);
const edkey = new EdDsaKey(util);
const addressPrefix = 'otm';
fs.mkdirSync('../.store/secretKey', { recursive: true },);

const secretKeyPaths = {
  auth: '../.store/secretKey/auth.json',
  recovery:'../.store/secretKey/recovery.json',
};
const secretKeyPath = '../.store/secretKey.json';
console.log('::::edkey=<',edkey,'>');
const iConstReprotInMilliSec = 10 * 1000;

(async ()=> {
  let lastDate = new Date();
  for(const pathIndex in secretKeyPaths) {
    console.log('::::pathIndex=<',pathIndex,'>');
    const keyPath = secretKeyPaths[pathIndex];
    console.log('::::keyPath=<',keyPath,'>');
    while(true) {
      const secretKey = edkey.createKey();
      if(secretKey.idOfKey.startsWith(addressPrefix)) {
        console.log('::mining::secretKey=<',secretKey,'>');
        fs.writeFileSync(keyPath, JSON.stringify(secretKey,undefined,2));
        break
      } else {
        const now = new Date();
        const escape_ms = now - lastDate;
        if(escape_ms >= iConstReprotInMilliSec) {
          console.log('::mining::secretKey.idOfKey=<',secretKey.idOfKey,'>');
          lastDate = now;
        }
      }
    }
  }
})();



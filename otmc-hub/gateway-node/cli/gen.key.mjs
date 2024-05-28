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

const gConf = {};
try {
  const configPath = '../config.json';
  const configText = fs.readFileSync(configPath);
  const config = JSON.parse(configText);
  console.log('::::config=<',config,'>');
  gConf.store = config.store;
  fs.mkdirSync(`${gConf.store}/secretKey`, { recursive: true },);
} catch ( err ) {
  console.error('::::err=<',err,'>');
}


const secretKeyPaths = {
  auth: `${gConf.store}/secretKey/auth.json`,
  recovery: `${gConf.store}//secretKey/recovery.json`,
};
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



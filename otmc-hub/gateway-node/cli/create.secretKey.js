const EDDSAKey = require('../edcrypto/edkey.js');
const fs = require('fs');
const edkey = new EDDSAKey();
const addressPrefix = 'otm';
fs.mkdirSync('../.store', { recursive: true },);
const secretKeyPaht = '../.store/secretKey.json';
console.log('::::edkey=<',edkey,'>');
const iConstMinInSec = 60 * 1000;
(async ()=> {
  let lastDate = new Date();
  while(true) {
    const secretKey = await edkey.createKey();
    if(secretKey.idOfKey.startsWith(addressPrefix)) {
      console.log('::mining::secretKey=<',secretKey,'>');
      fs.writeFileSync(secretKeyPaht, JSON.stringify(secretKey,undefined,2));
      break
    } else {
      const now = new Date();
      const escape_ms = now - lastDate;
      if(escape_ms >= iConstMinInSec) {
        console.log('::mining::secretKey.idOfKey=<',secretKey.idOfKey,'>');
        lastDate = now;
      }
    }
  }  
})();



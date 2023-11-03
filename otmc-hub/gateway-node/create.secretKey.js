const EDDSAKey = require('./edcrypto/edkey.js');
const fs = require('fs');
const edkey = new EDDSAKey();
const secretKeyPaht = 'secretKey.json';
console.log('::::edkey=<',edkey,'>');
(async ()=> {
  const secretKey = await edkey.createKey();
  console.log('::::secretKey=<',secretKey,'>');
  fs.writeFileSync(secretKeyPaht, JSON.stringify(secretKey,undefined,2));
})();


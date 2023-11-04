const fs = require('fs');
const EDAuth = require('../edcrypto/edauth.js');
const auth = new EDAuth();
console.log('::::auth=<',auth,'>');
const DidCrypto = require('../did/cryptography.js');
console.log('::::DidCrypto=<',DidCrypto,'>');
const DidDoc = require('../did/document.js');
console.log('::::DidDoc=<',DidDoc,'>');
const secretKeyPath = '../.store//secretKey/auth.json';
const secretText = fs.readFileSync(secretKeyPath);
const secretKey = JSON.parse(secretText);
console.log('::::secretKey=<',secretKey,'>');
const secretRecoveryKeyPath = '../.store//secretKey/recovery.json';
const secretRecoveryText = fs.readFileSync(secretRecoveryKeyPath);
const secretRecoveryKey = JSON.parse(secretRecoveryText);
console.log('::::secretRecoveryKey=<',secretRecoveryKey,'>');

(async ()=> {
  const seed = new DidDoc.SeedDocument();
  console.log('::::seed=<',seed,'>');
  const seedDoc = seed.document();
  console.log('::::seedDoc=<',seedDoc,'>');
})();



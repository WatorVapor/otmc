const fs = require('fs');
const EdAuth = require('../edcrypto/edauth.js');
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


const primaryAuth = new EdAuth(secretKey);
const recoveryAuth = new EdAuth(secretRecoveryKey);

fs.mkdirSync('../.store/didteam/', { recursive: true },);
const strConstTopDidDocPath = '../.store/didteam/TopDidDoc.json';
(async ()=> {
  const seed = new DidDoc.SeedDocument(primaryAuth,recoveryAuth);
  console.log('::::seed=<',seed,'>');
  const seedDoc = seed.document();
  console.log('::::seedDoc=<',seedDoc,'>');
  fs.writeFileSync(strConstTopDidDocPath, JSON.stringify(seedDoc,undefined,2));
})();



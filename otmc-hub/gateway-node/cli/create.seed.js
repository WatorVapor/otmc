const fs = require('fs');
const EDAuth = require('../edcrypto/edauth.js');
const auth = new EDAuth();
console.log('::::auth=<',auth,'>');
const DidDoc = require('../did/document.js');
console.log('::::DidDoc=<',DidDoc,'>');
const secretKeyPath = '../.store/secretKey.json';
const secretText = fs.readFileSync(secretKeyPath);
const secretKey = JSON.parse(secretText);
console.log('::::secretKey=<',secretKey,'>');
(async ()=> {
  const seed = new DidDoc.SeedDocument();
  console.log('::::seed=<',seed,'>');
})();



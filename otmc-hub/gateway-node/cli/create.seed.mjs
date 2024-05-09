const fs = require('fs');
const execSync = require('child_process').execSync
const EdAuth = require('../edcrypto/edauth.js');
const DidDoc = require('../did/document.js');
console.log('::::DidDoc=<',DidDoc,'>');
const {Manifest} = require('../did/manifest.js');
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

const strConstDidPath = `../.store/didteam/${secretKey.idOfKey}`

fs.mkdirSync(strConstDidPath, { recursive: true },);
(async ()=> {
  const seed = new DidDoc.SeedDocument(primaryAuth,recoveryAuth);
  console.log('::::seed=<',seed,'>');
  const seedDoc = seed.document();
  console.log('::::seedDoc=<',seedDoc,'>');
  const manifest = Manifest.rule(seedDoc.id);
  const strConstTopDidDocPath = `${strConstDidPath}/seedDocument.json`;
  fs.writeFileSync(strConstTopDidDocPath, JSON.stringify(seedDoc,undefined,2));
  execSync(`cd ${strConstDidPath} && ln -sf ./seedDocument.json ./topDocument.json`);
  const strConstTopDidManifestPath = `${strConstDidPath}/manifest.json`;
  fs.writeFileSync(strConstTopDidManifestPath, JSON.stringify(manifest,undefined,2));
})();


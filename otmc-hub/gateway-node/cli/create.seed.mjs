import fs from 'fs';
import { execSync } from 'child_process';
import nacl from 'tweetnacl-es6';
import  { Base32 } from 'otmc-client/edcrypto/base32';
console.log('::::Base32=<',Base32,'>');
import  { EdUtil } from 'otmc-client/edcrypto/edutils';
console.log('::::EdUtil=<',EdUtil,'>');
import  { EdAuth } from 'otmc-client/edcrypto/edauth';
console.log('::::EdAuth=<',EdAuth,'>');
import { DIDSeedDocument } from 'otmc-client/did/document';
console.log('::::DIDSeedDocument=<',DIDSeedDocument,'>');
import { DIDManifest } from 'otmc-client/did/manifest';
console.log('::::DIDManifest=<',DIDManifest,'>');



const secretKeyPath = '../.store/secretKey/auth.json';
const secretText = fs.readFileSync(secretKeyPath);
const secretKey = JSON.parse(secretText);
console.log('::::secretKey=<',secretKey,'>');
const secretRecoveryKeyPath = '../.store/secretKey/recovery.json';
const secretRecoveryText = fs.readFileSync(secretRecoveryKeyPath);
const secretRecoveryKey = JSON.parse(secretRecoveryText);
console.log('::::secretRecoveryKey=<',secretRecoveryKey,'>');


const base64 = new Base32();
const util = new EdUtil(base64,nacl);
const primaryAuth = new EdAuth(secretKey,util);
const recoveryAuth = new EdAuth(secretRecoveryKey,util);

const strConstDidPath = `../.store/didteam/${secretKey.idOfKey}`

fs.mkdirSync(strConstDidPath, { recursive: true },);
(async ()=> {
  const seed = new DIDSeedDocument(primaryAuth,recoveryAuth);
  console.log('::::seed=<',seed,'>');
  const seedDoc = seed.document();
  console.log('::::seedDoc=<',seedDoc,'>');
  const manifest = DIDManifest.ruleChain(seedDoc.id);
  const strConstTopDidDocPath = `${strConstDidPath}/seedDocument.json`;
  fs.writeFileSync(strConstTopDidDocPath, JSON.stringify(seedDoc,undefined,2));
  execSync(`cd ${strConstDidPath} && cp -f ./seedDocument.json ./topDocument.json`);
  const strConstTopDidManifestPath = `${strConstDidPath}/seedManifest.json`;
  fs.writeFileSync(strConstTopDidManifestPath, JSON.stringify(manifest,undefined,2));
  execSync(`cd ${strConstDidPath} && cp -f ./seedManifest.json ./topManifest.json`);
})();


//const fs = require('fs');
import fs from 'fs';
import { parseArgs } from 'node:util';
import { execSync } from 'child_process';

import nacl from 'tweetnacl-es6/nacl-fast-es.js';
import  { Base32 } from 'otmc-client/edcrypto/base32.js';
console.log('::::Base32=<',Base32,'>');
import  { EdUtil } from 'otmc-client/edcrypto/edutils.js';
console.log('::::EdUtil=<',EdUtil,'>');
import  { EdAuth } from 'otmc-client/edcrypto/edauth.js';
console.log('::::EdAuth=<',EdAuth,'>');
import { DIDGuestDocument } from 'otmc-client/did/document.js';
console.log('::::DIDGuestDocument=<',DIDGuestDocument,'>');
import { DIDManifest } from 'otmc-client/did/manifest.js';
console.log('::::DIDManifest=<',DIDManifest,'>');

const secretKeyPath = '../.store//secretKey/auth.json';
const secretText = fs.readFileSync(secretKeyPath);
const secretKey = JSON.parse(secretText);
console.log('::::secretKey=<',secretKey,'>');
const secretRecoveryKeyPath = '../.store//secretKey/recovery.json';
const secretRecoveryText = fs.readFileSync(secretRecoveryKeyPath);
const secretRecoveryKey = JSON.parse(secretRecoveryText);
console.log('::::secretRecoveryKey=<',secretRecoveryKey,'>');


const base64 = new Base32();
const util = new EdUtil(base64,nacl);
const primaryAuth = new EdAuth(secretKey,util);
const recoveryAuth = new EdAuth(secretRecoveryKey,util);

const strConstDidPath = `../.store/didteam/${secretKey.idOfKey}`

fs.mkdirSync(strConstDidPath, { recursive: true },);

const options = {
  address: {
    type: "string",
    short: "a",
    multiple: false,
  },
};

const args = process.argv.slice(2);
const parsedArgs = parseArgs({ options, args });
console.log('::::parsedArgs=<',parsedArgs,'>');

(async ()=> {
  /*
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
  */
})();


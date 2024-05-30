import fs from 'fs';
import { execSync } from 'child_process';
import { DIDSeedDocument } from 'otmc-client/did/document';
console.log('::::DIDSeedDocument=<',DIDSeedDocument,'>');
import { DIDManifest } from 'otmc-client/did/manifest';
console.log('::::DIDManifest=<',DIDManifest,'>');

import {
  values,
  strConstDidPath,
  primaryAuth,
  recoveryAuth
} from '../cli.parser.mjs';
console.log('::create.seed::strConstDidPath=<',strConstDidPath,'>');
console.log('::create.seed::strConstDidPath=<',primaryAuth,'>');
console.log('::create.seed::recoveryAuth=<',recoveryAuth,'>');

/*
const gConf = {};
try {
  const configPath = '../config.json';
  const configText = fs.readFileSync(configPath);
  const config = JSON.parse(configText);
  console.log('::::config=<',config,'>');
  gConf.store = config.store;


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

  fs.mkdirSync(strConstDidPath, { recursive: true });
} catch ( err ) {
  console.error('::::err=<',err,'>');
}

console.log('::::gConf=<',gConf,'>');
*/


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


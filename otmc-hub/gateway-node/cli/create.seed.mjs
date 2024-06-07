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

(async ()=> {
  const seed = new DIDSeedDocument(primaryAuth,recoveryAuth);
  console.log('::::seed=<',seed,'>');
  const seedDoc = seed.document();
  console.log('::::seedDoc=<',seedDoc,'>');
  const manifest = DIDManifest.ruleChainGuestOpen(seedDoc.id);
  const strConstTopDidDocPath = `${strConstDidPath}/seedDocument.json`;
  fs.writeFileSync(strConstTopDidDocPath, JSON.stringify(seedDoc,undefined,2));
  execSync(`cd ${strConstDidPath} && cp -f ./seedDocument.json ./topDocument.json`);
  const strConstTopDidManifestPath = `${strConstDidPath}/seedManifest.json`;
  fs.writeFileSync(strConstTopDidManifestPath, JSON.stringify(manifest,undefined,2));
  execSync(`cd ${strConstDidPath} && cp -f ./seedManifest.json ./topManifest.json`);
})();


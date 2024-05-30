import fs from 'fs';
import { parseArgs } from 'node:util';
import { execSync } from 'child_process';
import { DIDGuestCapabilityDocument } from 'otmc-client/did/document';
console.log('::::DIDGuestCapabilityDocument=<',DIDGuestCapabilityDocument,'>');

import {
  values,
  guestAddress,
  strConstDidPath,
  primaryAuth,
} from '../cli.parser.mjs';
console.log('::join.cap::guestAddress=<',guestAddress,'>');
console.log('::join.cap::strConstDidPath=<',strConstDidPath,'>');
console.log('::join.cap::strConstDidPath=<',primaryAuth,'>');

(async ()=> {
  const guest = new DIDGuestCapabilityDocument(values.address,primaryAuth);
  console.log('::::guest=<',guest,'>');
  const guestDoc = guest.document();
  console.log('::::guestDoc=<',guestDoc,'>');
  const strConstTopDidDocPath = `${strConstDidPath}/guestDocument.json`;
  fs.writeFileSync(strConstTopDidDocPath, JSON.stringify(guestDoc,undefined,2));
  execSync(`cd ${strConstDidPath} && cp -f ./guestDocument.json ./topDocument.json`);
})();



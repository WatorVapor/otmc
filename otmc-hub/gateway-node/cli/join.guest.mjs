import fs from 'fs';
import { parseArgs } from 'node:util';
import { execSync } from 'child_process';
import { DIDGuestGuestDocument } from 'otmc-client/did/document';
console.log('::::DIDGuestGuestDocument=<',DIDGuestGuestDocument,'>');

import {
  values,
  guestAddress,
  strConstDidPath,
  primaryAuth,
} from '../cli.parser.mjs';
console.log('::join.guest::guestAddress=<',guestAddress,'>');
console.log('::join.guest::strConstDidPath=<',strConstDidPath,'>');
console.log('::join.guest::strConstDidPath=<',primaryAuth,'>');

(async ()=> {
  const guest = new DIDGuestGuestDocument(values.address,primaryAuth);
  console.log('::::guest=<',guest,'>');
  const guestDoc = guest.document();
  console.log('::::guestDoc=<',guestDoc,'>');
  const strConstTopDidDocPath = `${strConstDidPath}/guestDocument.json`;
  fs.writeFileSync(strConstTopDidDocPath, JSON.stringify(guestDoc,undefined,2));
  execSync(`cd ${strConstDidPath} && cp -f ./guestDocument.json ./topDocument.json`);
})();



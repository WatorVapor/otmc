import fs from 'fs';
import { parseArgs } from 'node:util';
import { execSync } from 'child_process';
import { DIDGuestAuthDocument } from 'otmc-client/did/document';
console.log('::::DIDGuestAuthDocument=<',DIDGuestAuthDocument,'>');

import {
  values,
  guestAddress,
  strConstDidPath,
  primaryAuth,
} from '../cli.parser.mjs';
console.log('::join.auth::guestAddress=<',guestAddress,'>');
console.log('::join.auth::strConstDidPath=<',strConstDidPath,'>');
console.log('::join.auth::strConstDidPath=<',primaryAuth,'>');



(async ()=> {
  const guest = new DIDGuestAuthDocument(values.address,primaryAuth);
  console.log('::::guest=<',guest,'>');
  const guestDoc = guest.document();
  console.log('::::guestDoc=<',guestDoc,'>');
  const strConstTopDidDocPath = `${strConstDidPath}/guestDocument.json`;
  fs.writeFileSync(strConstTopDidDocPath, JSON.stringify(guestDoc,undefined,2));
  execSync(`cd ${strConstDidPath} && cp -f ./guestDocument.json ./topDocument.json`);
})();


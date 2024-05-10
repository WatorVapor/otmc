import fs from 'fs';
import { parseArgs } from 'node:util';
import { execSync } from 'child_process';
import nacl from 'tweetnacl-es6';
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


const options = {
  address: {
    type: "string",
    short: "a",
    multiple: false,
  },
};

const args = process.argv.slice(2);
const {
  values,
  positionals,
} = parseArgs({ options, args });
console.log('::::values=<',values,'>');
const guestAddress = values.address.replace('did:otmc:','');
const strConstDidPath = `../.store/didteam/${guestAddress}`
fs.mkdirSync(strConstDidPath, { recursive: true },);


(async ()=> {
  const guest = new DIDGuestDocument(values.address,primaryAuth);
  console.log('::::guest=<',guest,'>');
  const guestDoc = guest.document();
  console.log('::::guestDoc=<',guestDoc,'>');
  const strConstTopDidDocPath = `${strConstDidPath}/guestDocument.json`;
  fs.writeFileSync(strConstTopDidDocPath, JSON.stringify(guestDoc,undefined,2));
  execSync(`cd ${strConstDidPath} && ln -sf ./guestDocument.json ./topDocument.json`);
})();


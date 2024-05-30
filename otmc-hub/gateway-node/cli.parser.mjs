import fs from 'fs';
import { parseArgs } from 'node:util';
import { execSync } from 'child_process';
import nacl from 'tweetnacl-es6';
import  { Base32 } from 'otmc-client/edcrypto/base32';
console.log('::cli.parser::Base32=<',Base32,'>');
import  { EdUtil } from 'otmc-client/edcrypto/edutils';
console.log('::cli.parser::EdUtil=<',EdUtil,'>');
import  { EdAuth } from 'otmc-client/edcrypto/edauth';
console.log('::cli.parser::EdAuth=<',EdAuth,'>');

const gConf = {};
try {
  const configPath = '../config.json';
  const configText = fs.readFileSync(configPath);
  const config = JSON.parse(configText);
  console.log('::cli.parser::config=<',config,'>');
  gConf.store = config.store;
  fs.mkdirSync(`${gConf.store}/secretKey`, { recursive: true },);
} catch ( err ) {
  console.error('::cli.parser::err=<',err,'>');
}


const secretKeyPath = `${gConf.store}/secretKey/auth.json`;
const secretText = fs.readFileSync(secretKeyPath);
const secretKey = JSON.parse(secretText);
console.log('::cli.parser::secretKey=<',secretKey,'>');
const secretRecoveryKeyPath = `${gConf.store}/secretKey/recovery.json`;
const secretRecoveryText = fs.readFileSync(secretRecoveryKeyPath);
const secretRecoveryKey = JSON.parse(secretRecoveryText);
console.log('::cli.parser::secretRecoveryKey=<',secretRecoveryKey,'>');

const base64 = new Base32();
const util = new EdUtil(base64,nacl);
export const primaryAuth = new EdAuth(secretKey,util);
export const recoveryAuth = new EdAuth(secretRecoveryKey,util);


export const topTeamPath = `${gConf.store}/didteam/topTeam.json`;

const options = {
  address: {
    type: "string",
    short: "a",
    multiple: false,
  },
  target: {
    type: "string",
    short: "t",
    multiple: false,
  },  
};

const args = process.argv.slice(2);
export const {
  values,
  positionals,
} = parseArgs({ options, args });
console.log('::cli.parser::values=<',values,'>');
export const guestAddress = values.address ? values.address.replace('did:otmc:','') : '';
export const seedAddress = values.address ? '' : primaryAuth.address();
export const strConstDidPath = values.address ? `${gConf.store}/didteam/${guestAddress}`:`${gConf.store}/didteam/${seedAddress}`
fs.mkdirSync(strConstDidPath, { recursive: true },);

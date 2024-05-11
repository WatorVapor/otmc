import fs from 'fs';
//import * as Otmc from 'otmc-client';
import { Otmc } from '../../otmc-package/otmc.js';
console.log('::::Otmc=<',Otmc,'>');



/*
let secretKey = null;
try {
  const secretText = fs.readFileSync(secretKeyPath);
  secretKey = JSON.parse(secretText);
} catch ( err ) {
  console.log('::::err=<',err,'>');  
}
//console.log('::::secretKey=<',secretKey,'>');

let topDidDoc = null;
let didManifest = null;
try {
  const strConstTopDidDocPath = `./.store/didteam/${secretKey.idOfKey}/topDocument.json`;
  const topDidDocText = fs.readFileSync(strConstTopDidDocPath);
  topDidDoc = JSON.parse(topDidDocText);
  const strConstManifestPath = `./.store/didteam/${secretKey.idOfKey}/manifest.json`;
  const manifestText = fs.readFileSync(strConstManifestPath);
  didManifest = JSON.parse(manifestText);

} catch ( err ) {
  console.log('::::err=<',err,'>');
}
//console.log('::::topDidDoc=<',topDidDoc,'>');



let jwtCached = null;
try {
  fs.mkdirSync('./.store/mqtt/', { recursive: true });
  const jwtText = fs.readFileSync(strConstMqttJwtPath);
  jwtCached = JSON.parse(jwtText);
} catch ( err ) {
  console.log('::::err=<',err,'>');    
}
//console.log('::::jwtCached=<',jwtCached,'>');
*/

const authKeyPath = './.store/secretKey/auth.json';
const recoveryKeyPath = './.store/secretKey/recovery.json';

const documentHistoryPath = './.store/didteam/document.history';
const manifestHistoryPath = './.store/didteam/manifest.history';

const strConstMqttJwtPath = './.store/mqtt/jwt_cached.json';
const topTeamPath = './.store/didteam/topTeam.json';





const otmcConfig = {
  node:true,
  authKey:authKeyPath,
  recoveryKey:recoveryKeyPath,
  mqttJwt:strConstMqttJwtPath,
  docHistotry:documentHistoryPath,
  manifestHistotry:manifestHistoryPath,
}

try {
  const authKeyStr = fs.readFileSync(authKeyPath);
  const authKey = JSON.parse(authKeyStr);
  console.log('::::authKey=:<',authKey,'>');
  if(authKey&& authKey.idOfKey) {
    otmcConfig.topDoc = `./.store/didteam/${authKey.idOfKey}/topDocument.json`;
    otmcConfig.topManifest = `./.store/didteam/${authKey.idOfKey}/topManifest.json`;
    otmcConfig.invitation = `./.store/didteam/${authKey.idOfKey}/invitation.json`;
  }
} catch(err) {
  console.error('::::err=:<',err,'>');
}

try {
  const topTeamStr = fs.readFileSync(topTeamPath);
  const topTeam = JSON.parse(topTeamStr);
  console.log('::::topTeam=:<',topTeam,'>');
  if(topTeam&& topTeam.address) {
    otmcConfig.topDoc = `./.store/didteam/${topTeam.address}/topDocument.json`;
    otmcConfig.topManifest = `./.store/didteam/${topTeam.address}/topManifest.json`;
    otmcConfig.invitation = `./.store/didteam/${topTeam.address}/invitation.json`;
  }
} catch(err) {
  console.error('::::err=:<',err,'>');
}

console.log('::::otmcConfig=<',otmcConfig,'>');
const otmc = new Otmc(otmcConfig);
//console.log('::::otmc=<',otmc,'>');



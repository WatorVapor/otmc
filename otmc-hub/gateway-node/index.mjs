import fs from 'fs';

import { RedisRelay } from './redisRelay.mjs';
console.log('::::RedisRelay=<',RedisRelay,'>');

//import * as OtmcTeam from 'otmc-client';
import { OtmcTeam } from '../../otmc-package/otmc.team.js';
console.log('::::OtmcTeam=<',OtmcTeam,'>');


const gConf = {};
try {
  const configPath = './config.json';
  const configText = fs.readFileSync(configPath);
  const config = JSON.parse(configText);
  console.log('::::config=<',config,'>');
  gConf.store = config.store;
  fs.mkdirSync(`${gConf.store}/secretKey`, { recursive: true },);
} catch ( err ) {
  console.error('::::err=<',err,'>');
}

const authKeyPath = `${gConf.store}/secretKey/auth.json`;
const recoveryKeyPath = `${gConf.store}/secretKey/recovery.json`;

const documentHistoryPath = `${gConf.store}/didteam/document.history`;
const manifestHistoryPath = `${gConf.store}/didteam/manifest.history`;

fs.mkdirSync(`${gConf.store}/mqtt`, { recursive: true });
const strConstMqttJwtPath = `${gConf.store}/mqtt/jwt_cached.json`;
const topTeamPath = `${gConf.store}/didteam/topTeam.json`;


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
    otmcConfig.topDoc = `${gConf.store}/didteam/${authKey.idOfKey}/topDocument.json`;
    otmcConfig.topManifest = `${gConf.store}/didteam/${authKey.idOfKey}/topManifest.json`;
    otmcConfig.invitation = `${gConf.store}/didteam/${authKey.idOfKey}/invitation.json`;
  }
} catch(err) {
  console.error('::::err=:<',err,'>');
}

try {
  const topTeamStr = fs.readFileSync(topTeamPath);
  const topTeam = JSON.parse(topTeamStr);
  console.log('::::topTeam=:<',topTeam,'>');
  if(topTeam&& topTeam.address) {
    otmcConfig.topDoc = `${gConf.store}/didteam/${topTeam.address}/topDocument.json`;
    otmcConfig.topManifest = `${gConf.store}/didteam/${topTeam.address}/topManifest.json`;
    otmcConfig.invitation = `${gConf.store}/didteam/${topTeam.address}/invitation.json`;
  }
} catch(err) {
  console.error('::::err=:<',err,'>');
}

console.log('::::otmcConfig=<',otmcConfig,'>');
const otmcTeam = new OtmcTeam(otmcConfig);
//console.log('::::otmcTeam=<',otmcTeam,'>');

otmcTeam.on('otmc:mqtt:all',(mqttMsg)=>{
  console.log('::otmc.mqtt.all::mqttMsg=<',mqttMsg,'>');
});

const redis = new RedisRelay(gConf,otmcTeam,()=>{
  console.log('::::redis.ready=<',redis.ready,'>');
});


/*
const testMsg = {
  topic:'rtk-gnss/rtcm/3.0/base64',
  payload:{
    base64:'base64'
  }
};
setTimeout(()=>{
  otmc.broadcastMsg(testMsg);
},10000);
*/

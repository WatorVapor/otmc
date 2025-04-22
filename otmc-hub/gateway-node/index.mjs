import fs from 'fs';

import { RedisRelay } from './redisRelay.mjs';
console.log('::::RedisRelay=<',RedisRelay,'>');

//import * as OtmcTeam from 'otmc-client';
import { OtmcTeam } from '../../otmc-package/otmc.team.js';
console.log('::::OtmcTeam=<',OtmcTeam,'>');
import { OtmcMqtt } from '../../otmc-package/otmc.mqtt.js';
console.log('::::OtmcMqtt=<',OtmcMqtt,'>');




const otmcTeam = new OtmcTeam();
//console.log('::::otmcTeam=<',otmcTeam,'>');

const otmcMqtt = new OtmcMqtt();
//console.log('::::otmcMqtt=<',otmcMqtt,'>');

otmcMqtt.on('otmc:mqtt:all',(mqttMsg)=>{
  console.log('::otmc.mqtt.all::mqttMsg=<',mqttMsg,'>');
});


const gConf = {};
try {
  const configPath = './config.json';
  const configText = fs.readFileSync(configPath);
  const config = JSON.parse(configText);
  console.log('::::config=<',config,'>');
  gConf.store = config.store;
  otmcTeam.config = config;
  otmcMqtt.config = config;
} catch ( err ) {
  console.error('::::err=<',err,'>');
}


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

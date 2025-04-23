import fs from 'fs';

import { RedisRelay } from './redisRelay.mjs';
console.log('::index::RedisRelay=<',RedisRelay,'>');

//import * as OtmcTeam from 'otmc-client';
import { OtmcTeam } from '../../otmc-package/otmc.team.js';
console.log('::index::OtmcTeam=<',OtmcTeam,'>');
import { OtmcMqtt } from '../../otmc-package/otmc.mqtt.js';
console.log('::index::OtmcMqtt=<',OtmcMqtt,'>');




const otmcTeam = new OtmcTeam();
const otmcMqtt = new OtmcMqtt();
//console.log('::index::otmcMqtt=<',otmcMqtt,'>');


const gConf = {};
try {
  const configPath = './config.json';
  const configText = fs.readFileSync(configPath);
  const config = JSON.parse(configText);
  console.log('::index::config=<',config,'>');
  gConf.store = config.store;
  otmcTeam.config = config;
  otmcMqtt.config = config;
} catch ( err ) {
  console.error('::index::err=<',err,'>');
}
const readSelected = ()=>{
  try {
    const storePath = gConf.store;
    console.log('index::readSelected::storePath=<',storePath,'>');
    const selectedKey = `${storePath}/didteam/didKey.selected.json`;
    const selectedStr = fs.readFileSync(selectedKey).toString('utf-8');
    console.log('index::readSelected::selectedStr=<',selectedStr,'>');
    const selectedJson = JSON.parse(selectedStr);
    console.log('index::readSelected::selectedJson=<',selectedJson,'>');
    return selectedJson.address;
  } catch ( err ) {
    console.error('index::readSelected::err=<',err,'>');
  }    
}



//console.log('::::otmcTeam=<',otmcTeam,'>');
otmcTeam.once('edcrypt:didKeyLis',(keyList)=>{
  console.log('::index::keyList=<',keyList,'>');
})


otmcTeam.once('edcrypt:worker:ready',(workerReady)=>{
  console.log('::index::ready=<',workerReady,'>');  
  const address = readSelected();
  console.log('::index::address=<',address,'>');  
  otmcTeam.switchDidKey(address); 
})




const redis = new RedisRelay(gConf,otmcTeam,()=>{
  console.log('::index::redis.ready=<',redis.ready,'>');
});




otmcMqtt.once('edcrypt:worker:ready',(workerReady)=>{
  console.log('::index::ready=<',workerReady,'>');  
  const address = readSelected();
  console.log('::index::address=<',address,'>');
  otmcMqtt.switchDidKey(address); 
})

otmcMqtt.once('edcrypt:didKeyLis',(keyList)=>{
  console.log('::index::keyList=<',keyList,'>');
});

otmcMqtt.once('mqtt:connected',()=>{
  console.log('mqtt:connected');
});
otmcMqtt.on('otmc:mqtt:msg',(msg)=>{
  console.log('::index::msg=<',msg,'>');
})


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

import fs from 'fs';

import { RedisRelay } from './redisRelay.mjs';
console.log('::::RedisRelay=<',RedisRelay,'>');

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

const redis = new RedisRelay(gConf);
console.log('::::redis=<',redis,'>');

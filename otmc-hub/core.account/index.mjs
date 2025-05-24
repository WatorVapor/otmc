const LOG = {
  trace0:true,
  trace:true,
  debug:true,
};
import fs from 'fs';
import { RedisPassThrough } from '../core.utils/redisPassThrough.mjs';
if(LOG.trace0) {
  console.log('::::RedisPassThrough=<',RedisPassThrough,'>');
}

const gConf = {};
try {
  const configPath = './config.json';
  const configText = fs.readFileSync(configPath);
  const config = JSON.parse(configText);
  if(LOG.trace0) {
    console.log('::::config=<',config,'>');
  }
  gConf.store = config.store;
  fs.mkdirSync(`${gConf.store}/secretKey`, { recursive: true },);
} catch ( err ) {
  console.error('::::err=<',err,'>');
}

const redisPass = new RedisPassThrough(gConf,()=>{
  if(LOG.trace0) {
    console.log('::::redisPass.ready=<',redisPass.ready,'>');
  }
});
if(LOG.trace0) {
  console.log('::::redisPass=<',redisPass,'>');
}

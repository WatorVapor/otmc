const LOG = {
  trace0:true,
  trace:true,
  debug:true,
};
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { RedisPassProxy } from '../core.utils/redisPassProxy.mjs';
if(LOG.trace0) {
  console.log('::::RedisPassProxy=<',RedisPassProxy,'>');
}
import { OtmcConfig } from '../core.utils/otmcConfig.mjs';
if(LOG.trace0) {
  console.log('::::OtmcConfig=<',OtmcConfig,'>');
}
const gConf = OtmcConfig.load(__dirname);
if(LOG.trace0) {
  console.log('::::gConf=<',gConf,'>');
}
/*
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
*/

const redisPass = new RedisPassProxy(gConf,()=>{
  if(LOG.trace0) {
    console.log('::::redisPass.ready=<',redisPass.ready,'>');
  }
});
if(LOG.trace0) {
  console.log('::::redisPass=<',redisPass,'>');
}

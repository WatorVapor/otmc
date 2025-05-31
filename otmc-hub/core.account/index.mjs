const LOG = {
  trace0:true,
  trace:true,
  debug:true,
};
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
if(LOG.trace0) {
  console.log('core.account::__dirname=<',__dirname,'>');
}
import { RedisPassProxy } from '../core.utils/redisPassProxy.mjs';
if(LOG.trace0) {
  console.log('core.account::RedisPassProxy=<',RedisPassProxy,'>');
}
import { OtmcConfig } from '../core.utils/otmcConfig.mjs';
if(LOG.trace0) {
  console.log('core.account::OtmcConfig=<',OtmcConfig,'>');
}
const gConf = OtmcConfig.load(__dirname);
if(LOG.trace0) {
  console.log('core.account::gConf=<',gConf,'>');
}


const redisPass = new RedisPassProxy(gConf,()=>{
  if(LOG.trace0) {
    console.log('core.account::redisPass.ready=<',redisPass.ready,'>');
  }
});
if(LOG.trace0) {
  console.log('core.account::redisPass=<',redisPass,'>');
}

import { AccountStore } from './account.store.mjs';
if(LOG.trace0) {
  console.log('core.account::AccountStore=<',AccountStore,'>');
}
const accountStore = new AccountStore(gConf);
if(LOG.trace0) {
  console.log('core.account::accountStore=<',accountStore,'>');
}

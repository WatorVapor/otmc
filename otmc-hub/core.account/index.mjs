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

const onRedisReady = ()=>{
  if(LOG.trace0) {
    console.log('core.account::onRedisReady::redisProxy.ready=<',redisProxy.ready,'>');
  }
  createSubscriber();
}

const redisProxy = new RedisPassProxy(gConf,onRedisReady,);
if(LOG.trace0) {
  console.log('core.account::redisProxy=<',redisProxy,'>');
}

const encryptCloudMsgListener = (topic,msg)=>{
  if(LOG.trace0) {
    console.log('core.account::encryptCloudMsgListener::topic=<',topic,'>');
    console.log('core.account::encryptCloudMsgListener::msg=<',msg,'>');
  }
}

const plainCloudMsgListener = (topic,msg)=>{
  if(LOG.trace0) {
    console.log('core.account::plainCloudMsgListener::topic=<',topic,'>');
    console.log('core.account::plainCloudMsgListener::msg=<',msg,'>');
  }
}

const createSubscriber = ()=>{
  if(LOG.trace0) {
    console.log('core.account::createSubscriber::redisProxy.ready=<',redisProxy.ready,'>');
  }
  redisProxy.setEncryptListener(encryptCloudMsgListener);  
  redisProxy.setPlainListener(plainCloudMsgListener);  
}


import { AccountStore } from './account.store.mjs';
if(LOG.trace0) {
  console.log('core.account::AccountStore=<',AccountStore,'>');
}
const accountStore = new AccountStore(gConf);
if(LOG.trace0) {
  console.log('core.account::accountStore=<',accountStore,'>');
}

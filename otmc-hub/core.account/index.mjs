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
  setTimeout(()=>{
    syncLocal2Clound();
  },1000);
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
  switch(topic) {
    case 'team/property/sync':
      onAccountSyncFromCloud(msg);
      break;
    default:
      if(LOG.debug) {
        console.log('core.account::encryptCloudMsgListener::unknown topic=<',topic,'>');
      }
      break;
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

const onAccountSyncFromCloud = async (syncMsg) => {
  if(LOG.trace0) {
    console.log('core.account::onAccountSyncFromCloud::syncMsg=<',syncMsg,'>');
  }
  try {
    const accountInfo = syncMsg.decryptedMsg.payload;
    if(LOG.trace0) {
      console.log('core.account::onAccountSyncFromCloud::accountInfo=<',accountInfo,'>');
    }
    await accountStore.putProperty(accountInfo);
  } catch (error) {
    console.error('core.account::onAccountSyncFromCloud::error=<',error,'>');
  }
};

const syncLocal2Clound = async () => {
  const did = await redisProxy.get('otmc.current.space.id');
  const accountInfo = await accountStore.getProperty(did);
  if(LOG.trace0) {
    console.log('core.account::syncLocal2Clound::accountInfo=<',accountInfo,'>');
  }
  redisProxy.pubBroadcastEncypt('team/property/sync',accountInfo);
}

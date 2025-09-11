import { createClient } from 'redis';
export class RedisPassProxy {
  constructor(config,readyCB) {
    this.trace0 = true;
    this.trace1 = true;
    this.trace = true;
    this.trace10 = false;

    this.debug = true;
    this.redisUnxiPath = `${config.store}/redis/redis.otmc.hub.sock`;
    this.readyCB_ = readyCB;
    if(this.trace) {
      console.log('RedisPassProxy::constructor::this.redisUnxiPath=<',this.redisUnxiPath,'>');
    }
    this.clientOpt = {
      socket:{
        path:this.redisUnxiPath
      }
    };
    if(this.trace) {
      console.log('RedisPassProxy::createRedisClient_::this.clientOpt=<',this.clientOpt,'>');
    }
    this.client = createClient(this.clientOpt);
    this.createRedisClient_();
    this.createRedisPublish_();
    this.createRedisSubscriber_();
  }
  async pubBroadcast(topic,payload) {
    if(this.trace0) {
      console.log('RedisPassProxy::pubBroadcast::topic=<',topic,'>');
      console.log('RedisPassProxy::pubBroadcast::payload=<',payload,'>');
    }
    if(!payload) {
      payload = {}
    }
    const topicOut = `/omtc/edge/2/cloud/broadcast/plain/${topic}`;
    if(this.trace0) {
      console.log('RedisPassProxy::pubBroadcast::topicOut=<',topicOut,'>');
    }
    if(this.trace10) {
      console.log('RedisPassProxy::pubBroadcast::this.publisher=<',this.publisher,'>');
    }
    await this.publisher.publish(topicOut,JSON.stringify(payload),(err)=>{
      if(err) {
        console.error('RedisPassProxy::pubBroadcast::err=<',err,'>');
      }
    });
  }
  pubUnicast(topic,payload) {
    if(this.trace0) {
      console.log('RedisPassProxy::pubUnicast::topic=<',topic,'>');
      console.log('RedisPassProxy::pubUnicast::payload=<',payload,'>');
    }
    if(!payload) {
      payload = {}
    }
    const topicOut = `/omtc/edge/2/cloud/unicast/plain/${topic}`;
    if(this.trace0) {
      console.log('RedisPassProxy::pubUnicast::topicOut=<',topicOut,'>');
    }
    this.publisher.publish(topicOut,JSON.stringify(payload),(err)=>{
      if(err) {
        console.error('RedisPassProxy::pubUnicast::err=<',err,'>');
      }
    });
  }

  async pubBroadcastEncypt(topic,payload) {
    if(this.trace0) {
      console.log('RedisPassProxy::pubBroadcastEncypt::topic=<',topic,'>');
      console.log('RedisPassProxy::pubBroadcastEncypt::payload=<',payload,'>');
    }
    if(!payload) {
      payload = {}
    }
    const topicOut = `/omtc/edge/2/cloud/broadcast/encypt/${topic}`;
    if(this.trace0) {
      console.log('RedisPassProxy::pubBroadcastEncypt::topicOut=<',topicOut,'>');
    }
    if(this.trace0) {
      console.log('RedisPassProxy::pubBroadcastEncypt::this.publisher=<',this.publisher,'>');
    }
    await this.publisher.publish(topicOut,JSON.stringify(payload),(err)=>{
      if(err) {
        console.error('RedisPassProxy::pubBroadcastEncypt::err=<',err,'>');
      }
    });
  }
  pubUnicastEncypt(topic,payload) {
    if(this.trace0) {
      console.log('RedisPassProxy::pubUnicastEncypt::topic=<',topic,'>');
      console.log('RedisPassProxy::pubUnicastEncypt::payload=<',payload,'>');
    }
    if(!payload) {
      payload = {}
    }
    const topicOut = `/omtc/edge/2/cloud/unicast/encypt/${topic}`;
    if(this.trace0) {
      console.log('RedisPassProxy::pubUnicastEncypt::topicOut=<',topicOut,'>');
    }
    this.publisher.publish(topicOut,JSON.stringify(payload),(err)=>{
      if(err) {
        console.error('RedisPassProxy::pubUnicastEncypt::err=<',err,'>');
      }
    });
  }
  setEncryptListener(listener) {
    this.listenerEncrypt_ = listener;
  }
  setPlainListener(listener) {
    this.listenerPlain_ = listener;
  }

  set(key,value) {
    this.client.set(key,value);
  }
  async get(key) {
    return await this.client.get(key);
  }  

  async createRedisClient_() {
    if(this.trace0) {
      console.log('RedisPassProxy::createRedisClient_::this.client=<',this.client,'>');
    }
    this.setupCommonHandler_(this.client,'client');
    await this.client.connect();
  }
  async createRedisPublish_() {
    this.publisher = this.client.duplicate();
    if(this.trace0) {
      console.log('RedisPassProxy::createRedisPublish_::this.publisher=<',this.publisher,'>');
    }
    this.setupCommonHandler_(this.publisher,'publish');
    await this.publisher.connect();
  }

  async createRedisSubscriber_() {
    this.subscriber = this.client.duplicate();
    if(this.trace0) {
      console.log('RedisPassProxy::createRedisSubscriber_::this.subscriber=<',this.subscriber,'>');
    }
    const self = this;
    this.setupCommonHandler_(this.subscriber,'subscriber',()=>{
       if(self.readyCB_) {
        self.ready = true;
        self.readyCB_();
      }     
    });
    await this.subscriber.connect();

    const listener1 = (message, channel) => {
      self.onMqttCloudPlainMessage_(channel,message);
    };
    this.subscriber.pSubscribe('/omtc/cloud/2/edge/plain/*', listener1);
    const listener2 = (message, channel) => {
      self.onMqttCloudEncyptMessage_(channel,message);
    };
    this.subscriber.pSubscribe('/omtc/cloud/2/edge/encypt/*', listener2);    
  }
  setupCommonHandler_(client,tag,cb) {
    if(this.trace) {
      console.log(`RedisPassProxy::setupCommonHandler_::${tag}`);
    }
    const self = this;
    client.on('error', err => {
      if(self.trace) {
        console.log(`RedisPassProxy::setupCommonHandler_::${tag}::err=<`,err,`>`);
      }
    });
    client.on('connect', evtConnect => {
      if(self.trace) {
        console.log(`RedisPassProxy::setupCommonHandler_::${tag}::evtConnect=<`,evtConnect,`>`);
      }
    });
    client.on('ready', evtReady => {
      if(self.trace) {
        console.log(`RedisPassProxy::setupCommonHandler_::${tag}::evtReady=<`,evtReady,`>`);
      }
      if(cb) {
        cb();
      }
    });
    client.on('end', evtEnd => {
      if(self.trace) {
        console.log(`RedisPassProxy::setupCommonHandler_::${tag}::evtEnd=<`,evtEnd,`>`);
      }
    });
    client.on('reconnecting', evtReconnecting => {
      if(self.trace) {
        console.log('RedisPassProxy::setupCommonHandler_::evtReconnecting=<',evtReconnecting,'>');  
      }
    });
    if(this.trace) {
      console.log(`RedisPassProxy::setupCommonHandler_::${tag}`);
    }
  }


  onMqttCloudPlainMessage_(topic,message) {
    if(this.trace1) {
      console.log('RedisPassProxy::onMqttCloudPlainMessage_::topic=<',topic,'>');
      console.log('RedisPassProxy::onMqttCloudPlainMessage_::message=<',message,'>');
    }
    const funcTopic = topic.replace('/omtc/cloud/2/edge/plain/','');
    if(this.trace1) {
      console.log('RedisPassProxy::onMqttCloudPlainMessage_::funcTopic=<',funcTopic,'>');
    }
    try {
      const jMsg = JSON.parse(message);
      if(this.listenerPlain_) {
        this.listenerPlain_(funcTopic,jMsg);
      }        
    } catch (error) {
      console.error('RedisPassProxy::onMqttCloudPlainMessage_::error=<',error,'>');
    }
  }

  onMqttCloudEncyptMessage_(topic,message) {
    if(this.trace1) {
      console.log('RedisPassProxy::onMqttCloudEncyptMessage_::topic=<',topic,'>');
      console.log('RedisPassProxy::onMqttCloudEncyptMessage_::message=<',message,'>');
    }
    const funcTopic = topic.replace('/omtc/cloud/2/edge/encypt/','');
    if(this.trace1) {
      console.log('RedisPassProxy::onMqttCloudEncyptMessage_::funcTopic=<',funcTopic,'>');
    }
    try {
      const jMsg = JSON.parse(message);
      if(this.listenerEncrypt_) {
        this.listenerEncrypt_(funcTopic,jMsg);
      }        
    } catch (error) {
      console.error('RedisPassProxy::onMqttCloudEncyptMessage_::error=<',error,'>');
    }
  }

}

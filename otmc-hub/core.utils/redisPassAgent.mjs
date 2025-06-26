import { createClient } from 'redis';
export class RedisPassAgent {
  constructor(config,readyCB) {
    this.trace0 = false;
    this.trace = true;
    this.debug = true;
    this.redisUnxiPath = `${config.store}/redis/redis.otmc.hub.sock`;
    this.readyCB_ = readyCB;
    if(this.trace) {
      console.log('RedisPassAgent::constructor::this.redisUnxiPath=<',this.redisUnxiPath,'>');
    }
    this.clientOpt = {
      socket:{
        path:this.redisUnxiPath
      }
    };
    if(this.trace) {
      console.log('RedisPassAgent::constructor::this.clientOpt=<',this.clientOpt,'>');
    }
    this.client = createClient(this.clientOpt);

    this.createRedisClient_();
    this.createRedisPublish_();
    this.createRedisSubscriber_();
  }
  async relayMqttPlainMsg(topic,payload) {
    if(this.trace0) {
      console.log('RedisPassAgent::relayMqttPlainMsg::topic=<',topic,'>');
      console.log('RedisPassAgent::relayMqttPlainMsg::payload=<',payload,'>');
    }
    const topicOut = `/omtc/cloud/2/edge/plain/${topic}`;
    if(this.trace0) {
      console.log('RedisPassAgent::relayMqttPlainMsg::topicOut=<',topicOut,'>');
    }
    if(this.trace0) {
      console.log('RedisPassAgent::relayMqttPlainMsg::this.client=<',this.client,'>');
    }
    await this.publisher.publish(topicOut,JSON.stringify(payload),(err)=>{
      if(err) {
        console.error('RedisPassAgent::relayMqttPlainMsg::err=<',err,'>');
      }
    });
  }
  async relayMqttEncyptMsg(topic,payload) {
    if(this.trace0) {
      console.log('RedisPassAgent::relayMqttEncyptMsg::topic=<',topic,'>');
      console.log('RedisPassAgent::relayMqttEncyptMsg::payload=<',payload,'>');
    }
    const topicOut = `/omtc/cloud/2/edge/encypt/${topic}`;
    if(this.trace0) {
      console.log('RedisPassAgent::relayMqttEncyptMsg::topicOut=<',topicOut,'>');
    }
    if(this.trace0) {
      console.log('RedisPassAgent::relayMqttEncyptMsg::this.client=<',this.client,'>');
    }
    await this.publisher.publish(topicOut,JSON.stringify(payload),(err)=>{
      if(err) {
        console.error('RedisPassAgent::relayMqttEncyptMsg::err=<',err,'>');
      }
    });
  }
  set(key,value) {
    this.client.set(key,value);
  }
  async get(key) {
    return await this.client.get(key);
  }
  
  
  async createRedisClient_() {
    this.setupCommonHandler_(this.client,'client');
    await this.client.connect();
    if(this.trace0) {
      console.log('RedisPassAgent::createRedisClient_::this.client=<',this.client,'>');
    }
  }

  async createRedisPublish_() {
    this.publisher = this.client.duplicate();
    this.setupCommonHandler_(this.publisher,'publish');
    await this.publisher.connect();
    if(this.trace0) {
      console.log('RedisPassAgent::createRedisPublish_::this.publisher=<',this.publisher,'>');
    }
  }

  async createRedisSubscriber_() {
    this.subscriber = this.client.duplicate();
    const self = this;
    this.setupCommonHandler_(this.subscriber,'subscriber',() => {
      if(self.trace) {
        console.log('RedisPassAgent::createRedisSubscriber_::evtReadySub=<',evtReadySub,'>');
      }
      if(self.readyCB_) {
        self.ready = true;
        self.readyCB_();
      }      
    });    
    await this.subscriber.connect();
    if(this.trace0) {
      console.log('RedisPassAgent::createRedisSubscriber_::this.subscriber=<',this.subscriber,'>');
    }

    const listener1 = (message, channel) => {
      self.onEdgePlainBroadcast_(channel,message);
    };
    this.subscriber.pSubscribe('/omtc/edge/2/cloud/broadcast/plain/*', listener1);

    const listener2 = (message, channel) => {
      self.onEdgePlainUnicast_(channel,message);
    };
    this.subscriber.pSubscribe('/omtc/edge/2/cloud/unicast/plain/*', listener2);
    
    const listener3 = (message, channel) => {
      self.onEdgeEncyptBroadcast_(channel,message);
    };
    this.subscriber.pSubscribe('/omtc/edge/2/cloud/broadcast/encypt/*', listener3);

    const listener4 = (message, channel) => {
      self.onEdgeEncyptUnicast_(channel,message);
    };
    this.subscriber.pSubscribe('/omtc/edge/2/cloud/unicast/v/*', listener4);
  }

  setupCommonHandler_(client,tag,cb) {
    const self = this;
    client.on('error', err => {
      if(self.trace) {
        console.log(`RedisPassAgent::setupCommonHandler_::${tag}::err=<`,err,`>`);
      }
    });
    client.on('connect', evtConnect => {
      if(self.trace) {
        console.log(`RedisPassAgent::setupCommonHandler_::${tag}::evtConnect=<`,evtConnect,`>`);
      }
    });
    client.on('ready', evtReady => {
      if(self.trace) {
        console.log(`RedisPassAgent::setupCommonHandler_::${tag}::evtReady=<`,evtReady,`>`);
      }
      if(cb) {
        cb();
      }
    });
    client.on('end', evtEnd => {
      if(self.trace) {
        console.log(`RedisPassAgent::setupCommonHandler_::${tag}::evtEnd=<`,evtEnd,`>`);
      }
    });
    client.on('reconnecting', evtReconnecting => {
      if(self.trace) {
        console.log(`RedisPassAgent::setupCommonHandler_::${tag}::evtReconnecting=<`,evtReconnecting,'>');  
      }
    });
  }


  onEdgePlainBroadcast_(topic,message) {
    if(this.trace) {
      console.log('RedisPassAgent::onEdgePlainBroadcast_::topic=<',topic,'>');
      console.log('RedisPassAgent::onEdgePlainBroadcast_::message=<',message,'>');
    }
  }
  onEdgePlainUnicast_(topic,message) {
    if(this.trace) {
      console.log('RedisPassAgent::onEdgePlainUnicast_::topic=<',topic,'>');
      console.log('RedisPassAgent::onEdgePlainUnicast_::message=<',message,'>');
    }
  }
  onEdgeEncyptBroadcast_(topic,message) {
    if(this.trace) {
      console.log('RedisPassAgent::onEdgeEncyptBroadcast_::topic=<',topic,'>');
      console.log('RedisPassAgent::onEdgeEncyptBroadcast_::message=<',message,'>');
    }
  }
  onEdgeEncyptUnicast_(topic,message) {
    if(this.trace) {
      console.log('RedisPassAgent::onEdgeEncyptUnicast_::topic=<',topic,'>');
      console.log('RedisPassAgent::onEdgeEncyptUnicast_::message=<',message,'>');
    }
  }
}

import { createClient } from 'redis';
export class RedisPassProxy {
  constructor(config,readyCB) {
    this.trace0 = false;
    this.trace = true;
    this.debug = true;
    this.redisUnxiPath = `${config.store}/redis/redis.otmc.hub.sock`;
    this.readyCB_ = readyCB;
    if(this.trace) {
      console.log('RedisPassProxy::constructor::this.redisUnxiPath=<',this.redisUnxiPath,'>');
    }
    this.createRedisClient_();
  }
  async pubBroadcast(topic,payload) {
    if(this.trace0) {
      console.log('RedisPassProxy::pubBroadcast::topic=<',topic,'>');
      console.log('RedisPassProxy::pubBroadcast::payload=<',payload,'>');
    }
    const topicOut = `/omtc/edge/2/cloud/broadcast/plain/${topic}`;
    if(this.trace0) {
      console.log('RedisPassProxy::pubBroadcast::topicOut=<',topicOut,'>');
    }
    if(this.trace0) {
      console.log('RedisPassProxy::pubBroadcast::this.client=<',this.client,'>');
    }
    await this.client.publish(topicOut,JSON.stringify(payload),(err)=>{
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
    const topicOut = `/omtc/edge/2/cloud/unicast/plain/${topic}`;
    if(this.trace0) {
      console.log('RedisPassProxy::pubUnicast::topicOut=<',topicOut,'>');
    }
    this.client.publish(topicOut,JSON.stringify(payload),(err)=>{
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
    const topicOut = `/omtc/edge/2/cloud/broadcast/encypt/${topic}`;
    if(this.trace0) {
      console.log('RedisPassProxy::pubBroadcastEncypt::topicOut=<',topicOut,'>');
    }
    if(this.trace0) {
      console.log('RedisPassProxy::pubBroadcastEncypt::this.client=<',this.client,'>');
    }
    await this.client.publish(topicOut,JSON.stringify(payload),(err)=>{
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
    const topicOut = `/omtc/edge/2/cloud/unicast/encypt/${topic}`;
    if(this.trace0) {
      console.log('RedisPassProxy::pubUnicastEncypt::topicOut=<',topicOut,'>');
    }
    this.client.publish(topicOut,JSON.stringify(payload),(err)=>{
      if(err) {
        console.error('RedisPassProxy::pubUnicastEncypt::err=<',err,'>');
      }
    });
  } 
  
  createRedisClient_() {
    const clientOpt = {
      socket:{
        path:this.redisUnxiPath
      }
    };
    if(this.trace) {
      console.log('RedisPassProxy::createRedisClient_::clientOpt=<',clientOpt,'>');
    }
    this.client = createClient(clientOpt);
    const self = this;
    this.client.on('error', err => {
      if(self.trace) {
        console.log('RedisPassProxy::createRedisClient_::err=<',err,'>');
      }
    });
    this.client.on('connect', evtConnect => {
      if(self.trace) {
        console.log('RedisPassProxy::createRedisClient_::evtConnect=<',evtConnect,'>');
      }
    });
    this.client.on('ready', evtReady => {
      if(self.trace) {
        console.log('RedisPassProxy::createRedisClient_::evtReady=<',evtReady,'>');
      }
      self.createRedisSubscriber_();
    });
    this.client.on('end', evtEnd => {
      if(self.trace) {
        console.log('RedisPassProxy::createRedisClient_::evtEnd=<',evtEnd,'>');
      }
    });
    this.client.on('reconnecting', evtReconnecting => {
      if(self.trace) {
        console.log('RedisPassProxy::createRedisClient_::evtReconnecting=<',evtReconnecting,'>');
      }
    });
    this.client.connect();
    if(this.trace0) {
      console.log('RedisPassProxy::createRedisClient_::this.client=<',this.client,'>');
    }
  }
  createRedisSubscriber_() {
    this.subscriber = this.client.duplicate();
    const self = this;
    this.subscriber.on('error', errSub => {
      if(self.trace) {
        console.log('RedisPassProxy::createRedisSubscriber_::errSub=<',errSub,'>');
      }
    });
    this.subscriber.on('connect', evtConnectSub => {
      if(self.trace) {
        console.log('RedisPassProxy::createRedisSubscriber_::evtConnectSub=<',evtConnectSub,'>');
      }
    });
    this.subscriber.on('ready', evtReadySub => {
      if(self.trace) {
        console.log('RedisPassProxy::createRedisSubscriber_::evtReadySub=<',evtReadySub,'>');
      }
      if(self.readyCB_) {
        self.ready = true;
        self.readyCB_();
      }
    });
    this.subscriber.on('end', evtEndSub => {
      if(self.trace) {
        console.log('RedisPassProxy::createRedisSubscriber_::evtEndSub=<',evtEndSub,'>');
      }
    });
    this.subscriber.on('reconnecting', evtReconnectingSub => {
      if(self.trace) {
        console.log('RedisPassProxy::createRedisSubscriber_::evtReconnectingSub=<',evtReconnectingSub,'>');
      }
    });
    
    const listener1 = (message, channel) => {
      self.onMqttCloudPlainMessage_(channel,message);
    };
    this.subscriber.pSubscribe('/omtc/cloud/2/edge/plain/*', listener1);

    const listener2 = (message, channel) => {
      self.onMqttCloudEncyptMessage_(channel,message);
    };
    this.subscriber.pSubscribe('/omtc/cloud/2/edge/encypt/*', listener2);

    
    this.subscriber.connect();
    if(this.trace0) {
      console.log('RedisPassProxy::createRedisSubscriber_::this.subscriber=<',this.subscriber,'>');
    }
  }


  onMqttCloudPlainMessage_(topic,message) {
    if(this.trace) {
      console.log('RedisPassProxy::onMqttCloudPlainMessage_::topic=<',topic,'>');
      console.log('RedisPassProxy::onMqttCloudPlainMessage_::message=<',message,'>');
    }
  }

  onMqttCloudEncyptMessage_(topic,message) {
    if(this.trace) {
      console.log('RedisPassProxy::onMqttCloudEncyptMessage_::topic=<',topic,'>');
      console.log('RedisPassProxy::onMqttCloudEncyptMessage_::message=<',message,'>');
    }
  }

}

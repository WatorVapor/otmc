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
    this.createRedisClient_();
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
    await this.client.publish(topicOut,JSON.stringify(payload),(err)=>{
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
    await this.client.publish(topicOut,JSON.stringify(payload),(err)=>{
      if(err) {
        console.error('RedisPassAgent::relayMqttEncyptMsg::err=<',err,'>');
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
      console.log('RedisPassAgent::createRedisClient_::clientOpt=<',clientOpt,'>');
    }
    this.client = createClient(clientOpt);
    const self = this;
    this.client.on('error', err => {
      if(self.trace) {
        console.log('RedisPassAgent::createRedisClient_::err=<',err,'>');
      }
    });
    this.client.on('connect', evtConnect => {
      if(self.trace) {
        console.log('RedisPassAgent::createRedisClient_::evtConnect=<',evtConnect,'>');
      }
    });
    this.client.on('ready', evtReady => {
      if(self.trace) {
        console.log('RedisPassAgent::createRedisClient_::evtReady=<',evtReady,'>');
      }
      self.createRedisSubscriber_();
    });
    this.client.on('end', evtEnd => {
      if(self.trace) {
        console.log('RedisPassAgent::createRedisClient_::evtEnd=<',evtEnd,'>');
      }
    });
    this.client.on('reconnecting', evtReconnecting => {
      if(self.trace) {
        console.log('RedisPassAgent::createRedisClient_::evtReconnecting=<',evtReconnecting,'>');
      }
    });
    this.client.connect();
    if(this.trace0) {
      console.log('RedisPassAgent::createRedisClient_::this.client=<',this.client,'>');
    }
  }
  createRedisSubscriber_() {
    this.subscriber = this.client.duplicate();
    const self = this;
    this.subscriber.on('error', errSub => {
      if(self.trace) {
        console.log('RedisPassAgent::createRedisSubscriber_::errSub=<',errSub,'>');
      }
    });
    this.subscriber.on('connect', evtConnectSub => {
      if(self.trace) {
        console.log('RedisPassAgent::createRedisSubscriber_::evtConnectSub=<',evtConnectSub,'>');
      }
    });
    this.subscriber.on('ready', evtReadySub => {
      if(self.trace) {
        console.log('RedisPassAgent::createRedisSubscriber_::evtReadySub=<',evtReadySub,'>');
      }
      if(self.readyCB_) {
        self.ready = true;
        self.readyCB_();
      }
    });
    this.subscriber.on('end', evtEndSub => {
      if(self.trace) {
        console.log('RedisPassAgent::createRedisSubscriber_::evtEndSub=<',evtEndSub,'>');
      }
    });
    this.subscriber.on('reconnecting', evtReconnectingSub => {
      if(self.trace) {
        console.log('RedisPassAgent::createRedisSubscriber_::evtReconnectingSub=<',evtReconnectingSub,'>');
      }
    });
    
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

    
    this.subscriber.connect();
    if(this.trace0) {
      console.log('RedisPassAgent::createRedisSubscriber_::this.subscriber=<',this.subscriber,'>');
    }
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

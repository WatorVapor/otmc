import { createClient } from 'redis';
export class RedisRelay {
  constructor(config,readyCB) {
    this.trace0 = false;
    this.trace = true;
    this.debug = true;
    this.redisUnxiPath = `${config.store}/redis/redis.otmc.hub.sock`;
    this.readyCB_ = readyCB;
    if(this.trace) {
      console.log('RedisRelay::constructor::this.redisUnxiPath=<',this.redisUnxiPath,'>');
    }
    this.createRedisClient_();
  }
  async pubBroadcast(topic,payload) {
    if(this.trace) {
      console.log('RedisRelay::pubBroadcast::topic=<',topic,'>');
      console.log('RedisRelay::pubBroadcast::payload=<',payload,'>');
    }
    const topicOut = `/omtc/2/broadcast/${topic}`;
    if(this.trace) {
      console.log('RedisRelay::pubBroadcast::topicOut=<',topicOut,'>');
    }
    if(this.trace0) {
      console.log('RedisRelay::pubBroadcast::this.client=<',this.client,'>');
    }
    await this.client.publish(topicOut,JSON.stringify(payload),(err)=>{
      if(this.trace) {
        console.log('RedisRelay::pubBroadcast::err=<',err,'>');
      }
    });
  }
  pubAddress(topic,payload) {
    if(this.trace) {
      console.log('RedisRelay::pubAddress::topic=<',topic,'>');
      console.log('RedisRelay::pubAddress::payload=<',payload,'>');
    }
    const topicOut = `/omtc/2/address/${topic}`;
    if(this.trace) {
      console.log('RedisRelay::pubAddress::topicOut=<',topicOut,'>');
    }
    this.client.publish(topicOut,JSON.stringify(payload),(err)=>{
      if(this.trace) {
        console.log('RedisRelay::pubAddress::err=<',err,'>');
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
      console.log('RedisRelay::createRedisClient_::clientOpt=<',clientOpt,'>');
    }
    this.client = createClient(clientOpt);
    const self = this;
    this.client.on('error', err => {
      if(self.trace) {
        console.log('RedisRelay::createRedisClient_::err=<',err,'>');
      }
    });
    this.client.on('connect', evtConnect => {
      if(self.trace) {
        console.log('RedisRelay::createRedisClient_::evtConnect=<',evtConnect,'>');
      }
    });
    this.client.on('ready', evtReady => {
      if(self.trace) {
        console.log('RedisRelay::createRedisClient_::evtReady=<',evtReady,'>');
      }
      self.createRedisSubscriber_();
    });
    this.client.on('end', evtEnd => {
      if(self.trace) {
        console.log('RedisRelay::createRedisClient_::evtEnd=<',evtEnd,'>');
      }
    });
    this.client.on('reconnecting', evtReconnecting => {
      if(self.trace) {
        console.log('RedisRelay::createRedisClient_::evtReconnecting=<',evtReconnecting,'>');
      }
    });
    this.client.connect();
    if(this.trace0) {
      console.log('RedisRelay::createRedisClient_::this.client=<',this.client,'>');
    }
  }
  createRedisSubscriber_() {
    this.subscriber = this.client.duplicate();
    const self = this;
    this.subscriber.on('error', errSub => {
      if(self.trace) {
        console.log('RedisRelay::createRedisSubscriber_::errSub=<',errSub,'>');
      }
    });
    this.subscriber.on('connect', evtConnectSub => {
      if(self.trace) {
        console.log('RedisRelay::createRedisSubscriber_::evtConnectSub=<',evtConnectSub,'>');
      }
    });
    this.subscriber.on('ready', evtReadySub => {
      if(self.trace) {
        console.log('RedisRelay::createRedisSubscriber_::evtReadySub=<',evtReadySub,'>');
      }
      if(self.readyCB_) {
        self.ready = true;
        self.readyCB_();
      }
    });
    this.subscriber.on('end', evtEndSub => {
      if(self.trace) {
        console.log('RedisRelay::createRedisSubscriber_::evtEndSub=<',evtEndSub,'>');
      }
    });
    this.subscriber.on('reconnecting', evtReconnectingSub => {
      if(self.trace) {
        console.log('RedisRelay::createRedisSubscriber_::evtReconnectingSub=<',evtReconnectingSub,'>');
      }
    });
    const listener = (message, channel) => {
      self.onRedisBroadcast_(channel,message);
    };
    this.subscriber.pSubscribe('/from/omtc/broadcast/*', listener);
    const listener2 = (message, channel) => {
      self.onRedisAddress_(channel,message);
    };
    this.subscriber.pSubscribe('/from/omtc/address/*', listener2);
    this.subscriber.connect();
    if(this.trace0) {
      console.log('RedisRelay::createRedisSubscriber_::this.subscriber=<',this.subscriber,'>');
    }
  }


  onRedisBroadcast_(topic,message) {
    if(this.trace) {
      console.log('RedisRelay::onRedisBroadcast_::topic=<',topic,'>');
      console.log('RedisRelay::onRedisBroadcast_::message=<',message,'>');
    }
  }
  onRedisAddress_(topic,message) {
    if(this.trace) {
      console.log('RedisRelay::onRedisAddress_::topic=<',topic,'>');
      console.log('RedisRelay::onRedisAddress_::message=<',message,'>');
    }
  }
}

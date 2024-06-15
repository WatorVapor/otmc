import { createClient } from 'redis';
export class RedisPass {
  constructor(config,readyCB) {
    this.trace0 = false;
    this.trace = true;
    this.debug = true;
    this.redisUnxiPath = `${config.store}/redis/redis.otmc.hub.sock`;
    this.readyCB_ = readyCB;
    if(this.trace) {
      console.log('RedisPass::constructor::this.redisUnxiPath=<',this.redisUnxiPath,'>');
    }
    this.createRedisClient_();
  }
  async pubBroadcast(topic,payload) {
    if(this.trace) {
      console.log('RedisPass::pubBroadcast::topic=<',topic,'>');
      console.log('RedisPass::pubBroadcast::payload=<',payload,'>');
    }
    const topicOut = `/to/omtc/broadcast/${topic}`;
    if(this.trace) {
      console.log('RedisPass::pubBroadcast::topicOut=<',topicOut,'>');
    }
    if(this.trace0) {
      console.log('RedisPass::pubBroadcast::this.client=<',this.client,'>');
    }
    await this.client.publish(topicOut,JSON.stringify(payload),(err)=>{
      if(this.trace) {
        console.log('RedisPass::pubBroadcast::err=<',err,'>');
      }
    });
  }
  pubAddress(topic,payload) {
    if(this.trace) {
      console.log('RedisPass::pubAddress::topic=<',topic,'>');
      console.log('RedisPass::pubAddress::payload=<',payload,'>');
    }
    const topicOut = `/to/omtc/address/${topic}`;
    if(this.trace) {
      console.log('RedisPass::pubAddress::topicOut=<',topicOut,'>');
    }
    this.client.publish(topicOut,JSON.stringify(payload),(err)=>{
      if(this.trace) {
        console.log('RedisPass::pubAddress::err=<',err,'>');
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
      console.log('RedisPass::createRedisClient_::clientOpt=<',clientOpt,'>');
    }
    this.client = createClient(clientOpt);
    const self = this;
    this.client.on('error', err => {
      if(self.trace) {
        console.log('RedisPass::createRedisClient_::err=<',err,'>');
      }
    });
    this.client.on('connect', evtConnect => {
      if(self.trace) {
        console.log('RedisPass::createRedisClient_::evtConnect=<',evtConnect,'>');
      }
    });
    this.client.on('ready', evtReady => {
      if(self.trace) {
        console.log('RedisPass::createRedisClient_::evtReady=<',evtReady,'>');
      }
      self.createRedisSubscriber_();
    });
    this.client.on('end', evtEnd => {
      if(self.trace) {
        console.log('RedisPass::createRedisClient_::evtEnd=<',evtEnd,'>');
      }
    });
    this.client.on('reconnecting', evtReconnecting => {
      if(self.trace) {
        console.log('RedisPass::createRedisClient_::evtReconnecting=<',evtReconnecting,'>');
      }
    });
    this.client.connect();
    if(this.trace0) {
      console.log('RedisPass::createRedisClient_::this.client=<',this.client,'>');
    }
  }
  createRedisSubscriber_() {
    this.subscriber = this.client.duplicate();
    const self = this;
    this.subscriber.on('error', errSub => {
      if(self.trace) {
        console.log('RedisPass::createRedisSubscriber_::errSub=<',errSub,'>');
      }
    });
    this.subscriber.on('connect', evtConnectSub => {
      if(self.trace) {
        console.log('RedisPass::createRedisSubscriber_::evtConnectSub=<',evtConnectSub,'>');
      }
    });
    this.subscriber.on('ready', evtReadySub => {
      if(self.trace) {
        console.log('RedisPass::createRedisSubscriber_::evtReadySub=<',evtReadySub,'>');
      }
      if(self.readyCB_) {
        self.ready = true;
        self.readyCB_();
      }
    });
    this.subscriber.on('end', evtEndSub => {
      if(self.trace) {
        console.log('RedisPass::createRedisSubscriber_::evtEndSub=<',evtEndSub,'>');
      }
    });
    this.subscriber.on('reconnecting', evtReconnectingSub => {
      if(self.trace) {
        console.log('RedisPass::createRedisSubscriber_::evtReconnectingSub=<',evtReconnectingSub,'>');
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
      console.log('RedisPass::createRedisSubscriber_::this.subscriber=<',this.subscriber,'>');
    }
  }


  onRedisBroadcast_(topic,message) {
    if(this.trace) {
      console.log('RedisPass::onRedisBroadcast_::topic=<',topic,'>');
      console.log('RedisPass::onRedisBroadcast_::message=<',message,'>');
    }
  }
  onRedisAddress_(topic,message) {
    if(this.trace) {
      console.log('RedisPass::onRedisAddress_::topic=<',topic,'>');
      console.log('RedisPass::onRedisAddress_::message=<',message,'>');
    }
  }
}

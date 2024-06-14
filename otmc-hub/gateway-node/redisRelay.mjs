import { createClient } from 'redis';
export class RedisRelay {
  constructor(config) {
    this.trace = true;
    this.debug = true;
    this.redisUnxiPath = `${config.store}/redis/redis.otmc.hub.sock`;
    if(this.trace) {
      console.log('RedisRelay::constructor::this.redisUnxiPath=<',this.redisUnxiPath,'>');
    }
    this.createRediClient_();
  }
  async createRediClient_() {
    const clientOpt = {
      socket:{
        path:this.redisUnxiPath
      }
    };
    if(this.trace) {
      console.log('RedisRelay::createRediClient_::clientOpt=<',clientOpt,'>');
    }
    this.client = createClient(clientOpt);
    const self = this;
    this.client.on('error', err => {
      if(self.trace) {
        console.log('RedisRelay::createRediClient_::err=<',err,'>');
      }
    });
    this.client.on('connect', evtConnect => {
      if(self.trace) {
        console.log('RedisRelay::createRediClient_::evtConnect=<',evtConnect,'>');
      }
    });
    this.client.on('ready', evtReady => {
      if(self.trace) {
        console.log('RedisRelay::createRediClient_::evtReady=<',evtReady,'>');
      }
    });
    this.client.on('end', evtEnd => {
      if(self.trace) {
        console.log('RedisRelay::createRediClient_::evtEnd=<',evtEnd,'>');
      }
    });
    this.client.on('reconnecting', evtReconnecting => {
      if(self.trace) {
        console.log('RedisRelay::createRediClient_::evtReconnecting=<',evtReconnecting,'>');
      }
    });
    this.client.connect();
    if(this.trace) {
      console.log('RedisRelay::createRediClient_::this.client=<',this.client,'>');
    }
    this.subscriber = this.client.duplicate();
    this.subscriber.on('error', errSub => {
      if(self.trace) {
        console.log('RedisRelay::createRediClient_::errSub=<',errSub,'>');
      }
    });
    if(this.trace) {
      console.log('RedisRelay::createRediClient_::this.subscriber=<',this.subscriber,'>');
    }
    this.subscriber.on('connect', evtConnectSub => {
      if(self.trace) {
        console.log('RedisRelay::createRediClient_::evtConnectSub=<',evtConnectSub,'>');
      }
    });
    this.subscriber.on('ready', evtReadySub => {
      if(self.trace) {
        console.log('RedisRelay::createRediClient_::evtReadySub=<',evtReadySub,'>');
      }
    });
    this.subscriber.on('end', evtEndSub => {
      if(self.trace) {
        console.log('RedisRelay::createRediClient_::evtEndSub=<',evtEndSub,'>');
      }
    });
    this.subscriber.on('reconnecting', evtReconnectingSub => {
      if(self.trace) {
        console.log('RedisRelay::createRediClient_::evtReconnectingSub=<',evtReconnectingSub,'>');
      }
    });
    const listener = (message, channel) => {
      self.onRedisBroadcast_(channel,message);
    };
    this.subscriber.pSubscribe('broadcast/*', listener);
    const listener2 = (message, channel) => {
      self.onRedisAddress_(channel,message);
    };
    this.subscriber.pSubscribe('address/*', listener2);
    this.subscriber.connect();
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

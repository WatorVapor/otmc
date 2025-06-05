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
  async relayMqttPublicMsg(topic,payload) {
    if(this.trace0) {
      console.log('RedisPassAgent::relayMqttPublicMsg::topic=<',topic,'>');
      console.log('RedisPassAgent::relayMqttPublicMsg::payload=<',payload,'>');
    }
    const topicOut = `/omtc/cloud/2/local/public/${topic}`;
    if(this.trace0) {
      console.log('RedisPassAgent::relayMqttPublicMsg::topicOut=<',topicOut,'>');
    }
    if(this.trace0) {
      console.log('RedisPassAgent::relayMqttPublicMsg::this.client=<',this.client,'>');
    }
    await this.client.publish(topicOut,JSON.stringify(payload),(err)=>{
      if(err) {
        console.error('RedisPassAgent::relayMqttPublicMsg::err=<',err,'>');
      }
    });
  }
  async relayMqttSecretMsg(topic,payload) {
    if(this.trace0) {
      console.log('RedisPassAgent::relayMqttSecretMsg::topic=<',topic,'>');
      console.log('RedisPassAgent::relayMqttSecretMsg::payload=<',payload,'>');
    }
    const topicOut = `/omtc/cloud/2/local/secret/${topic}`;
    if(this.trace0) {
      console.log('RedisPassAgent::relayMqttSecretMsg::topicOut=<',topicOut,'>');
    }
    if(this.trace0) {
      console.log('RedisPassAgent::relayMqttSecretMsg::this.client=<',this.client,'>');
    }
    await this.client.publish(topicOut,JSON.stringify(payload),(err)=>{
      if(err) {
        console.error('RedisPassAgent::relayMqttSecretMsg::err=<',err,'>');
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
    const listener = (message, channel) => {
      self.onRedisBroadcast_(channel,message);
    };
    this.subscriber.pSubscribe('/omtc/local/2/cloud/broadcast/*', listener);
    const listener2 = (message, channel) => {
      self.onRedisAddress_(channel,message);
    };
    this.subscriber.pSubscribe('/omtc/local/2/cloud/address/*', listener2);
    this.subscriber.connect();
    if(this.trace0) {
      console.log('RedisPassAgent::createRedisSubscriber_::this.subscriber=<',this.subscriber,'>');
    }
  }


  onRedisBroadcast_(topic,message) {
    if(this.trace) {
      console.log('RedisPassAgent::onRedisBroadcast_::topic=<',topic,'>');
      console.log('RedisPassAgent::onRedisBroadcast_::message=<',message,'>');
    }
  }
  onRedisAddress_(topic,message) {
    if(this.trace) {
      console.log('RedisPassAgent::onRedisAddress_::topic=<',topic,'>');
      console.log('RedisPassAgent::onRedisAddress_::message=<',message,'>');
    }
  }
}

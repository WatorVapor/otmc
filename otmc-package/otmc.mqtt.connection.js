import { default as mqtt } from 'mqtt';
//console.log('::::mqtt=:<',mqtt,'>');
import { MqttJWTAgent } from './otmc.mqtt.jwt.js';

const LEVEL_OPT = {
  keyEncoding: 'utf8',
  valueEncoding: 'utf8',
};


/**
*
*/
export class MqttConnection {
  constructor(ee) {
    this.trace0 = false;
    this.trace1 = false;
    this.trace = false;
    this.debug = true;
    this.isRequestingJwt = false;
    this.ee = ee;
    this.jwt = new MqttJWTAgent(ee);
    this.otmc = false;
    this.auth = false;
    this.base32 = false;
    this.util = false;
    this.ListenEventEmitter_();
    this.msgQueue = [];
  }
  ListenEventEmitter_() {
    if(this.trace0) {
      console.log('MqttConnection::ListenEventEmitter_::this.ee=:<',this.ee,'>');
    }
    const self = this;
    this.ee.on('sys.authKey.ready',(evt)=>{
      if(self.trace0) {
        console.log('MqttConnection::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.otmc = evt.otmc;
      self.auth = evt.auth;
      self.base32 = evt.base32;
      self.util = evt.util;
    });
    this.ee.on('mqtt.connectMqtt',(evt)=>{
      if(self.trace) {
        console.log('MqttConnection::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.connectMqtt();
    });
    this.ee.on('otmc.mqtt.publish',(evt)=>{
      if(self.trace) {
        console.log('MqttConnection::ListenEventEmitter_::evt=:<',evt,'>');
      }
      const msgPack = self.otmc.did.packMessage(evt.msg);
      if(self.trace) {
        console.log('MqttConnection::ListenEventEmitter_::msgPack=:<',msgPack,'>');
      }
      self.publish(msgPack.topic,msgPack,evt.option);
    });
    this.ee.on('mqtt.jwt.ready',(evt)=>{
      if(self.trace) {
        console.log('MqttConnection::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.mqttJwt = evt;
      self.connectMqtt();
    });
    this.ee.on('otmc.mqtt.encrypt.channel.refresh',(evt)=>{
      if(self.trace) {
        console.log('MqttConnection::ListenEventEmitter_::evt=:<',evt,'>');
      }
      this.otmc.emit('otmc.mqtt.encrypt.channel.refresh',evt);
    });
  }

  async freshMqttJwt() {
    this.jwt.validateMqttJwt();
  }
  connectMqtt() {
    if(this.trace0) {
      console.log('MqttConnection::connectMqtt::this.otmc=:<',this.otmc,'>');
    }
    if(!this.mqttJwt) {
      this.jwt.validateMqttJwt();
      return;
    }
    if(this.debug) {
      console.log('MqttConnection::connectMqtt::this.mqttJwt=:<',this.mqttJwt,'>');
    }
    this.createMqttConnection_();
  }
  publish(topic,msgData,option) {
    if(this.trace0) {
      console.log('MqttConnection::publish::topic=:<',topic,'>');
      console.log('MqttConnection::publish::msgData=:<',msgData,'>');
    }
    if(this.mqttClient_ && this.mqttClient_.connected) {
      this.mqttClient_.publish(topic,JSON.stringify(msgData),option,(err) => {
        if(err) {
          console.error('MqttConnection::publish::err=:<',err,'>');
        } else {
          if(this.trace0) {
            console.log('MqttConnection::publish::published');
          }
        }
      });
    } else {
      if(this.trace0) {
        console.log('MqttConnection::publish::not connected');
      }
      this.msgQueue.push({topic:topic,msgData:msgData,option:option});
    }
  }
  
  
  createMqttConnection_() {
    if(this.trace0) {
    }
    this.isRequestingJwt = false;
    if(this.mqttClient_) {
      if(this.debug) {
        console.log('MqttConnection::createMqttConnection_:this.mqttClient_.connected=<',this.mqttClient_.connected,'>');
        console.log('MqttConnection::createMqttConnection_:this.mqttClient_.disconnecting=<',this.mqttClient_.disconnecting,'>');
        console.log('MqttConnection::createMqttConnection_:this.mqttClient_.reconnecting=<',this.mqttClient_.reconnecting,'>');
      }  
      if(this.mqttClient_.connected) {
        return;
      }
      if(!this.mqttClient_.reconnecting) {
        return;
      }
    }
    const self = this;
    const options = {
      // Authentication
      //clientId: `${this.util.randomAddress()}@${this.mqttJwt.payload.clientid}`,
      clientId: `${this.mqttJwt.payload.clientid}`,
      username: this.mqttJwt.payload.username,
      password: this.mqttJwt.jwt,
      protocolVersion:5,
      reconnectPeriod:1000*5,
      keepalive: 60*30,
      connectTimeout: 4000,
      clean: false,
      rejectUnauthorized: true
    };
    if(this.trace) {
      console.log('MqttConnection::createMqttConnection_:options=<',options,'>');
    }
    let srvUrl = false;
    if(this.otmc.isNode) {
      srvUrl = this.mqttJwt.payload.mqtt.portal.tls;
    } else {
      srvUrl = this.mqttJwt.payload.mqtt.portal.wss;
      options.transformWsUrl =(url, options, client) => {
        if(self.trace) {
          console.log('MqttConnection::transformWsUrl::url=<',url,'>');
          console.log('MqttConnection::transformWsUrl::options=<',options,'>');
          console.log('MqttConnection::transformWsUrl::client=<',client,'>');
        }
        client.options.password = self.mqttJwt.jwt;
        return url;
      }
    }
    if(this.trace) {
      console.log('MqttConnection::createMqttConnection_:srvUrl=<',srvUrl,'>');
    }
    const mqttClient = mqtt.connect(srvUrl,options);
    mqttClient.on('connect', (connack) => {
      if(self.trace) {
        console.log('MqttConnection::createMqttConnection_::connect connack=<',connack,'>');
      }
      if(self.trace) {
        console.log('MqttConnection::createMqttConnection_::mqttClient.connected=<',mqttClient.connected,'>');
      }
      self.otmc.emit('mqtt:connected');
      self.ee.emit('OtmcStateMachine.actor.send',{type:'mqtt:connected'});
      if(!self.firstConnected) { 
        setTimeout(() => {
          self.runSubscriber_();
        },1);
        setTimeout(() => {
          self.rollOutCached_();
        },1000);
        self.firstConnected = true;
      }
    });
    mqttClient.on('disconnect', (connack) => {
      if(self.trace) {
        console.log('MqttConnection::createMqttConnection_::disconnect connack=<',connack,'>');
      }
      if(self.trace) {
        console.log('MqttConnection::createMqttConnection_::mqttClient.connected=<',mqttClient.connected,'>');
      }
    });
    mqttClient.on('reconnect', () => {
      if(self.trace) {
        console.log('MqttConnection::createMqttConnection_ reconnect');
      }
      this.mqttClient_.options.password = self.mqttJwt.jwt;
    });
    mqttClient.on('error', (err) => {
      console.log('MqttConnection::createMqttConnection_::err.message=<',err.message,'>');
      console.log('MqttConnection::createMqttConnection_::err.name=<',err.name,'>');
      console.log('MqttConnection::createMqttConnection_::err.code=<',err.code,'>');
      if(err.code === 134) {
        self.jwt.validateMqttJwt();
      }
    });
    mqttClient.on('offline', () => {
      if(self.trace) {
        console.log('MqttConnection::createMqttConnection_::offline new Date() =<',new Date(),'>');
      }
    });
    mqttClient.on('close', () => {
      if(self.trace) {
        console.log('MqttMessager::createMqttConnection_::close new Date()=<',new Date(),'>');
      }
      self.jwt.validateMqttJwt();
    });
    mqttClient.on('end', () => {
      if(self.trace) {
        console.log(':MqttConnection:createMqttConnection_::end new Date()=<',new Date(),'>');
      }
    });
    mqttClient.on('message', (topic, message, packet) => {
      if(self.trace0) {
        console.log('MqttConnection::createMqttConnection_::message topic=<',topic,'>');
        console.log('MqttConnection::createMqttConnection_::message message=<',message,'>');
      }
      try {
        const msgUtf8 = message.toString('utf-8');
        const msgJson = JSON.parse(msgUtf8);
        self.onMqttMessage_(topic, msgJson);
      } catch( err ){
        console.error('MqttConnection::createMqttConnection_::message err=<',err,'>');
      }
    });
    mqttClient.on('packetsend', (packet) => {
      if(self.trace1) {
        console.log('MqttConnection::createMqttConnection_::packetsend packet=<',packet,'>');
      }
    });
    mqttClient.on('packetreceive', (packet) => {
      if(self.trace0) {
        console.log('MqttConnection::createMqttConnection_::packetreceive packet=<',packet,'>');
      }
    });
    this.mqttClient_ = mqttClient;
  }

  runSubscriber_() {
    if(this.trace) {
      console.log('MqttConnection::runSubscriber_::this.mqttClient_.connected=<',this.mqttClient_.connected,'>');
      console.log('MqttConnection::runSubscriber_:this.mqttJwt.payload=<',this.mqttJwt.payload,'>');
    }
    const subOpt = {qos: 0,nl:true};
    const self = this;
    const subCallBack = (err, granted) => {
      if(self.trace) {
        console.log('MqttConnection::runSubscriber_:err=<',err,'>');
        console.log('MqttConnection::runSubscriber_:granted=<',granted,'>');
      }
      if(err) {
        console.log('MqttConnection::runSubscriber_:err=<',err,'>');
        console.log('MqttConnection::runSubscriber_:granted=<',granted,'>');
      }
    }
    if(this.mqttJwt.payload && this.mqttJwt.payload.acl.all && this.mqttJwt.payload.acl.all.length > 0 ) {
      this.mqttClient_.subscribe(this.mqttJwt.payload.acl.all,subOpt,subCallBack);
    }
    if(this.mqttJwt.payload && this.mqttJwt.payload.acl.sub && this.mqttJwt.payload.acl.sub.length > 0 ) {
      this.mqttClient_.subscribe(this.mqttJwt.payload.acl.sub,subOpt,subCallBack);
    }
    
    if(this.mqttJwt.payload && this.mqttJwt.payload.acl && this.mqttJwt.payload.acl.length > 0 ) {
      for(const aclPart of this.mqttJwt.payload.acl) {
        if(this.trace) {
          console.log('MqttConnection::runSubscriber_:aclPart=<',aclPart,'>');
        }
        if(aclPart.action === 'all' || aclPart.action === 'subscribe') {
          const subOpt2 = {qos: 0,nl:true};
          if(aclPart.qos && aclPart.qos.length > 0) {
            for(const aclQos of aclPart.qos) {
              subOpt2.qos = aclQos;
              if(aclPart.permission === 'allow') {
                this.mqttClient_.subscribe(aclPart.topic,subOpt2,subCallBack);
              }              
            }
          } else {
            if(aclPart.permission === 'allow') {
              this.mqttClient_.subscribe(aclPart.topic,subOpt2,subCallBack);
            }
          }
        }
      }
    }    
  }

  rollOutCached_() {
    if(this.trace) {
      console.log('MqttConnection::rollOutCached_:this.msgQueue=<',this.msgQueue,'>');
    }
    if(this.msgQueue.length > 0) {
      const msg = this.msgQueue.shift();
      this.publish(msg.topic,msg.msgData,msg.option);
      const self = this;
      setTimeout(() => {
        self.rollOutCached_();
      },1000);
    }
  }

  onMqttMessage_(topic, msgJson) {
    if(this.trace0) {
      console.log('MqttConnection::onMqttMessage_:topic=<',topic,'>');
      console.log('MqttConnection::onMqttMessage_:msgJson=<',msgJson,'>');
    }
    if(this.trace0) {
      console.log('MqttConnection::onMqttMessage_:this.auth=<',this.auth,'>');
    }
    this.ee.emit('mqtt.message.raw',{topic:topic,msgJson:msgJson});
  }
  
}

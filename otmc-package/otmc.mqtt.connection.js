import { default as mqtt } from 'mqtt';
//console.log('::::mqtt=:<',mqtt,'>');
import { MqttJWTAgent } from './otmc.mqtt.jwt.js';
import { MqttConnectionState } from './otmc.mqtt.connection.state.js';

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
    this.trace2 = false;
    this.trace = true;
    this.debug = true;
    this.isMineConnecting = false;
    this.ee = ee;
    this.jwt = new MqttJWTAgent(ee);
    this.state = new MqttConnectionState(ee);
    this.otmc = false;
    this.auth = false;
    this.base32 = false;
    this.util = false;
    this.ListenEventEmitter_();
    this.ListenActionEventEmitter_();
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
    this.ee.on('mqtt.jwt.ready',(evt)=>{
      if(self.trace) {
        console.log('MqttConnection::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.mqttJwt = evt;
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
    this.ee.on('otmc.mqtt.encrypt.channel.refresh',(evt)=>{
      if(self.trace) {
        console.log('MqttConnection::ListenEventEmitter_::evt=:<',evt,'>');
      }
      this.otmc.emit('otmc.mqtt.encrypt.channel.refresh',evt);
    });
    this.ee.on('mqtt.state.action.jwt.refreshing',(evt)=>{
      if(self.trace) {
        console.log('MqttConnection::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.freshMqttJwt();
    });
  }

  ListenActionEventEmitter_() {
    if(this.trace0) {
      console.log('MqttConnection::ListenActionEventEmitter_::this.ee=:<',this.ee,'>');
    }
    const self = this;
    //
    this.ee.on('mqtt.state.action.connect',(evt)=>{
      if(self.trace) {
        console.log('MqttConnection::ListenActionEventEmitter_::evt=:<',evt,'>');
      }
      setTimeout( () => {
        self.connectMqtt();
      },5);
    });

    this.ee.on('mqtt.state.action.connected',(evt)=>{
      if(self.trace) {
        console.log('MqttConnection::ListenEventEmitter_::evt=:<',evt,'>');
      }
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
  }

  async freshMqttJwt() {
    this.jwt.validateMqttJwt();
  }
  connectMqtt() {
    if(this.trace0) {
      console.log('MqttConnection::connectMqtt::this.otmc=:<',this.otmc,'>');
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
    this.notifyStateEvt_('connecting');
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
    }
    const self = this;
    options.transformWsUrl =(url, options, client) => {
      if(self.trace) {
        console.log('MqttConnection::transformWsUrl::url=<',url,'>');
        console.log('MqttConnection::transformWsUrl::options=<',options,'>');
        console.log('MqttConnection::transformWsUrl::client=<',client,'>');
      }
      client.options.password = self.mqttJwt.jwt;
      return url;
    }
    if(this.trace) {
      console.log('MqttConnection::createMqttConnection_:srvUrl=<',srvUrl,'>');
    }
    const mqttClient = mqtt.connect(srvUrl,options);
    this.processMqttConnection_(mqttClient);
    this.mqttClient_ = mqttClient;
  }
  processMqttConnection_(mqttClient) {
    const self = this;
    mqttClient.on('connect', (connack) => {
      if(self.trace) {
        console.log('MqttConnection::processMqttConnection_::connect connack=<',connack,'>');
      }
      if(self.trace) {
        console.log('MqttConnection::processMqttConnection_::mqttClient.connected=<',mqttClient.connected,'>');
      }
      self.otmc.emit('mqtt:connected');
      self.ee.emit('OtmcStateMachine.actor.send',{type:'mqtt:connected'});
      self.notifyStateEvt_('connected');
    });
    mqttClient.on('disconnect', (connack) => {
      if(self.trace) {
        console.log('MqttConnection::processMqttConnection_::disconnect connack=<',connack,'>');
      }
      if(self.trace) {
        console.log('MqttConnection::processMqttConnection_::mqttClient.connected=<',mqttClient.connected,'>');
      }
      self.notifyStateEvt_('disconnect');
    });
    mqttClient.on('reconnect', () => {
      if(self.trace) {
        console.log('MqttConnection::processMqttConnection_ reconnect');
        console.log('MqttConnection::processMqttConnection_ reconnect self.mqttJwt=<',self.mqttJwt,'>');
      }
      this.mqttClient_.options.password = self.mqttJwt.jwt;
      self.notifyStateEvt_('reconnect');
    });
    mqttClient.on('error', (err) => {
      console.log('MqttConnection::processMqttConnection_::err.message=<',err.message,'>');
      console.log('MqttConnection::processMqttConnection_::err.name=<',err.name,'>');
      console.log('MqttConnection::processMqttConnection_::err.code=<',err.code,'>');
      if(err.code === 134) {
        self.notifyStateEvt_('jwt.refresh');
      }
    });
    mqttClient.on('offline', () => {
      if(self.trace) {
        console.log('MqttConnection::processMqttConnection_::offline new Date() =<',new Date(),'>');
      }
      self.notifyStateEvt_('offline');
    });
    mqttClient.on('close', () => {
      if(self.trace) {
        console.log('MqttMessager::processMqttConnection_::close new Date()=<',new Date(),'>');
      }
      self.notifyStateEvt_('close');
    });
    mqttClient.on('end', () => {
      if(self.trace) {
        console.log(':MqttConnection:processMqttConnection_::end new Date()=<',new Date(),'>');
      }
      self.notifyStateEvt_('end');
    });
    mqttClient.on('packetsend', (packet) => {
      if(self.trace1) {
        console.log('MqttConnection::processMqttConnection_::packetsend packet=<',packet,'>');
      }
    });
    mqttClient.on('packetreceive', (packet) => {
      if(self.trace0) {
        console.log('MqttConnection::processMqttConnection_::packetreceive packet=<',packet,'>');
      }
    });


    mqttClient.on('message', (topic, message, packet) => {
      if(self.trace0) {
        console.log('MqttConnection::processMqttConnection_::message topic=<',topic,'>');
        console.log('MqttConnection::processMqttConnection_::message message=<',message,'>');
        console.log('MqttConnection::processMqttConnection_::message packet=<',packet,'>');
      }
      try {
        const msgUtf8 = message.toString('utf-8');
        const msgJson = JSON.parse(msgUtf8);
        self.onMqttMessage_(topic, msgJson);
      } catch( err ){
        console.error('MqttConnection::processMqttConnection_::message err=<',err,'>');
      }
    });

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

  notifyStateEvt_(evt,payload) {
    this.ee.emit('mqtt.connect.state.event',{evt:`evt.${evt}`,payload:payload});
  }
  
}

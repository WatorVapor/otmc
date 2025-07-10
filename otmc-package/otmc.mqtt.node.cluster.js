import { MqttNodeRaftState } from './otmc.mqtt.node.raft.js';

const iConstRaftHeartBroadcastIntervalMs = 5000;
const iConstRaftHeartReceiverCheckIntervalMs = iConstRaftHeartBroadcastIntervalMs *2;

/**
*
*/
export class MqttNodeCluster {
  constructor(eeInternal) {
    this.ee = eeInternal;
    this.trace0 = true;
    this.trace = true;
    this.debug = true;
    this.raft = new MqttNodeRaftState(this.ee);
    this.ListenEventEmitter_();
    if(this.trace0) {
      console.log('MqttNodeCluster::constructor::this.ee=:<',this.ee,'>');
    }
    this.followerChecker = false;
    this.heartbeatReceived = {
      last : new Date(),
      count : 0,
    }
  }
  ListenEventEmitter_() {
    if(this.trace0) {
      console.log('MqttNodeCluster::ListenEventEmitter_::this.ee=:<',this.ee,'>');
    }
    const self = this;
    this.ee.on('sys.authKey.ready',(evt)=>{
      if(self.trace0) {
        console.log('MqttNodeCluster::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.otmc = evt.otmc;
      self.auth = evt.auth;
      self.base32 = evt.base32;
      self.util = evt.util;
    });
    this.ee.on('otmc.mqtt.connected',(evt)=>{
      if(self.trace0) {
        console.log('MqttNodeCluster::ListenEventEmitter_::evt=:<',evt,'>');
      }
      if(evt.first) {
        self.ee.emit('otmc.mqtt.node.raft.event',{type:'MQTT_CONNECTED'},{});
      }
    });
    this.ee.on('otmc.mqtt.node.raft.action',(evt)=>{
      if(self.trace0) {
        console.log('MqttNodeCluster::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.switchAction_(evt.type);
    });
  }
  switchAction_(actionType) {
    if(this.trace0) {
      console.log('MqttNodeCluster::switchAction_::actionType=:<',actionType,'>');
    }
    if(actionType === 'entry_follower') {
      this.startAsFollower_();
    }
    if(actionType === 'leave_follower') {
      this.stopAsFollower_();
    }
    if(actionType === 'entry_candidate') {
      this.startAsCandidate_();
    }
  }
  startAsFollower_() {
    const self = this;
    this.followerChecker = setInterval(()=>{
      self.checkRaftTimeout_();
    },iConstRaftHeartReceiverCheckIntervalMs);
  }
  stopAsFollower_() {
    if(this.followerChecker) {
      clearInterval(this.followerChecker);
      this.followerChecker = false;
    }
  }
  checkRaftTimeout_() {
    if(this.trace0) {
      console.log('MqttNodeCluster::checkRaftTimeout_::this.heartbeatReceived=:<',this.heartbeatReceived,'>');
    }
    const elapsed = new Date() - this.heartbeatReceived.last;
    if(this.trace0) {
      console.log('MqttNodeCluster::checkRaftTimeout_::elapsed=:<',elapsed,'>');
    }
    if(elapsed > iConstRaftHeartReceiverCheckIntervalMs) {
      this.ee.emit('otmc.mqtt.node.raft.event',{type:'HEATBEAT_TIMEOUT'},{});
    }
  }
  startAsCandidate_() {
    if(this.trace0) {
      console.log('MqttNodeCluster::startAsCandidate_::this.raft=:<',this.raft,'>');     
    }
  }
}

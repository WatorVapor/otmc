import { MqttNodeRaftState } from './otmc.mqtt.node.raft.js';

const iConstRaftHeartBroadcastIntervalMs = 5000;
const iConstRaftHeartReceiverCheckIntervalMs = iConstRaftHeartBroadcastIntervalMs *2;
const iConstRaftVoteDelayMs = iConstRaftHeartBroadcastIntervalMs/3;

const iConstNodeHeartBroadcastIntervalMs = 5000;


/**
* MqttNodeCluster
*
* @class MqttNodeCluster
* @constructor
* @param {EventEmitter} eeInternal 
*/
export class MqttNodeCluster {
  constructor(eeInternal) {
    this.ee = eeInternal;
    this.trace0 = true;
    this.trace1 = true;
    this.trace = true;
    this.debug = true;
    this.raft = new MqttNodeRaftState(this.ee);
    this.ListenEventEmitter_();
    if(this.trace0) {
      console.log('MqttNodeCluster::constructor::this.ee=:<',this.ee,'>');
    }
    this.nodeAnnounceInterval = false;
    this.nodeAnnounced = {};

    this.followerChecker = false;
    this.heartbeatReceived = {
      last : new Date(),
      count : 0,
    }
    this.voteRequestReceivedQue = [];
    this.term = 0;
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
        this.nodeAnnounceInterval = setInterval(()=>{
          self.nodeHeartbeatBroadcast_();
        },iConstNodeHeartBroadcastIntervalMs);
      }
    });
    this.ee.on('otmc.mqtt.node.raft.action',(evt)=>{
      if(self.trace0) {
        console.log('MqttNodeCluster::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.dispatchAction_(evt.type);
    });



    this.ee.on('teamspace/node/cluster/node/announce',(evt)=>{
      if(self.trace0) {
        console.log('MqttNodeCluster::ListenEventEmitter_::evt=:<',evt,'>');
      }  
      self.onNodeAnnounceReceived_(evt);
    });

    this.ee.on('teamspace/node/cluster/raft/vote/request',(evt)=>{
      if(self.trace0) {
        console.log('MqttNodeCluster::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.onVoteRequestReceived_(evt);
    });
    this.ee.on('teamspace/node/cluster/raft/vote/reply',(evt)=>{
      if(self.trace0) {
        console.log('MqttNodeCluster::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.onVoteReplyReceived_(evt);
    });

  }

  onNodeAnnounceReceived_(nodeAnnounceMsg) {
    if(this.trace0) {
      console.log('MqttNodeCluster::onNodeAnnounceReceived_::nodeAnnounceMsg=:<',nodeAnnounceMsg,'>');     
    }
    const nodeAnnounce = nodeAnnounceMsg.payload;
    if(this.trace0) {
      console.log('MqttNodeCluster::onNodeAnnounceReceived_::nodeAnnounce=:<',nodeAnnounce,'>');
    }
    const nodeId = nodeAnnounce.id;
    if(this.trace0) {
      console.log('MqttNodeCluster::onNodeAnnounceReceived_::nodeId=:<',nodeId,'>');
    }
    this.nodeAnnounced[nodeId] = new Date();
    if(this.trace0) {
      console.log('MqttNodeCluster::onNodeAnnounceReceived_::this.nodeAnnounced=:<',this.nodeAnnounced,'>');
    }
  }
  nodeHeartbeatBroadcast_() {
    const topic = 'teamspace/node/cluster/node/announce';
    const payload = {
      id : this.auth.address(),
    }
    if(this.trace0) {
      console.log('MqttNodeCluster::nodeHeartbeatBroadcast_::payload=:<',payload,'>');     
    }
    this.ee.emit('otmc.mqtt.publish',{msg:{topic:topic,payload:payload}});
  }


  dispatchAction_(actionType) {
    if(this.trace0) {
      console.log('MqttNodeCluster::dispatchAction_::actionType=:<',actionType,'>');
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
    const term = this.raft.getTerm();
    const topic = 'teamspace/node/cluster/raft/vote/request';
    const payload = {
      term : term,
      candidateId : this.auth.address(),
      weight : Math.random(),
    }
    if(this.trace0) {
      console.log('MqttNodeCluster::startAsCandidate_::payload=:<',payload,'>');     
    }
    this.ee.emit('otmc.mqtt.publish',{msg:{topic:topic,payload:payload}});
    // add to member vote request queue
    this.voteRequestReceivedQue.push(payload);
    const self = this;
    this.voteDelayTimer = setTimeout(()=>{
      self.dealVoteRequestWithDelay_();
    },iConstRaftVoteDelayMs);
  }
  onVoteRequestReceived_(voteMsg) {
    if(this.trace0) {
      console.log('MqttNodeCluster::onVoteRequestReceived_::voteMsg=:<',voteMsg,'>');     
    }
    const votePayload = voteMsg.payload;
    if(this.trace0) {
      console.log('MqttNodeCluster::onVoteRequestReceived_::votePayload=:<',votePayload,'>');     
    }
    this.voteRequestReceivedQue.push(votePayload);
    if(this.trace0) {
      console.log('MqttNodeCluster::onVoteRequestReceived_::this.voteRequestReceivedQue=:<',this.voteRequestReceivedQue,'>');
    }
    // cancel old vote rollout timer
    if(this.voteDelayTimer) {
      clearTimeout(this.voteDelayTimer);
      this.voteDelayTimer = false;
    }
    // restart new vote rollout timer
    const self = this;
    this.voteDelayTimer = setTimeout(()=>{
      self.dealVoteRequestWithDelay_();
    },iConstRaftVoteDelayMs);
  }
  dealVoteRequestWithDelay_() {
    if(this.trace0) {
      console.log('MqttNodeCluster::dealVoteRequestWithDelay_::this.voteRequestReceivedQue=:<',this.voteRequestReceivedQue,'>');
    }
    const termLocal = this.raft.getTerm();
    if(this.trace0) {
      console.log('MqttNodeCluster::dealVoteRequestWithDelay_::termLocal=:<',termLocal,'>');
    }
    for(let vote of this.voteRequestReceivedQue) {
      console.log('MqttNodeCluster::dealVoteRequestWithDelay_::vote=:<',vote,'>');
      if(vote.term > termLocal) {
        this.ee.emit('otmc.mqtt.node.raft.event',{type:'DISCOVER_HIGHER_TERM'},{term:this.term});
      }
      if(vote.term === termLocal) {
        this.ee.emit('otmc.mqtt.node.raft.event',{type:'VOTE_GRANTED'},{});
      }
      if(vote.term < termLocal) {
        this.refuseVoteRequest_(vote,`older term,current term=${termLocal}`);
      }
    }
  }
  refuseVoteRequest_(vote,reason) {
    console.log('MqttNodeCluster::refuseVoteRequest_::vote=:<',vote,'>');
    console.log('MqttNodeCluster::refuseVoteRequest_::reason=:<',reason,'>');
    const topic = 'teamspace/node/cluster/raft/vote/reply';
    const payload = {
      term : vote.term,
      candidateId : vote.candidateId,
      replyFrom : this.auth.address(),
      voteGranted : false,
      reason : reason,
    }
    if(this.trace0) {
      console.log('MqttNodeCluster::refuseVoteRequest_::payload=:<',payload,'>');     
    }
    this.ee.emit('otmc.mqtt.publish',{msg:{topic:topic,payload:payload}});
  }
  onVoteReplyReceived_(voteReplyMsg) {
    if(this.trace0) {
      console.log('MqttNodeCluster::onVoteReplyReceived_::voteReplyMsg=:<',voteReplyMsg,'>');     
    }
  }
}

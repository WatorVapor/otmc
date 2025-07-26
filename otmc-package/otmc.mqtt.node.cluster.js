import { MqttNodeRaftState } from './otmc.mqtt.node.raft.js';

const iConstRaftHeartBroadcastIntervalMs = 5000;
const iConstRaftHeartReceiverCheckIntervalMs = iConstRaftHeartBroadcastIntervalMs *2;
const iConstRaftHeartSentCheckIntervalMs = iConstRaftHeartBroadcastIntervalMs *2;
const iConstRaftVoteRequestDelayMs = iConstRaftHeartBroadcastIntervalMs/3;
const iConstRaftVoteReplyDelayMs = iConstRaftHeartBroadcastIntervalMs/3;

const iConstNodeHeartBroadcastIntervalMs = 5000;
const iConstRaftVoteAgreeRatio = 0.5;

const iConstRaftVoteDeadCheckIntervalMs = iConstRaftHeartBroadcastIntervalMs * 3;
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
    this.voteReplyReceivedQue = [];
    this.leaderChecker = false;
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
          self.checkDeadState_();
        },iConstNodeHeartBroadcastIntervalMs);
      }
    });
    this.ee.on('otmc.mqtt.node.raft.action',(evt,payload)=>{
      if(self.trace0) {
        console.log('MqttNodeCluster::ListenEventEmitter_::evt=:<',evt,'>');
        console.log('MqttNodeCluster::ListenEventEmitter_::payload=:<',payload,'>');
      }
      self.dispatchAction_(evt.type,payload);
    });



    // mqtt messages between nodes in cluster
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
    this.ee.on('teamspace/node/cluster/raft/heartbeat',(evt)=>{
      if(self.trace0) {
        console.log('MqttNodeCluster::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.onHeartbeatReceived_(evt);
    });

  }

  nodeHeartbeatBroadcast_() {
    const myNodeid = this.auth.address();
    const topic = 'teamspace/node/cluster/node/announce';
    const payload = {
      id : myNodeid,
    }
    if(this.trace0) {
      console.log('MqttNodeCluster::nodeHeartbeatBroadcast_::payload=:<',payload,'>');     
    }
    this.ee.emit('otmc.mqtt.publish',{msg:{topic:topic,payload:payload}});
    this.nodeAnnounced[myNodeid] = new Date();
    this.checkOfflineNode_();
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
  checkOfflineNode_() {
    for(const key in this.nodeAnnounced) {
      if(this.trace0) {
        console.log('MqttNodeCluster::checkOfflineNode_::key=:<',key,'>');
      }
      const elapsed_ms = new Date() - this.nodeAnnounced[key];
      if(this.trace0) {
        console.log('MqttNodeCluster::checkOfflineNode_::elapsed_ms=:<',elapsed_ms,'>');
      }
      if(elapsed_ms > iConstNodeHeartBroadcastIntervalMs * 2) {
        delete this.nodeAnnounced[key];
      }
    }
    if(this.trace0) {
      console.log('MqttNodeCluster::checkOfflineNode_::this.nodeAnnounced=:<',this.nodeAnnounced,'>');
    }
  }



  dispatchAction_(actionType,payload) {
    if(this.trace0) {
      console.log('MqttNodeCluster::dispatchAction_::actionType=:<',actionType,'>');
      console.log('MqttNodeCluster::dispatchAction_::payload=:<',payload,'>');
    }
    if(actionType === 'entry_follower') {
      this.startAsFollower_(payload);
    }
    if(actionType === 'leave_follower') {
      this.stopAsFollower_(payload);
    }
    if(actionType === 'entry_candidate') {
      this.startAsCandidate_(payload);
    }
    if(actionType === 'agree_vote') {
      this.agreeVoteRequest_(payload);
    }
    if(actionType === 'refuse_vote') {
      this.refuseVoteRequest_(payload);
    }
    if(actionType === 'entry_leader') {
      this.startAsLeader_(payload);
    }
    if(actionType === 'leave_leader') {
      this.stopAsLeader_(payload);
    }
  }
  startAsFollower_() {
    const self = this;
    this.followerChecker = setInterval(()=>{
      self.checkRaftHeartBeatTimeout_();
    },iConstRaftHeartReceiverCheckIntervalMs);
  }
  stopAsFollower_() {
    if(this.followerChecker) {
      clearInterval(this.followerChecker);
      this.followerChecker = false;
    }
  }
  checkRaftHeartBeatTimeout_() {
    if(this.trace0) {
      console.log('MqttNodeCluster::checkRaftHeartBeatTimeout_::this.heartbeatReceived=:<',this.heartbeatReceived,'>');
    }
    const elapsed = new Date() - this.heartbeatReceived.last;
    if(this.trace0) {
      console.log('MqttNodeCluster::checkRaftHeartBeatTimeout_::elapsed=:<',elapsed,'>');
    }
    if(elapsed > iConstRaftHeartReceiverCheckIntervalMs) {
      this.ee.emit('otmc.mqtt.node.raft.event',{type:'HEATBEAT_TIMEOUT'},{});
    }
  }
  startAsCandidate_(param) {
    if(this.trace0) {
      console.log('MqttNodeCluster::startAsCandidate_::param=:<',param,'>');
      console.log('MqttNodeCluster::startAsCandidate_::this.raft=:<',this.raft,'>');
    }
    const term = this.raft.getTerm();
    const topic = 'teamspace/node/cluster/raft/vote/request';
    const payload = {
      term : term,
      candidateId : this.auth.address(),
      weight : param.weight,
    }
    if(this.trace0) {
      console.log('MqttNodeCluster::startAsCandidate_::payload=:<',payload,'>');     
    }
    const self = this;
    const randomDelay = Math.floor(Math.random() * 1000);
    setTimeout(()=>{
      self.ee.emit('otmc.mqtt.publish',{msg:{topic:topic,payload:payload}});
      // add to member vote request queue
      self.voteRequestReceivedQue.push(payload);
      self.voteRequestDealDelayTimer = setTimeout(()=>{
        self.dealVoteRequestWithDelay_();
      },iConstRaftVoteRequestDelayMs);
    },randomDelay);
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
    if(this.voteRequestDealDelayTimer) {
      clearTimeout(this.voteRequestDealDelayTimer);
      this.voteRequestDealDelayTimer = false;
    }
    // restart new vote rollout timer
    const self = this;
    this.voteRequestDealDelayTimer = setTimeout(()=>{
      self.dealVoteRequestWithDelay_();
    },iConstRaftVoteRequestDelayMs);
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
      this.ee.emit('otmc.mqtt.node.raft.event',{type:'VOTE_REQUEST'},{vote:vote});
    }
  }
  agreeVoteRequest_(vote) {
    console.log('MqttNodeCluster::agreeVoteRequest_::vote=:<',vote,'>');
    const topic = 'teamspace/node/cluster/raft/vote/reply';
    const payload = {
      term : vote.term,
      candidateId : vote.candidateId,
      replyFrom : this.auth.address(),
      voteGranted : true,
    }
    if(this.trace0) {
      console.log('MqttNodeCluster::agreeVoteRequest_::payload=:<',payload,'>');     
    }
    this.ee.emit('otmc.mqtt.publish',{msg:{topic:topic,payload:payload}});
    this.voteReplyReceivedQue.push(payload);
    const self = this;
    if(this.voteReplyDealDelayTimer) {
      clearTimeout(this.voteReplyDealDelayTimer);
      self.voteReplyDealDelayTimer = false;
    }
    this.voteReplyDealDelayTimer = setTimeout(()=>{
      self.dealVoteReplyWithDelay_();
    },iConstRaftVoteReplyDelayMs);
  }  
  refuseVoteRequest_(vote,reason) {
    console.log('MqttNodeCluster::refuseVoteRequest_::vote=:<',vote,'>');
    const topic = 'teamspace/node/cluster/raft/vote/reply';
    const payload = {
      term : vote.term,
      candidateId : vote.candidateId,
      replyFrom : this.auth.address(),
      voteGranted : false,
      reason : vote.reason,
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
    this.voteReplyReceivedQue.push(voteReplyMsg.payload);
    const self = this;
    if(this.voteReplyDealDelayTimer) {
      clearTimeout(this.voteReplyDealDelayTimer);
      self.voteReplyDealDelayTimer = false;
    }
    this.voteReplyDealDelayTimer = setTimeout(()=>{
      self.dealVoteReplyWithDelay_();
    },iConstRaftVoteReplyDelayMs);
  }

  dealVoteReplyWithDelay_() {
    if(this.trace0) {
      console.log('MqttNodeCluster::dealVoteReplyWithDelay_::this.voteReplyReceivedQue=:<',this.voteReplyReceivedQue,'>');
    }
    const maxTerm = Math.max(...this.voteReplyReceivedQue.map(item => item.term));
    if(this.trace0) {
      console.log('MqttNodeCluster::dealVoteReplyWithDelay_::maxTerm=:<',maxTerm,'>');
    }
    const lastTermQue = this.voteReplyReceivedQue.filter(v => v.term === maxTerm);
    if(this.trace0) {
      console.log('MqttNodeCluster::dealVoteReplyWithDelay_::this.raft.getTerm()=:<',this.raft.getTerm(),'>');
      console.log('MqttNodeCluster::dealVoteReplyWithDelay_::lastTermQue=:<',lastTermQue,'>');
    }
    const grantedCount = lastTermQue.filter(v => v.voteGranted === true).length;
    if(this.trace0) {
      console.log('MqttNodeCluster::dealVoteReplyWithDelay_::grantedCount=:<',grantedCount,'>');
    }
    const totalNodes = Object.keys(this.nodeAnnounced).length;
    if(this.trace0) {
      console.log('MqttNodeCluster::dealVoteReplyWithDelay_::totalNodes=:<',totalNodes,'>');
    }
    const voteAgreeRatio = grantedCount / totalNodes;
    if(this.trace0) {
      console.log('MqttNodeCluster::dealVoteReplyWithDelay_::voteAgreeRatio=:<',voteAgreeRatio,'>');
    }
    if(voteAgreeRatio > iConstRaftVoteAgreeRatio) {
      console.log('MqttNodeCluster::dealVoteReplyWithDelay_::voteAgreeRatio>=iConstRaftVoteAgreeRatio,agree vote');
      this.ee.emit('otmc.mqtt.node.raft.event',{type:'VOTE_GRANTED'},{ratio:voteAgreeRatio});
    } else {
    }
  }

  startAsLeader_() {
    const self = this;
    this.leaderChecker = setInterval(()=>{
      self.sendRaftHeartBeat_();
    },iConstRaftHeartSentCheckIntervalMs);
  }
  stopAsLeader_() {
    if(this.leaderChecker) {
      clearInterval(this.leaderChecker);
      this.leaderChecker = false;
    }
  }
  sendRaftHeartBeat_() {
    const self = this;
    const payload = {
      term : self.raft.getTerm(),
      leaderId : self.auth.address(),
    }
    if(this.trace0) {
      console.log('MqttNodeCluster::sendRaftHeartBeat_::payload=:<',payload,'>');     
    }
    this.ee.emit('otmc.mqtt.publish',{msg:{topic:'teamspace/node/cluster/raft/heartbeat',payload:payload}});
  }
  onHeartbeatReceived_(heartbeatMsg) {
    if(this.trace0) {
      console.log('MqttNodeCluster::onHeartbeatReceived_::heartbeatMsg=:<',heartbeatMsg,'>');
    }
    this.heartbeatReceived.last = new Date();
    this.heartbeatReceived.term = heartbeatMsg.payload.term;
    this.heartbeatReceived.leaderId = heartbeatMsg.payload.leaderId;
    if(this.trace0) {
      console.log('MqttNodeCluster::onHeartbeatReceived_::heartbeatReceived=:<',this.heartbeatReceived,'>');
    }
    this.ee.emit('otmc.mqtt.node.raft.event',{type:'LEADER_HEARTBEAT'},{heartbeat:this.heartbeatReceived});
  }
  checkDeadState_() {
    const state = this.raft.getState();
    if(this.trace0) {
      console.log('MqttNodeCluster::checkDeadState_::state=:<',state,'>');
    }
    if(state === 'candidate_voting') {
      let elapsed = 0;
      if(this.lastDeadCheckTp) {
        elapsed = new Date() - this.lastDeadCheckTp;
        if(elapsed < iConstRaftVoteDeadCheckIntervalMs) {
          return;
        }
      } else {
        this.lastDeadCheckTp = new Date();
        return;
      }
      this.ee.emit('otmc.mqtt.node.raft.event',{type:'VOTE_DEADLOCK'},{elapsed:elapsed});
      this.lastDeadCheckTp = false;
    }
  }
}

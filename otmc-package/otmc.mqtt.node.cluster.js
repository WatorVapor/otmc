import { MqttNodeRaftState } from './otmc.mqtt.node.raft.js';

const iConstRaftHeartBroadcastIntervalMs = 5000;
const iConstRaftHeartReceiverCheckIntervalMs = iConstRaftHeartBroadcastIntervalMs *2;
const iConstRaftVoteDelayMs = iConstRaftHeartBroadcastIntervalMs/3;


/**
*
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
      }
    });
    this.ee.on('otmc.mqtt.node.raft.action',(evt)=>{
      if(self.trace0) {
        console.log('MqttNodeCluster::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.switchAction_(evt.type);
    });

    this.ee.on('teamspace/node/cluster/raft/vote/req',(evt)=>{
      if(self.trace0) {
        console.log('MqttNodeCluster::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.onVoteRequestReceived_(evt);
    });
    this.ee.on('teamspace/node/cluster/raft/vote/req',(evt)=>{
      if(self.trace0) {
        console.log('MqttNodeCluster::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.onVoteReceived_(evt);
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
    this.term++;
    const topic = 'teamspace/node/cluster/raft/vote/req';
    const payload = {
      term : this.term,
      candidateId : this.auth.address(),
      weight : Math.random(),
    }
    if(this.trace0) {
      console.log('MqttNodeCluster::startAsCandidate_::payload=:<',payload,'>');     
    }
    this.ee.emit('otmc.mqtt.publish',{msg:{topic:topic,payload:payload}});
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
      self.voteWithDelay_();
    },iConstRaftVoteDelayMs);
  }
  voteWithDelay_() {
    if(this.trace0) {
      console.log('MqttNodeCluster::voteWithDelay_::this.voteRequestReceivedQue=:<',this.voteRequestReceivedQue,'>');
    }
    for(let vote of this.voteRequestReceivedQue) {
      console.log('MqttNodeCluster::voteWithDelay_::vote=:<',vote,'>');
      if(vote.term > this.term) {
        this.term = vote.term;
        this.ee.emit('otmc.mqtt.node.raft.event',{type:'DISCOVER_HIGHER_TERM'},{term:this.term});
      }
      if(vote.term === this.term) {
        this.ee.emit('otmc.mqtt.node.raft.event',{type:'VOTE_GRANTED'},{});
      }
      if(vote.term < this.term) {
        this.refuseVote_(vote,`older term,current term=${this.term}`);
      }
    }
  }
  refuseVote_(vote,reason) {
    console.log('MqttNodeCluster::refuseVote_::vote=:<',vote,'>');
    console.log('MqttNodeCluster::refuseVote_::reason=:<',reason,'>');
    const topic = 'teamspace/node/cluster/raft/vote/reply';
    const payload = {
      term : vote.term,
      candidateId : vote.candidateId,
      voteGranted : false,
      reason : reason,
    }
    if(this.trace0) {
      console.log('MqttNodeCluster::refuseVote_::payload=:<',payload,'>');     
    }
    this.ee.emit('otmc.mqtt.publish',{msg:{topic:topic,payload:payload}});
  }
}

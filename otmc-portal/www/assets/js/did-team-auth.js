import { Evidence,ChainOfEvidence } from './did/evidence.js';
export class DIDTeamAuth {
  static trace = false;
  static debug = true;
  static name_ = null;
  constructor(cb) {
    this.cb_ = cb;
    this.cov_ = new ChainOfEvidence(cb);
    this.cov_.onJoinReq  = (jMsg) => {
      if(DIDTeamAuth.debug) {
        console.log('DIDTeamAuth::onJoinReq:jMsg=<',jMsg,'>');
      }
      if(typeof this.onJoinReq === 'function') {
        this.onJoinReq(jMsg);
      }
    }
    this.cov_.onJoinReply  = (jMsg) => {
      if(DIDTeamAuth.debug) {
        console.log('DIDTeamAuth::onJoinReply:jMsg=<',jMsg,'>');
      }
      if(typeof this.onJoinReply === 'function') {
        this.onJoinReply(jMsg);
      }
    }
  }
  pub() {
  }
  address() {
    return this.cov_.address();
  }
  static name() {
    DIDTeamAuth.name_ = localStorage.getItem(constDIDAuthName);
    return DIDTeamAuth.name_;
  }
  document() {
    return this.cov_.document();
  }
  static storeName(name) {
    DIDTeamAuth.name_ = name;
    localStorage.setItem(constDIDAuthName,name);
  }
  createDid(cb) {
    this.cov_.createSeed(cb);
  }
  joinDid(id,cb) {
    this.cov_.joinDid(id,cb);
  }
  isMember() {
    return this.cov_.isMember();
  }
  reqJoinTeam(passcode) {
    return this.cov_.reqJoinTeam(passcode);
  }
  allowJoinTeam(reqMsg) {
    return this.cov_.allowJoinTeam(reqMsg);
  }
  denyJoinTeam(reqMsg) {
    return this.cov_.denyJoinTeam(reqMsg);
  }
}

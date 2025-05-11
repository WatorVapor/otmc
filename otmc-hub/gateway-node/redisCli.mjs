import fs from 'fs';
const LOG = {
  trace0:false,
  trace:true,
  debug:true,
}



import { createClient } from 'redis';
export class RedisCli {
  constructor(config,otmc,readyCB) {
    this.trace0 = false;
    this.trace = true;
    this.debug = true;
    this.redisUnxiPath = `${config.store}/redis/redis.otmc.hub.sock`;
    this.readyCB_ = readyCB;
    this.otmc_ = otmc;
    this.config_ = config;
    if(this.trace) {
      console.log('RedisCli::constructor::this.redisUnxiPath=<',this.redisUnxiPath,'>');
    }
    this.createRedisClient_();
  }
  createRedisClient_() {
    const clientOpt = {
      socket:{
        path:this.redisUnxiPath
      }
    };
    if(this.trace) {
      console.log('RedisCli::createRedisClient_::clientOpt=<',clientOpt,'>');
    }
    this.client = createClient(clientOpt);
    const self = this;
    this.client.on('error', err => {
      if(self.trace) {
        console.log('RedisCli::createRedisClient_::err=<',err,'>');
      }
    });
    this.client.on('connect', evtConnect => {
      if(self.trace) {
        console.log('RedisCli::createRedisClient_::evtConnect=<',evtConnect,'>');
      }
    });
    this.client.on('ready', evtReady => {
      if(self.trace) {
        console.log('RedisCli::createRedisClient_::evtReady=<',evtReady,'>');
      }
      self.createRedisSubscriber_();
    });
    this.client.on('end', evtEnd => {
      if(self.trace) {
        console.log('RedisCli::createRedisClient_::evtEnd=<',evtEnd,'>');
      }
    });
    this.client.on('reconnecting', evtReconnecting => {
      if(self.trace) {
        console.log('RedisCli::createRedisClient_::evtReconnecting=<',evtReconnecting,'>');
      }
    });
    this.client.connect();
    if(this.trace0) {
      console.log('RedisCli::createRedisClient_::this.client=<',this.client,'>');
    }
  }
  createRedisSubscriber_() {
    this.subscriber = this.client.duplicate();
    const self = this;
    this.subscriber.on('error', errSub => {
      if(self.trace) {
        console.log('RedisCli::createRedisSubscriber_::errSub=<',errSub,'>');
      }
    });
    this.subscriber.on('connect', evtConnectSub => {
      if(self.trace) {
        console.log('RedisCli::createRedisSubscriber_::evtConnectSub=<',evtConnectSub,'>');
      }
    });
    this.subscriber.on('ready', evtReadySub => {
      if(self.trace) {
        console.log('RedisCli::createRedisSubscriber_::evtReadySub=<',evtReadySub,'>');
      }
      if(self.readyCB_) {
        self.ready = true;
        self.readyCB_();
      }
    });
    this.subscriber.on('end', evtEndSub => {
      if(self.trace) {
        console.log('RedisCli::createRedisSubscriber_::evtEndSub=<',evtEndSub,'>');
      }
    });
    this.subscriber.on('reconnecting', evtReconnectingSub => {
      if(self.trace) {
        console.log('RedisCli::createRedisSubscriber_::evtReconnectingSub=<',evtReconnectingSub,'>');
      }
    });
    const listener = (message, channel) => {
      self.onRedisCli_(channel,message);
    };
    this.subscriber.pSubscribe('/cli/exec/*', listener);
    this.subscriber.connect();
    if(this.trace) {
      console.log('RedisCli::createRedisSubscriber_::this.subscriber=<',this.subscriber,'>');
    }
  }


  onRedisCli_(topic,payload) {
    if(this.trace) {
      console.log('RedisCli::onRedisCli_::topic=<',topic,'>');
      console.log('RedisCli::onRedisCli_::payload=<',payload,'>');
    }
    const subcommand = topic.replace('/cli/exec/','');
    if(this.trace) {
      console.log('RedisCli::onRedisCli_::subcommand=<',subcommand,'>');
    }
    const params = JSON.parse(payload);
    if(this.trace) {
      console.log('RedisCli::onRedisCli_::params=<',params,'>');
    }
    this.execSubcommand(subcommand,params);
  }
  execSubcommand(subcommand,values) {
    console.log('RedisCli::execSubcommand::subcommand=<',subcommand,'>');
    const replyTopic = `/cli/reply/${subcommand}/result`;
    console.log('RedisCli::execSubcommand::replyTopic=<',replyTopic,'>');
    const self = this;
    switch (subcommand) {
      case 'gen.key':
        console.log('RedisCli::execSubcommand::gen.key');
        this.otmc_.startMining();
        this.otmc_.on('edcrypt:didKeyList',(evt)=>{
          console.log(':RedisCli::execSubcommand::evt=:<',evt,'>');
          self.client.publish(replyTopic,JSON.stringify(evt));
        });
        break;
      case 'list.key':
        console.log('RedisCli::execSubcommand::list.key');
        this.otmc_.listKeys();      
        this.otmc_.on('edcrypt:listEdKey',(keyList)=>{
          //console.log('RedisCli::execSubcommand::keyList=:<',keyList,'>');
          self.client.publish(replyTopic,JSON.stringify(keyList));
        });
        break;
      case 'switch.team':
        console.log('RedisCli::execSubcommand::switch.team');
        this.switchTeam(values.address);
        this.client.publish(replyTopic,JSON.stringify({success:true}));
        break;
      case 'create.seed':
        console.log('RedisCli::execSubcommand::create.seed');
        this.createSeed(values.controller);
        this.otmc_.on('did:document:created',(document)=>{
          console.log('RedisCli::did:document:created::document:=<',document,'>');
          self.client.publish(replyTopic,JSON.stringify(document));
        });
        break;
      case 'join.auth':
        console.log('RedisCli::execSubcommand::join.auth');
        this.joinAuth(values.team);
        this.otmc_.on('did:document:created',(document)=>{
          console.log('RedisCli::did:document:created::document:=<',document,'>');
          self.client.publish(replyTopic,JSON.stringify(document));
        });
        break;
      case 'join.guest':
        console.log('RedisCli::execSubcommand::join.guest');
        this.joinGuest(values.team);
        this.otmc_.on('did:document:created',(document)=>{
          console.log('RedisCli::did:document:created::document:=<',document,'>');
          self.client.publish(replyTopic,JSON.stringify(document));
        });
        break;  
      case 'join.request':
          console.log('RedisCli::execSubcommand::join.request');
          this.joinRequest();
          /*
          this.otmc_.on('did:document:created',(document)=>{
            console.log('RedisCli::did:document:created::document:=<',document,'>');
            self.client.publish(replyTopic,JSON.stringify(document));
          });
          */
          break;    
      case 'team.status':
          console.log('RedisCli::execSubcommand::team.status');
          console.log('RedisCli::did:document:created::this.otmc_.did:=<',this.otmc_.did,'>');
          const teamStatus = {
            address:this.readSelected(),
          };
          if(this.otmc_ && this.otmc_.did) {
            if(this.otmc_.did.status) {
              teamStatus.status = this.otmc_.did.status;
            }
            if(this.otmc_.did.didDoc_ && this.otmc_.did.didDoc_.id) {
              teamStatus.team = this.otmc_.did.didDoc_.id;
            }
          }
          this.client.publish(replyTopic,JSON.stringify(teamStatus));
          break;  
      default:
        this.client.publish(replyTopic,JSON.stringify({success:true}));
        console.log('RedisCli::execSubcommand::default');
    }
  }
  switchTeam (address){
    console.log('RedisCli::switchTeam:address=<',address,'>');
    console.log('RedisCli::switchTeam::address=<',address,'>');
    const storePath = this.config_.store;
    console.log('RedisCli::switchTeam::storePath=<',storePath,'>');
    const selectedKey = `${storePath}/didteam/didKey.selected.json`;
    const path = `${storePath}/didteam`;
    fs.mkdirSync(path,{recursive:true});
    console.log('RedisCli::switchTeam::v=<',selectedKey,'>');
    const storeStr = JSON.stringify({address:address});
    fs.writeFileSync(selectedKey,storeStr);
  }
  
  createSeed(controller){
    console.log('RedisCli::createSeed:controller=<',controller,'>'); 
    const controllerJson = [];
    let uniquecontrollerJson = [];
    if(controller) {
      const ctlList = controller.split(',');
      console.log('RedisCli::createSeed::ctlList=<',ctlList,'>');
      for ( let i = 0; i < ctlList.length; i++ ) {
        const ctl = ctlList[i];
        console.log('RedisCli::createSeed::ctl=<',ctl,'>');
        controllerJson.push(ctl.trim());
      }
      console.log('RedisCli::createSeed::controllerJson=<',controllerJson,'>');
      uniquecontrollerJson = [...new Set(controllerJson)];
      console.log('RedisCli::createSeed::uniquecontrollerJson=<',uniquecontrollerJson,'>');
    }
    //
    this.otmc_.createDidTeamFromSeedCtrler(uniquecontrollerJson,true);     
  }
  
  joinAuth (team) {
    console.log('RedisCli::joinAuth:team=<',team,'>');
    this.otmc_.joinDidTeamAsAuth(team);  
  }
  
  joinGuest (team) {
    console.log('RedisCli::joinGuest:team=<',team,'>');
    this.otmc_.joinDidTeamAsGuest(team);  
  }
  joinRequest() {
    if(this.otmc_ && this.otmc_.did) {
      if(this.otmc_.did.status) {
        console.log('RedisCli::joinRequest:this.otmc_.did.status=<',this.otmc_.did.status,'>');
        this.otmc_.createJoinTeamVCR(this.otmc_.did.status.isController);
      }
    }
  }
  
  readSelected(){
    try {
      const storePath = this.config_.store;
      console.log('RedisCli::readSelected::storePath=<',storePath,'>');
      const selectedKey = `${storePath}/didteam/didKey.selected.json`;
      const selectedStr = fs.readFileSync(selectedKey).toString('utf-8');
      console.log('RedisCli::readSelected::selectedStr=<',selectedStr,'>');
      const selectedJson = JSON.parse(selectedStr);
      console.log('RedisCli::readSelected::selectedJson=<',selectedJson,'>');
      return selectedJson.address;
    } catch ( err ) {
      console.error('RedisCli::readSelected::err=<',err,'>');
    }    
  }

}

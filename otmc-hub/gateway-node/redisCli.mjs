import { parseArgs } from 'node:util';
import { dirname, basename } from 'node:path';
import { fileURLToPath } from 'url';
import fs from 'fs';
const LOG = {
  trace0:false,
  trace:true,
  debug:true,
}


const execSubcommand = (subcommand,values)=>{
  console.log('::::execSubcommand:subcommand=<',subcommand,'>');
  switch (subcommand) {
    case 'gen.key':
      console.log('::::gen.key');
      otmc.startMining();
      otmc.on('edcrypt:didKeyList',(evt)=>{
        console.log('::::evt=:<',evt,'>');
      });
      break;
    case 'list.key':
      console.log('::::list.key');      
      otmc.on('edcrypt:didKeyList',(keyList)=>{
        //console.log('::::keyList=:<',keyList,'>');
        for(const key of keyList) {
          console.log('::::key.auth.idOfKey=:<',key.auth.idOfKey,'>');
        }
      });
      break;
    case 'switch.team':
      console.log('::::switch.team');
      switchTeam(values.address);
      break;
    case 'create.seed':
      console.log('::::create.seed');
      createSeed(values.controller);
      break;
    case 'join.auth':
      console.log('::::join.auth');
      joinAuth(values.team);
      break;
    case 'join.guest':
      console.log('::::join.guest');
      joinGuest(values.team);
      break;  
    default:
      console.log('::::default');
  }
}

const switchTeam = (address)=>{
  console.log('::switchTeam:address=<',address,'>');
  console.log('::switchTeam::address=<',address,'>');
  const storePath = gConf.store;
  console.log('::switchTeam::storePath=<',storePath,'>');
  const selectedKey = `${storePath}/didteam/didKey.selected.json`;
  const path = `${storePath}/didteam`;
  fs.mkdirSync(path,{recursive:true});
  console.log('::switchTeam::v=<',selectedKey,'>');
  const storeStr = JSON.stringify({address:address});
  fs.writeFileSync(selectedKey,storeStr);
}

const createSeed = (controller)=>{
  console.log('::createSeed:controller=<',controller,'>');
  const address = readSelected();
  console.log('cli::index::address=<',address,'>');  
  otmc.switchDidKey(address); 

  const controllerJson = [];
  let uniquecontrollerJson = [];
  if(controller) {
    const ctlList = controller.split(',');
    console.log('::createSeed::ctlList=<',ctlList,'>');
    for ( let i = 0; i < ctlList.length; i++ ) {
      const ctl = ctlList[i];
      console.log('::createSeed::ctl=<',ctl,'>');
      controllerJson.push(ctl.trim());
    }
    console.log('::createSeed::controllerJson=<',controllerJson,'>');
    uniquecontrollerJson = [...new Set(controllerJson)];
    console.log('::createSeed::uniquecontrollerJson=<',uniquecontrollerJson,'>');
  }
  //
  otmc.on('edcrypt:address',(evt)=>{
    console.log('cli::edcrypt:address');
    otmc.createDidTeamFromSeedCtrler(uniquecontrollerJson,true);

  });
  otmc.on('did:document:created',(evt)=>{
    console.log('cli::did:document:created::evt:=<',evt,'>');
  });
  otmc.on('did:document',(evt)=>{
    console.log('cli::did:document::evt:=<',evt,'>');
  });
    
}

const joinAuth = (team) => {
  console.log('cli::joinAuth:team=<',team,'>');
  const address = readSelected();
  console.log('cli::joinAuth::address=<',address,'>');  
  otmc.switchDidKey(address); 
  otmc.on('edcrypt:address',(evt)=>{
    console.log('cli::joinAuth::edcrypt:address evt=<',evt,'>');
    otmc.joinDidTeamAsAuth(team);  
  });
}

const joinGuest = (team) => {
  console.log('cli::joinGuest:team=<',team,'>');
  const address = readSelected();
  console.log('cli::joinGuest::address=<',address,'>');  
  otmc.switchDidKey(address); 
  otmc.on('edcrypt:address',(evt)=>{
    console.log('cli::joinGuest::edcrypt:address evt=<',evt,'>');
    otmc.joinDidTeamAsGuest(team);  
  });
}

/*
//import  { OtmcTeam } from 'otmc-client'
import { OtmcTeam } from '../../../otmc-package/otmc.team.js';
import { exit } from 'node:process';
console.log('::::OtmcTeam=<',OtmcTeam,'>');
const otmc = new OtmcTeam();
//console.log('::::otmc=:<',otmc,'>');

otmc.on('edcrypt:worker:ready',(evt)=>{
  console.log('::::edcrypt:worker:ready');
  console.log('::::otmc=:<',otmc,'>');
  if(subcommand) {
    execSubcommand(subcommand,values);
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
console.log('cli::::__filename=<',__filename,'>');
console.log('cli::::__dirname=<',__dirname,'>');

const gConf = {};
try {
  const configPath = `${__dirname}/../config.json`;
  console.log('cli::::configPath=<',configPath,'>');
  const configText = fs.readFileSync(configPath);
  const config = JSON.parse(configText);
  console.log('cli::::config=<',config,'>');
  gConf.store = config.store;
  otmc.config = config;
  console.log('cli::::otmc.config=<',otmc.config,'>');
} catch ( err ) {
  console.error('cli::::err=<',err,'>');
}
*/

const readSelected = ()=>{
  try {
    const storePath = gConf.store;
    console.log('cli::readSelected::storePath=<',storePath,'>');
    const selectedKey = `${storePath}/didteam/didKey.selected.json`;
    const selectedStr = fs.readFileSync(selectedKey).toString('utf-8');
    console.log('cli::readSelected::selectedStr=<',selectedStr,'>');
    const selectedJson = JSON.parse(selectedStr);
    console.log('cli::readSelected::selectedJson=<',selectedJson,'>');
    return selectedJson.address;
  } catch ( err ) {
    console.error('cli::readSelected::err=<',err,'>');
  }    
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
  }
}

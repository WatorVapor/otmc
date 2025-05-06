import { parseArgs } from 'node:util';
import { dirname, basename } from 'node:path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createClient } from 'redis';
const LOG = {
  trace0:false,
  trace:true,
  debug:true,
  info:true,
}
// exit at after 30 seconds
setTimeout(()=>{
  process.exit(0);
},1000*30);

setTimeout(()=>{
  loadConfig();
  createRedisClient();
},1);


//console.log('::::process.argv=<',process.argv,'>');
const args = process.argv.slice(2);
//console.log('::::args=<',args,'>');
const { values, positionals } = parseArgs({
  options: {
    'subcommand': {
      type: 'string',
    },
    'address': {
      type: 'string',
    },
    'controller': {
      type: 'string',
    },
    'team': {
      type: 'string',
    },
  },
});
console.log('::::values=<',values,'>');
console.log('::::positionals=<',positionals,'>');
//console.log('::::values.subcommand=<',values.subcommand,'>');


const execSubcommand = ()=>{
  const subcommand = basename(values.subcommand, '.sh');
  console.log('::::subcommand=<',subcommand,'>');  
  console.log('::::execSubcommand:subcommand=<',subcommand,'>');
  execSubcommandRedis(subcommand,values);
}

const execSubcommandRedis = (cmd,params)=>{
  if(LOG.trace) {
    console.log('cli::execSubcommandRedis::cmd=<',cmd,'>');
    console.log('cli::execSubcommandRedis::params=<',params,'>');
  }
  const cmdTopic = `/cli/exec/${cmd}`;
  if(gRedisClient) {
    gRedisClient.publish(cmdTopic, JSON.stringify(params));
  } else {
    console.log('cli::execSubcommandRedis::gRedisClient=<',gRedisClient,'>');
  }
}








const gConf = {};
let gRedisClient = false;


const loadConfig = () => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    if(LOG.trace0) {
      console.log('cli::loadConfig::__filename=<',__filename,'>');
      console.log('cli::loadConfig::__dirname=<',__dirname,'>');
    }
    const configPath = `${__dirname}/../config.json`;
    if(LOG.trace) {
      console.log('cli::loadConfig::configPath=<',configPath,'>');
    }
    const configText = fs.readFileSync(configPath);
    const config = JSON.parse(configText);
    if(LOG.trace) {
      console.log('cli::loadConfig::config=<',config,'>');
    }
    gConf.store = config.store;
    gConf.redisUnxiPath = `${gConf.store}/redis/redis.otmc.hub.sock`;      
  } catch (err) {
    if(LOG.trace) {
      console.log('cli::loadConfig::err=<',err,'>');
    }
    process.exit(0);
  }
}

const createRedisClient = () => {
  console.log('cli::::gConf=<',gConf,'>');
  const clientOpt = {
    socket:{
      path:gConf.redisUnxiPath
    }
  };
  console.log('cli::createRedisClient::clientOpt=<',clientOpt,'>');
  gRedisClient = createClient(clientOpt);

  gRedisClient.on('error', err => {
    if(LOG.trace) {
      console.log('cli::createRedisClient::err=<',err,'>');
    }
  });
  gRedisClient.on('connect', evtConnect => {
    if(LOG.trace) {
      console.log('cli::createRedisClient::evtConnect=<',evtConnect,'>');
    }
  });
  gRedisClient.on('ready', evtReady => {
    if(LOG.trace) {
      console.log('cli::createRedisClient::evtReady=<',evtReady,'>');
    }
    createRedisSubscriber(gRedisClient);
    execSubcommand();
  });
  gRedisClient.on('end', evtEnd => {
    if(LOG.trace) {
      console.log('cli::createRedisClient::evtEnd=<',evtEnd,'>');
    }
  });
  gRedisClient.on('cli', evtReconnecting => {
    if(LOG.trace) {
      console.log('cli::createRedisClient::evtReconnecting=<',evtReconnecting,'>');
    }
  });
  gRedisClient.connect();  
}

const createRedisSubscriber = (client) => {
  const subscriber = client.duplicate();
  subscriber.on('error', errSub => {
    if(LOG.trace) {
      console.log('cli::createRedisSubscriber_::errSub=<',errSub,'>');
    }
  });
  subscriber.on('connect', evtConnectSub => {
    if(LOG.trace) {
      console.log('cli::createRedisSubscriber_::evtConnectSub=<',evtConnectSub,'>');
    }
  });
  subscriber.on('ready', evtReadySub => {
    if(LOG.trace) {
      console.log('cli::createRedisSubscriber_::evtReadySub=<',evtReadySub,'>');
    }
  });
  subscriber.on('end', evtEndSub => {
    if(LOG.trace) {
      console.log('cli::createRedisSubscriber_::evtEndSub=<',evtEndSub,'>');
    }
  });
  subscriber.on('reconnecting', evtReconnectingSub => {
    if(LOG.trace) {
      console.log('cli::createRedisSubscriber_::evtReconnectingSub=<',evtReconnectingSub,'>');
    }
  });
  const listener = (message, channel) => {
    self.onRedisBroadcast_(channel,message);
  };
  subscriber.pSubscribe('/cli/reply/*', listener);
  subscriber.connect();
  if(LOG.trace0) {
    console.log('cli::createRedisSubscriber_::subscriber=<',subscriber,'>');
  }
}



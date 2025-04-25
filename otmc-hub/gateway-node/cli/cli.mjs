import { parseArgs } from 'node:util';
import { dirname, basename } from 'node:path';
import { fileURLToPath } from 'url';
import fs from 'fs';
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
  },
});
console.log('::::values=<',values,'>');
console.log('::::positionals=<',positionals,'>');
//console.log('::::values.subcommand=<',values.subcommand,'>');
const subcommand = basename(values.subcommand, '.sh');
console.log('::::subcommand=<',subcommand,'>');


const execSubcommand = (subcommand,values)=>{
  console.log('::::execSubcommand:subcommand=<',subcommand,'>');
  switch (subcommand) {
    case 'gen.key':
      console.log('::::gen.key');
      otmc.startMining();
      otmc.on('edcrypt:didKeyList',(evt)=>{
        console.log('::::evt=:<',evt,'>');
        exit(0);
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
    default:
      console.log('::::default');
      exit(0);
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
  exit(0);
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
    //exit(0);
  });
  otmc.on('did:document',(evt)=>{
    console.log('cli::did:document::evt:=<',evt,'>');
    exit(0);
  });
    
}

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
} catch ( err ) {
  console.error('cli::::err=<',err,'>');
}

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

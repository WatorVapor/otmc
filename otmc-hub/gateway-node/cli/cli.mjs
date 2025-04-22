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
      const address = values.address;
      switchTeam(address);
      exit(0);
    case 'create.seed':
      console.log('::::create.seed');
      exit(0);
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
console.log('::::__filename=<',__filename,'>');
console.log('::::__dirname=<',__dirname,'>');

const gConf = {};
try {
  const configPath = `${__dirname}/../config.json`;
  console.log('::::configPath=<',configPath,'>');
  const configText = fs.readFileSync(configPath);
  const config = JSON.parse(configText);
  console.log('::::config=<',config,'>');
  gConf.store = config.store;
  otmc.config = config;
} catch ( err ) {
  console.error('::::err=<',err,'>');
}

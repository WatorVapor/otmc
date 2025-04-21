import { parseArgs } from 'node:util';
import path from 'node:path';
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
const subcommand = path.basename(values.subcommand, '.sh');
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
      console.log('::::address=<',address,'>');
      const storePath = gConf.store;
      console.log('::::storePath=<',storePath,'>');
      const topTeam = `${storePath}/didteam/topTeam.json`;
      console.log('::::topTeam=<',topTeam,'>');
      exit(0);
    case 'create.seed':
      console.log('::::create.seed');
      exit(0);
    default:
      console.log('::::default');
      exit(0);
  }
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

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
console.log('::::__filename=<',__filename,'>');
console.log('::::__dirname=<',__dirname,'>');

import fs from 'fs';
const gConf = {};
try {
  const configPath = `${__dirname}/../config.json`;
  console.log('::::configPath=<',configPath,'>');
  const configText = fs.readFileSync(configPath);
  const config = JSON.parse(configText);
  console.log('::::config=<',config,'>');
  gConf.store = config.store;
  fs.mkdirSync(`${gConf.store}/secretKey`, { recursive: true },);
} catch ( err ) {
  console.error('::::err=<',err,'>');
}

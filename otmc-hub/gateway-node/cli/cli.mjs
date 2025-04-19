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
  },
});
//console.log('::::values=<',values,'>');
//console.log('::::positionals=<',positionals,'>');
//console.log('::::values.subcommand=<',values.subcommand,'>');
const subcommand = path.basename(values.subcommand, '.sh');
console.log('::::subcommand=<',subcommand,'>');

/*
setTimeout(()=>{
  execSubcommand(subcommand);
},0);
*/

const execSubcommand = (subcommand)=>{
  console.log('::::execSubcommand');
  switch (subcommand) {
    case 'gen.key':
      console.log('::::gen.key');
      otmc.startMining();
      otmc.on('edcrypt:didKeyList',(evt)=>{
        console.log('::::evt=:<',evt,'>');
        exit(0);
      });
      break;
    case 'create.seed':
      console.log('::::create.seed');
      break;
    default:
      console.log('::::default');
      break;
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
    execSubcommand(subcommand);
  }
});

/*
setTimeout(()=>{
  exit(0);
},5000);
*/

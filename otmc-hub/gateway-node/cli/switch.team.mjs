import fs from 'fs';
import { parseArgs } from 'node:util';
const options = {
  target: {
    type: "string",
    short: "t",
    multiple: false,
  },
};
const topTeamPath = '../.store/didteam/topTeam.json';

const args = process.argv.slice(2);
const {
  values,
  positionals,
} = parseArgs({ options, args });
console.log('::::values=<',values,'>');
const targetAddress = values.target.replace('did:otmc:','');

const strConstDidPath = `../.store/didteam/`
fs.mkdirSync(strConstDidPath, { recursive: true },);

const targetJson = {
  did:values.target,
  address:targetAddress,
  date:new Date().toISOString(),
  history:[]
};
console.log('::::targetJson=<',targetJson,'>');

try {
  const topTeamStr = fs.readFileSync(topTeamPath);
  const topTeam = JSON.parse(topTeamStr);
  console.log('::::topTeam=:<',topTeam,'>');
  if(topTeam) {
    const topTeamPush = JSON.parse(topTeamStr);
    delete topTeamPush.history;
    targetJson.history.push(topTeamPush);
  }
  if(topTeam.history.length > 0) {
    for(const ttHistory of topTeam.history) {
      targetJson.history.push(ttHistory);
    }
  }
} catch(err) {
  //console.error('::::err=:<',err,'>');
}

console.log('::::targetJson=<',targetJson,'>');


fs.writeFileSync(topTeamPath, JSON.stringify(targetJson,undefined,2));


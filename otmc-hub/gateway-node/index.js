const fs = require('fs');
const MqttJWTDidTeam = require('./mqtt/did_team.js');
const strConstTopDidDocPath = './.store/didteam/TopDidDoc.json';
const secretKeyPath = './.store//secretKey/auth.json';
const strConstMqttJwtPath = './.store/mqtt/jwt_cached.json';

let topDidDoc = null;
try {
  const topDidDocText = fs.readFileSync(strConstTopDidDocPath);
  topDidDoc = JSON.parse(topDidDocText);
} catch ( err ) {
  console.log('::::err=<',err,'>');
}

let secretKey = null;
try {
  //console.log('::::topDidDoc=<',topDidDoc,'>');
  const secretText = fs.readFileSync(secretKeyPath);
  secretKey = JSON.parse(secretText);
  //console.log('::::secretKey=<',secretKey,'>');
} catch ( err ) {
  console.log('::::err=<',err,'>');  
}

let jwtCached = null;
try {
  fs.mkdirSync('./.store/mqtt/', { recursive: true });
  const jwtText = fs.readFileSync(strConstMqttJwtPath);
  jwtCached = JSON.parse(jwtText);
  //console.log('::::team=<',team,'>');
} catch ( err ) {
  console.log('::::err=<',err,'>');    
}

const team = new MqttJWTDidTeam(jwtCached,topDidDoc,secretKey,(jwtRcv) => {
  onRecvedJwtReply(jwtRcv);
});

const onRecvedJwtReply = (jwtRcv) => {
  fs.writeFileSync(strConstMqttJwtPath, JSON.stringify(jwtRcv,undefined,2));  
}

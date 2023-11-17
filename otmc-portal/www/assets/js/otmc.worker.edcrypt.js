self.trace = false;
self.debug = true;

self.addEventListener('message', (evt) =>{
  if(self.trace) {
    console.log('otmc.worker.edcrypt::::evt=:<',evt,'>');
  }
  onMessage(evt.data);
});
const onMessage = async (msg) => {
  if(self.trace) {
    console.log('otmc.worker.edcrypt::onMessage::msg=:<',msg,'>');
  }
  if(msg.cmd === 'mine') {
    onMiningCmd(msg);
  }
}


const addressPrefix = 'otm';
//const addressPrefix = 'ot';
//const addressPrefix = 'o';

const onMiningCmd = async (msg) => {

  const pathBase32 = `${msg.path}/edcrypto/base32.js`;
  if(self.trace) {
    console.log('otmc.worker.edcrypt::onMiningCmd::pathBase32=:<',pathBase32,'>');
  }
  const { Base32 } = await import(pathBase32)
  if(self.trace) {
    console.log('otmc.worker.edcrypt::onMiningCmd::Base32=:<',Base32,'>');
  }


  const pathEdkey = `${msg.path}/edcrypto/edkey.js`;
  if(self.trace) {
  console.log('otmc.worker.edcrypt::onMiningCmd::pathEdkey=:<',pathEdkey,'>');
  }
  const { EdDsaKey } = await import(pathEdkey)
  if(self.trace) {
  console.log('otmc.worker.edcrypt::onMiningCmd::EdDsaKey=:<',EdDsaKey,'>');
  }

  const pathEdUtils = `${msg.path}/edcrypto/edutils.js`;
  if(self.trace) {
  console.log('otmc.worker.edcrypt::onMiningCmd::pathEdUtils=:<',pathEdUtils,'>');
  }
  const { EdUtil } = await import(pathEdUtils)
  if(self.trace) {
  console.log('otmc.worker.edcrypt::onMiningCmd::EdUtil=:<',EdUtil,'>');
  }
  const base32 = new Base32();
  const util = new EdUtil(base32);
  const edKey = new EdDsaKey(util);
  if(self.trace) {
  console.log('otmc.worker.edcrypt::onMiningCmd::edKey=:<',edKey,'>');
  }
  const result = {
    auth:false,
    recovery:false
  };
  let authKey = null;
  setTimeout(()=>{
    mineEdKey(result,edKey);
  },0);
  /*
  while(true) {
    let keyObject = edKey.createKey();
    if(self.trace) {
      console.log('otmc.worker.edcrypt::onMiningCmd::keyObject.idOfKey=:<',keyObject.idOfKey,'>');
    }
    if(keyObject.idOfKey.startsWith(addressPrefix)) {
      authKey = keyObject;
      break;
    }
    keyObject = null;
  }
  if(self.debug) {
    console.log('otmc.worker.edcrypt::onMiningCmd::authKey=:<',authKey,'>');
  }
  
  let recoveryKey = null;
  while(true) {
    let keyObject = edKey.createKey();
    if(self.trace) {
      console.log('otmc.worker.edcrypt::onMiningCmd::keyObject.idOfKey=:<',keyObject.idOfKey,'>');
    }
    if(keyObject.idOfKey.startsWith(addressPrefix)) {
      recoveryKey = keyObject;
      break;
    }
    keyObject = null;
  }
  if(self.debug) {
    console.log('otmc.worker.edcrypt::onMiningCmd::recoveryKey=:<',recoveryKey,'>');
  }
  */
}

const mineEdKey = (result,edKey) => {
    let keyObject = edKey.createKey();
    if(self.trace) {
      console.log('otmc.worker.edcrypt::onMiningCmd::keyObject.idOfKey=:<',keyObject.idOfKey,'>');
    }
    if(keyObject.idOfKey.startsWith(addressPrefix)) {
      if(!result.auth) {
        result.auth = keyObject;
      }
      if(!result.recovery) {
        result.recovery = keyObject;
      }
      if(result.auth && result.recovery) {
        self.postMessage(result,edKey);
      }
    } else {
      setTimeout(()=>{
        mineEdKey(result,edKey);
      },0);
    }
}

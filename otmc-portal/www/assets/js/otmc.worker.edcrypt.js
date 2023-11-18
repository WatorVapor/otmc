self.trace = true;
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
  if(msg.init) {
    onInitCmd(msg.init);
  }
  if(msg.init === 'mine') {
    onMiningCmd(msg);
  }
}
const onInitCmd = async (initMsg) => {
  if(self.trace) {
    console.log('otmc.worker.edcrypt::onInitCmd::initMsg=:<',initMsg,'>');
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
  self.counter = 0;
  setTimeout(()=>{
    mineEdKeyWithTimer(result,edKey);
  },0);
}

const mineEdKeyWithTimer = (result,edKey) => {
  let keyObject = edKey.createKey();
  if((self.counter++ % 100 ) === 0 ) {
    if(self.debug ) {
      console.log('otmc.worker.edcrypt::mineEdKeyWithTimer::keyObject.idOfKey=:<',keyObject.idOfKey,'>');
      console.log('otmc.worker.edcrypt::mineEdKeyWithTimer::self.counter=:<',self.counter,'>');
    }
    self.postMessage({mining:{counter:self.counter++}});
  }
  if(keyObject.idOfKey.startsWith(addressPrefix)) {
    if(self.debug ) {
      console.log('otmc.worker.edcrypt::mineEdKeyWithTimer::keyObject.idOfKey=:<',keyObject.idOfKey,'>');
    }
    if(!result.auth) {
      result.auth = keyObject;
      setTimeout(()=>{
        mineEdKeyWithTimer(result,edKey);
      },0);
      return;
    }
    if(!result.recovery) {
      result.recovery = keyObject;
    }
    if(result.auth && result.recovery) {
      self.postMessage(result);
    }
  } else {
    setTimeout(()=>{
      mineEdKeyWithTimer(result,edKey);
    },0);
  }
}

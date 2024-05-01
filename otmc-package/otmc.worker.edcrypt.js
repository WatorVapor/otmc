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
  if(msg.mine && msg.mine.start) {
    onMiningCmd(msg);
  }
}

const modulePath = {
  
}
const onInitCmd = async (initMsg) => {
  if(self.trace) {
    console.log('otmc.worker.edcrypt::onInitCmd::initMsg=:<',initMsg,'>');
  }
  modulePath.base32 = `${initMsg.path}/edcrypto/base32.js`;
  modulePath.edkey = `${initMsg.path}/edcrypto/edkey.js`;
  modulePath.edutils = `${initMsg.path}/edcrypto/edutils.js`;
  if(self.trace) {
    console.log('otmc.worker.edcrypt::onInitCmd::modulePath=:<',modulePath,'>');
  }
}

const addressPrefix = 'otm';
//const addressPrefix = 'ot';
//const addressPrefix = 'o';

const onMiningCmd = async (msg) => {

  const { Base32 } = await import(modulePath.base32)
  if(self.trace) {
    console.log('otmc.worker.edcrypt::onMiningCmd::Base32=:<',Base32,'>');
  }
  const { EdDsaKey } = await import(modulePath.edkey)
  if(self.trace) {
    console.log('otmc.worker.edcrypt::onMiningCmd::EdDsaKey=:<',EdDsaKey,'>');
  }
  const { EdUtil } = await import(modulePath.edutils)
  if(self.trace) {
    console.log('otmc.worker.edcrypt::onMiningCmd::EdUtil=:<',EdUtil,'>');
  }
  const nacl = await import('https://cdn.jsdelivr.net/npm/tweetnacl-es6@1.0.3/nacl-fast-es.js');
  if(self.trace) {
    console.log('otmc.worker.edcrypt::onMiningCmd::nacl=:<',nacl,'>');
  }
  const base32 = new Base32();
  const util = new EdUtil(base32,nacl);
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

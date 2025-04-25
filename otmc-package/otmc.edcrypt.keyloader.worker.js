const isNode = typeof global !== 'undefined' && typeof window === 'undefined';
console.log('otmc.worker.edcrypt::::isNode=:<',isNode,'>');
let pSelf = false;
if(isNode) {
  pSelf = {};
  pSelf.trace = false;
  pSelf.debug = true;
  const nodeWorker = await import('node:worker_threads');
  if(pSelf.trace) {
    console.log('otmc.worker.edcrypt::::nodeWorker=:<',nodeWorker,'>');
  }
  pSelf.parentPort = nodeWorker.parentPort;
  pSelf.addEventListener = nodeWorker.addEventListener;
  setTimeout(()=>{
    loadModule();
  },1);
} else {
  pSelf = self;
}
pSelf.trace = false;
pSelf.debug = true;


const loadModule = async () => {
  if(pSelf.trace) {
    console.log('otmc.worker.edcrypt::loadModule');
  }
  if(isNode) {
    pSelf.parentPort.on('message', (data) =>{
      if(pSelf.trace) {
        console.log('otmc.worker.resolver::loadModule::data=:<',data,'>');
      }
      onMessage(data);
    });
  } else { 
    pSelf.addEventListener('message', (evt) =>{
      if(pSelf.trace) {
        console.log('otmc.worker.edcrypt::loadModule::evt=:<',evt,'>');
      }
      onMessage(evt.data);
    });
  }
  const result = {
    module:{
      loaded:true,
    }
  }
  if(pSelf.trace) {
    console.log('otmc.worker.edcrypt::loadModule::result=:<',result,'>');
  }
  if(isNode) {
    pSelf.parentPort.postMessage(result);
  } else {
    pSelf.postMessage(result);
  }
}

if(!isNode) {
  loadModule();  
}


const onMessage = async (msg) => {
  if(pSelf.trace) {
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
  if(pSelf.trace) {
    console.log('otmc.worker.edcrypt::onInitCmd::initMsg=:<',initMsg,'>');
  }
  modulePath.base32 = `${initMsg.path}/edcrypto/base32.js`;
  modulePath.edkey = `${initMsg.path}/edcrypto/edkey.js`;
  modulePath.edutils = `${initMsg.path}/edcrypto/edutils.js`;
  if(pSelf.trace) {
    console.log('otmc.worker.edcrypt::onInitCmd::modulePath=:<',modulePath,'>');
  }
  if(isNode) {
    pSelf.parentPort.postMessage({ready:true});
  } else {
    pSelf.postMessage({ready:true});
  }
}

const addressPrefix = 'otm';
//const addressPrefix = 'ot';
//const addressPrefix = 'o';

const onMiningCmd = async (msg) => {

  const { Base32 } = await import(modulePath.base32)
  if(pSelf.trace) {
    console.log('otmc.worker.edcrypt::onMiningCmd::Base32=:<',Base32,'>');
  }
  const { EdDsaKey } = await import(modulePath.edkey)
  if(pSelf.trace) {
    console.log('otmc.worker.edcrypt::onMiningCmd::EdDsaKey=:<',EdDsaKey,'>');
  }
  const { EdUtil } = await import(modulePath.edutils)
  if(pSelf.trace) {
    console.log('otmc.worker.edcrypt::onMiningCmd::EdUtil=:<',EdUtil,'>');
  }
  let nacl = null;
  if(isNode) {
    nacl = await import('tweetnacl-es6');
  } else {
    nacl = await import('https://cdn.jsdelivr.net/npm/tweetnacl-es6@1.0.3/nacl-fast-es.js');
  }
  if(pSelf.trace) {
    console.log('otmc.worker.edcrypt::onMiningCmd::nacl=:<',nacl,'>');
  }
  const base32 = new Base32();
  const util = new EdUtil(base32,nacl);
  const edKey = new EdDsaKey(util);
  if(pSelf.trace) {
  console.log('otmc.worker.edcrypt::onMiningCmd::edKey=:<',edKey,'>');
  }
  const result = {
    auth:false,
    recovery:false
  };
  let authKey = null;
  pSelf.counter = 0;
  setTimeout(()=>{
    mineEdKeyWithTimer(result,edKey);
  },0);
}

const mineEdKeyWithTimer = (result,edKey) => {
  let keyObject = edKey.createKey();
  if((pSelf.counter++ % 100 ) === 0 ) {
    if(pSelf.debug ) {
      console.log('otmc.worker.edcrypt::mineEdKeyWithTimer::keyObject.idOfKey=:<',keyObject.idOfKey,'>');
      console.log('otmc.worker.edcrypt::mineEdKeyWithTimer::pSelf.counter=:<',pSelf.counter,'>');
    }
    if(isNode) {
      pSelf.parentPort.postMessage({mining:{counter:pSelf.counter++,keyObject:keyObject}});
    } else {
      pSelf.postMessage({mining:{counter:pSelf.counter++,keyObject:keyObject}});
    }
  }
  if(keyObject.idOfKey.startsWith(addressPrefix)) {
    if(pSelf.debug ) {
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
      if(isNode)  {
        pSelf.parentPort.postMessage(result);
      } else {
        pSelf.postMessage(result);
      }
    }
  } else {
    setTimeout(()=>{
      mineEdKeyWithTimer(result,edKey);
    },0);
  }
}

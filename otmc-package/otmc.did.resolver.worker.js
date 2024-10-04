self.trace = true;
self.debug = true;

self.addEventListener('message', (evt) =>{
  if(self.trace) {
    console.log('otmc.worker.resolver::::evt=:<',evt,'>');
  }
  onMessage(evt.data);
});
const onMessage = async (msg) => {
  if(self.trace) {
    console.log('otmc.worker.resolver::onMessage::msg=:<',msg,'>');
  }
  if(msg.init) {
    onInitCmd(msg.init);
  }
}

const modulePath = {};
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
  self.postMessage({ready:true});
}

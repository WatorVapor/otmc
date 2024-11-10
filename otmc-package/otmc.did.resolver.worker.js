self.trace = true;
self.debug = true;
/*
import { DidStoreDocument } from './otmc.did.store.document.js';
if(self.trace) {
  console.log('otmc.worker.resolver::DidStoreDocument=:<',DidStoreDocument,'>');
}
*/


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
    console.log('otmc.worker.resolver::onInitCmd::initMsg=:<',initMsg,'>');
  }
  modulePath.storeDocument = `${initMsg.path}/otmc.did.store.document.js`;
  modulePath.storeManifest = `${initMsg.path}/otmc.did.store.manifest.js`;
  modulePath.storeTeamJoin = `${initMsg.path}/otmc.did.store.team.join.js`;
  if(self.trace) {
    console.log('otmc.worker.resolver::onInitCmd::modulePath=:<',modulePath,'>');
  }
  self.postMessage({ready:true});
}

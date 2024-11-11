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
  if(msg.reqDL) {
    onReqDLCmd(msg.reqDL);
  }
}

const modulePath = {};
const onInitCmd = async (initMsg) => {
  if(self.trace) {
    console.log('otmc.worker.resolver::onInitCmd::initMsg=:<',initMsg,'>');
  }
  self.postMessage({ready:true});
}

let gCloudRequestList = [];
const onReqDLCmd = async (reqMsg) => {
  if(self.trace) {
    console.log('otmc.worker.resolver::onReqDLCmd::reqMsg=:<',reqMsg,'>');
  }
  gCloudRequestList.push(reqMsg);
  gCloudRequestList = gCloudRequestList.flat(Infinity);
  setTimeout(()=>{
    rollOutRequestInQue_();
  },1);
}

const rollOutRequestInQue_ = async () => {
  if(self.trace) {
    console.log('otmc.worker.resolver::rollOutRequestInQue_::gCloudRequestList=:<',gCloudRequestList,'>');
  }
  if(gCloudRequestList.length < 1) {
    return;
  }
  const topRequest = gCloudRequestList[0];
  if(self.trace) {
    console.log('otmc.worker.resolver::rollOutRequestInQue_::topRequest=:<',topRequest,'>');
  }
  rollOutOneRequest_(topRequest);
  gCloudRequestList.shift();
  if(gCloudRequestList.length > 0) {
    setTimeout(()=>{
      rollOutRequestInQue_();
    },1000);
  }
}

const rollOutOneRequest_ = async (reqMsg) => {
  if(self.trace) {
    console.log('otmc.worker.resolver::rollOutOneRequest_::reqMsg=:<',reqMsg,'>');
  }
  if(reqMsg.GET) {
    const responseGet = await GetRequestAPI_(reqMsg.GET);
    if(self.trace) {
      console.log('otmc.worker.resolver::rollOutOneRequest_::responseGet=:<',responseGet,'>');
    }
    self.postMessage(responseGet);
  }
}


const GetRequestAPI_  = async (reqMsg) => {
  const reqHeader = new Headers();
  reqHeader.append('Content-Type', 'application/json');
  reqHeader.append('Authorization', `Bearer ${reqMsg.Authorization}`);
  const reqOption = {
    method: 'GET',
    headers:reqHeader
  };
  const apiReq = new Request(reqMsg.url, reqOption);
  if(self.trace) {
    console.log('otmc.worker.resolver::GetRequestAPI_::apiReq=:<',apiReq,'>');
  }
  const apiResp = await fetch(apiReq);
  if(self.trace) {
    console.log('otmc.worker.resolver::GetRequestAPI_::apiResp=:<',apiResp,'>');
  }
  if(apiResp.ok) {
    const resultJson = await apiResp.json();
    if(self.trace) {
      console.log('otmc.worker.resolver::GetRequestAPI_::resultJson=:<',resultJson,'>');
    }
    return resultJson;
  } else {
    const resultJson = {
      ok:apiResp.ok,
      status:apiResp.status
    }
    return resultJson;
  }
}

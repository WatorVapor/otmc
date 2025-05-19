const isNode = typeof global !== 'undefined' && typeof window === 'undefined';
console.log('otmc.worker.resolver::::isNode=:<',isNode,'>');
let pSelf = false;
if(isNode) {
  pSelf = {};
  pSelf.trace = true;
  pSelf.debug = true;
  const nodeWorker = await import('node:worker_threads');
  if(pSelf.trace) {
    console.log('otmc.worker.resolver::::nodeWorker=:<',nodeWorker,'>');    
  }
  pSelf.parentPort = nodeWorker.parentPort;
  pSelf.addEventListener = nodeWorker.addEventListener;
  setTimeout(()=>{
    loadModule();
  },1);
} else {
  pSelf = self;
}

pSelf.trace = true;
pSelf.debug = true;

const loadModule = async () => {
  if(pSelf.trace) {
    console.log('otmc.worker.resolver::loadModule');
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
        console.log('otmc.worker.resolver::loadModule::evt=:<',evt,'>');
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
    console.log('otmc.worker.resolver::onMessage::msg=:<',msg,'>');
  }
  if(msg.init) {
    onInitCmd(msg.init);
  }
  if(msg.reqDL) {
    onReqDLCmd(msg.reqDL);
  }
  if(msg.postUL) {
    onReqULCmd(msg.postUL);
  }
}

const modulePath = {};
const onInitCmd = async (initMsg) => {
  if(pSelf.trace) {
    console.log('otmc.worker.resolver::onInitCmd::initMsg=:<',initMsg,'>');
  }
  if(isNode) {
    pSelf.parentPort.postMessage({ready:true});
  } else {
    pSelf.postMessage({ready:true});
  }
}

let gCloudRequestList = [];
const onReqDLCmd = async (reqMsg) => {
  if(pSelf.trace) {
    console.log('otmc.worker.resolver::onReqDLCmd::reqMsg=:<',reqMsg,'>');
  }
  gCloudRequestList.push(reqMsg);
  gCloudRequestList = gCloudRequestList.flat(Infinity);
  setTimeout(()=>{
    rollOutRequestInQue_();
  },1);
}

const onReqULCmd = async (reqMsg) => {
  if(pSelf.trace) {
    console.log('otmc.worker.resolver::onReqULCmd::reqMsg=:<',reqMsg,'>');
  }
  gCloudRequestList.push(reqMsg);
  gCloudRequestList = gCloudRequestList.flat(Infinity);
  setTimeout(()=>{
    rollOutRequestInQue_();
  },1);
}


const rollOutRequestInQue_ = async () => {
  if(pSelf.trace) {
    console.log('otmc.worker.resolver::rollOutRequestInQue_::gCloudRequestList=:<',gCloudRequestList,'>');
  }
  if(gCloudRequestList.length < 1) {
    return;
  }
  const topRequest = gCloudRequestList[0];
  if(pSelf.trace) {
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
  if(pSelf.trace) {
    console.log('otmc.worker.resolver::rollOutOneRequest_::reqMsg=:<',reqMsg,'>');
  }
  if(reqMsg.GET) {
    const responseGet = await GetRequestAPI_(reqMsg.GET);
    if(pSelf.trace) {
      console.log('otmc.worker.resolver::rollOutOneRequest_::responseGet=:<',responseGet,'>');
    }
    if(isNode) {
      pSelf.parentPort.postMessage(responseGet);
    } else {
      pSelf.postMessage(responseGet);
    }
  }
  if(reqMsg.POST) {
    const responsePost = await PostRequestAPI_(reqMsg.POST);
    if(pSelf.trace) {
      console.log('otmc.worker.resolver::rollOutOneRequest_::responsePost=:<',responsePost,'>');
    }
    if(isNode) {
      pSelf.parentPort.postMessage(responsePost);
    } else {
      pSelf.postMessage(responsePost);
    }
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
  if(pSelf.trace) {
    console.log('otmc.worker.resolver::GetRequestAPI_::apiReq=:<',apiReq,'>');
  }
  const apiResp = await fetch(apiReq);
  if(pSelf.trace) {
    console.log('otmc.worker.resolver::GetRequestAPI_::apiResp=:<',apiResp,'>');
  }
  if(apiResp.ok) {
    const resultJson = await apiResp.json();
    if(pSelf.trace) {
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

const PostRequestAPI_  = async (reqMsg) => {
  const reqHeader = new Headers();
  reqHeader.append('Content-Type', 'application/json');
  reqHeader.append('Authorization', `Bearer ${reqMsg.Authorization}`);
  const reqOption = {
    method: 'POST',
    headers:reqHeader,
    body:JSON.stringify(reqMsg.body)
  };
  const apiReq = new Request(reqMsg.url, reqOption);
  if(pSelf.trace) {
    console.log('otmc.worker.resolver::PostRequestAPI_::apiReq=:<',apiReq,'>');
  }
  const apiResp = await fetch(apiReq);
  if(pSelf.trace) {
    console.log('otmc.worker.resolver::PostRequestAPI_::apiResp=:<',apiResp,'>');
  }
  if(apiResp.ok) {
    const resultJson = await apiResp.json();
    if(pSelf.trace) {
      console.log('otmc.worker.resolver::PostRequestAPI_::resultJson=:<',resultJson,'>');
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
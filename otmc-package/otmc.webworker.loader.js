/**
*
*/
import { fileURLToPath } from 'url';
import path from 'path';
import NodeWorker from 'node:worker_threads';

const ModuleOption = { type: 'module' };
//const ModuleOption = { };


export class WebWorkerLoader {
  constructor(eeInternal) {
    this.trace = true;
    this.debug = true;
    this.otmc = false;
    this.eeInternal = eeInternal;
    this.isNode = typeof global !== 'undefined' && typeof window === 'undefined';
    if(this.trace) {
      console.log('WebWorkerLoader::constructor::this.isNode=:<',this.isNode,'>');
    }
  if(!this.isNode) {
      this.scriptPath = getScriptPathBrowser();
    } else {
      if(this.trace) {
        console.log('WebWorkerLoader::constructor::this.isNode=:<',this.isNode,'>');
        console.log('WebWorkerLoader::constructor::import.meta.url=:<',import.meta.url,'>');
      }
      this.scriptPath = getScriptPathNode(import.meta.url);
    }
    if(this.trace) {
      console.log('WebWorkerLoader::constructor::this.scriptPath=:<',this.scriptPath,'>');
    }
    this.ListenEventEmitter_();
  }
  ListenEventEmitter_() {
    const self = this;
    this.eeInternal.on('webwoker.create.worker',(evt)=>{
      if(self.trace) {
        console.log('WebWorkerLoader::ListenEventEmitter_::evt=:<',evt,'>');
      }
      if(self.trace) {
        console.log('WebWorkerLoader::ListenEventEmitter_::this.otmc=:<',this.otmc,'>');
      }
      if(self.isNode) {
        self.createWorkerNode();
      } else {
        self.createWorker();
      }
    });
  }
  createWorker() {
    const self = this;
    fetch(`${this.scriptPath}/otmc.edcrypt.keyloader.worker.js`)
    .then((response) => response.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      if(self.trace) {
        console.log('WebWorkerLoader::createWorker::url=:<',url,'>');
      }
      const cryptWorker = new Worker(url, ModuleOption);
      if(self.trace) {
        console.log('WebWorkerLoader::createWorker::cryptWorker=:<',cryptWorker,'>');
      }
      const initMsg = {
        init:{
          path:self.scriptPath,
        }
      };    
      setTimeout(()=>{
        cryptWorker.postMessage(initMsg);
      },3);
      self.eeInternal.emit('webwoker.crypt.worker',{worker:cryptWorker});
    });
    fetch(`${this.scriptPath}/otmc.did.resolver.worker.js`)
    .then((response) => response.blob())
    .then((blob) => {
      const urlObj = URL.createObjectURL(blob);
      if(self.trace) {
        console.log('WebWorkerLoader::createWorker::urlObj=:<',urlObj,'>');
      }
      const resolverWorker = new Worker(urlObj, ModuleOption);
      if(self.trace) {
        console.log('WebWorkerLoader::createWorker::resolverWorker=:<',resolverWorker,'>');
      }
      const initMsg = {
        init:{
          path:self.scriptPath,
        }
      };    
      setTimeout(()=>{
        resolverWorker.postMessage(initMsg);
      },3);
      self.eeInternal.emit('webwoker.resolver.worker',{worker:resolverWorker});
    });
  }

  createWorkerNode() {
    if(this.trace) {
      console.log('WebWorkerLoader::createWorkerNode::this.scriptPath=:<',this.scriptPath,'>');
      console.log('WebWorkerLoader::createWorkerNode::NodeWorker=:<',NodeWorker,'>');
    }
    const cryptUrl = new URL(`${this.scriptPath}/otmc.edcrypt.keyloader.worker.js`, import.meta.url);
    if(this.trace) {
      console.log('WebWorkerLoader::createWorkerNode::cryptUrl=:<',cryptUrl,'>');
    }
    const cryptWorker = new NodeWorker.Worker(cryptUrl, ModuleOption);
    if(this.trace) {
      console.log('WebWorkerLoader::createWorkerNode::cryptWorker=:<',cryptWorker,'>');
    }
    const self = this;
    cryptWorker.on('message', (msg) => {
      if(self.trace) {
        console.log('WebWorkerLoader::createWorkerNode::cryptWorker::onmessage::msg=:<',msg,'>');
      }
      if(msg && msg.module && msg.module.loaded) {
        self.eeInternal.emit('webwoker.crypt.worker',{worker:cryptWorker});
        const initMsg = {
          init:{
            path:this.scriptPath,
          }
        };
        setTimeout(()=>{
          cryptWorker.postMessage(initMsg);
        },200);
      }
      if(self.trace) {
        console.log('WebWorkerLoader::createWorkerNode::cryptWorker::onmessage::cryptWorker.onmessage=:<',cryptWorker.onmessage,'>');
        console.log('WebWorkerLoader::createWorkerNode::cryptWorker::onmessage::cryptWorker.cryptMsgHandler=:<',cryptWorker.cryptMsgHandler,'>');
      }
    });
   
    
    const resolverWorker = new NodeWorker.Worker(`${this.scriptPath}/otmc.did.resolver.worker.js`, ModuleOption);
    if(this.trace) {
      console.log('WebWorkerLoader::createWorkerNode::resolverWorker=:<',resolverWorker,'>');
    }
    resolverWorker.on('message', (msg) => {
      if(self.trace) {
        console.log('WebWorkerLoader::createWorkerNode::resolverWorker::onmessage::msg=:<',msg,'>');
      }
      if(msg && msg.module && msg.module.loaded) {
        self.eeInternal.emit('webwoker.resolver.worker',{worker:resolverWorker});
        const initMsg = {
          init:{
            path:this.scriptPath,
          }
        };
        setTimeout(()=>{
          resolverWorker.postMessage(initMsg);
        },200);
      }
    });
  }
}

const getScriptPathBrowser = () => {
  const browserName = () => {
    const agent = window.navigator.userAgent.toLowerCase();
    if(WebWorkerLoader.trace) {
      console.log('::browserName::agent:=:<',agent,'>');
    }
    if (agent.indexOf('chrome') != -1) {
      return 'chrome';
    }
    if (agent.indexOf('safari') != -1) {
      return 'safari';
    }
    if (agent.indexOf('firefox') != -1) {
      return 'firefox';
    }
    return 'chrome'
  }

  const browser = browserName();
  if(WebWorkerLoader.trace) {
    console.log('::getScriptPathBrowser::browser=:<',browser,'>');
  }
  const errorDummy = new Error();
  if(WebWorkerLoader.trace) {
    console.log('::getScriptPathBrowser::errorDummy.stack.trim()=:<',errorDummy.stack.trim(),'>');
  }
  let sepStackLine = '\n    at ';
  let indexOfStack = 1;
  let replacePartern = 'getScriptPathBrowser (';
  if(browser === 'firefox') {
    sepStackLine = '\n';
    indexOfStack = 0;
    replacePartern = 'getScriptPathBrowser@';
  }
  let stackParams = errorDummy.stack.trim().split(sepStackLine);
  if(WebWorkerLoader.trace) {
    console.log('::getScriptPathBrowser::stackParams=:<',stackParams,'>');
    console.log('::getScriptPathBrowser::stackParams.length=:<',stackParams.length,'>');
  }
  if(stackParams.length > indexOfStack + 1) {
    const fileStack = stackParams[indexOfStack];
    if(WebWorkerLoader.trace) {
      console.log('::getScriptPathBrowser::fileStack=:<',fileStack,'>');
    }
    const fileLine = fileStack.replace(replacePartern,'').replace(')','');
    if(WebWorkerLoader.trace) {
      console.log('::getScriptPathBrowser::fileLine=:<',fileLine,'>');
    }
    const fileLineParams = fileLine.split('/');
    if(WebWorkerLoader.trace) {
      console.log('::getScriptPathBrowser::fileLineParams=:<',fileLineParams,'>');
    }
    const scriptPath = fileLineParams.slice(0,fileLineParams.length -1).join('/');
    if(WebWorkerLoader.trace) {
      console.log('::getScriptPathBrowser::scriptPath=:<',scriptPath,'>');
    }
    return scriptPath;
  }
  return '';
}


const getScriptPathNode = (url_file) => {
  if(WebWorkerLoader.trace) {
    console.log('::getScriptPathNode::url_file=:<',url_file,'>');
  }
  const __filename = fileURLToPath(url_file);
  if(WebWorkerLoader.trace) {
    console.log('::getScriptPathNode::__filename=:<',__filename,'>');
  }
  const __dirname = path.dirname(__filename);
  if(WebWorkerLoader.trace) {
    console.log('::getScriptPathNode::__dirname=:<',__dirname,'>');
  }
  return __dirname;
}
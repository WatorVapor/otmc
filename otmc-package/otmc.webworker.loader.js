class WebWorkerLoader {
  static trace = false;
  static debug = true;
  constructor() {
    
  }
}
/**
*
*/
export class WebWorkerLoaderBrowser {
  constructor(eeInternal) {
    this.trace = false;
    this.debug = true;
    this.otmc = false;
    this.eeInternal = eeInternal;
    this.scriptPath = getScriptPath();
    if(this.trace) {
      console.log('WebWorkerLoaderBrowser::constructor::this.scriptPath=:<',this.scriptPath,'>');
    }
    this.ListenEventEmitter_();
  }
  ListenEventEmitter_() {
    const self = this;
    this.eeInternal.on('webwoker.create.worker',(evt)=>{
      if(this.trace) {
        console.log('WebWorkerLoaderBrowser::ListenEventEmitter_::evt=:<',evt,'>');
      }
      if(this.trace) {
        console.log('WebWorkerLoaderBrowser::ListenEventEmitter_::this.otmc=:<',this.otmc,'>');
      }
      self.createWorker();
    });
  }
  createWorker() {
    const self = this;
    fetch(`${this.scriptPath}/otmc.edcrypt.keyloader.worker.js`)
    .then((response) => response.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      if(self.trace) {
        console.log('WebWorkerLoaderBrowser::createWorker::url=:<',url,'>');
      }
      const cryptWorker = new Worker(url);
      if(self.trace) {
        console.log('WebWorkerLoaderBrowser::createWorker::cryptWorker=:<',cryptWorker,'>');
      }
      const initMsg = {
        init:{
          path:self.scriptPath,
        }
      };    
      cryptWorker.postMessage(initMsg);
      self.eeInternal.emit('webwoker.crypt.worker',{worker:cryptWorker});
    });
    fetch(`${this.scriptPath}/otmc.did.resolver.worker.js`)
    .then((response) => response.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      if(self.trace) {
        console.log('WebWorkerLoaderBrowser::createWorker::url=:<',url,'>');
      }
      const resolverWorker = new Worker(url);
      if(self.trace) {
        console.log('WebWorkerLoaderBrowser::createWorker::resolverWorker=:<',resolverWorker,'>');
      }
      const initMsg = {
        init:{
          path:self.scriptPath,
        }
      };    
      resolverWorker.postMessage(initMsg);
      self.eeInternal.emit('webwoker.resolver.worker',{worker:resolverWorker});
    });
  }
}

/**
*
*/
export class WebWorkerLoaderNode {
  constructor(eeInternal) {
    this.trace0 = false;
    this.trace = true;
    this.debug = true;
    this.eeInternal = eeInternal;
    this.ListenEventEmitter_();
  }
  ListenEventEmitter_() {
    const self = this;
    this.eeInternal.on('webwoker.create.worker',(evt)=>{
      if(this.trace) {
        console.log('WebWorkerLoaderNode::ListenEventEmitter_::evt=:<',evt,'>');
      }
      self.createWorker();
    });
  }
  createWorker() {
    const self = this;
    fetch(`${this.scriptPath}/otmc.edcrypt.keyloader.worker.js`)
    .then((response) => response.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      if(self.trace) {
        console.log('WebWorkerLoaderBrowser::createWorker::url=:<',url,'>');
      }
      const cryptWorker = new Worker(url);
      if(self.trace) {
        console.log('WebWorkerLoaderBrowser::createWorker::cryptWorker=:<',cryptWorker,'>');
      }
      self.eeInternal.emit('webwoker.crypt.worker',{type:cryptWorker});
    });
    fetch(`${this.scriptPath}/otmc.did.resolver.worker.js`)
    .then((response) => response.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      if(self.trace) {
        console.log('WebWorkerLoaderBrowser::createWorker::url=:<',url,'>');
      }
      const resolverWorker = new Worker(url);
      if(self.trace) {
        console.log('WebWorkerLoaderBrowser::createWorker::resolverWorker=:<',resolverWorker,'>');
      }
      const initMsg = {
        init:{
          path:self.scriptPath,
        }
      };    
      resolverWorker.postMessage(initMsg);
      self.eeInternal.emit('webwoker.resolver.worker',{type:resolverWorker});
    });
  }
}



const getScriptPath = () => {
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
    console.log('::getScriptPath::browser=:<',browser,'>');
  }
  const errorDummy = new Error();
  if(WebWorkerLoader.trace) {
    console.log('::getScriptPath::errorDummy.stack.trim()=:<',errorDummy.stack.trim(),'>');
  }
  let sepStackLine = '\n    at ';
  let indexOfStack = 1;
  let replacePartern = 'getScriptPath (';
  if(browser === 'firefox') {
    sepStackLine = '\n';
    indexOfStack = 0;
    replacePartern = 'getScriptPath@';
  }
  let stackParams = errorDummy.stack.trim().split(sepStackLine);
  if(WebWorkerLoader.trace) {
    console.log('::getScriptPath::stackParams=:<',stackParams,'>');
    console.log('::getScriptPath::stackParams.length=:<',stackParams.length,'>');
  }
  if(stackParams.length > indexOfStack + 1) {
    const fileStack = stackParams[indexOfStack];
    if(WebWorkerLoader.trace) {
      console.log('::getScriptPath::fileStack=:<',fileStack,'>');
    }
    const fileLine = fileStack.replace(replacePartern,'').replace(')','');
    if(WebWorkerLoader.trace) {
      console.log('::getScriptPath::fileLine=:<',fileLine,'>');
    }
    const fileLineParams = fileLine.split('/');
    if(WebWorkerLoader.trace) {
      console.log('::getScriptPath::fileLineParams=:<',fileLineParams,'>');
    }
    const scriptPath = fileLineParams.slice(0,fileLineParams.length -1).join('/');
    if(WebWorkerLoader.trace) {
      console.log('::getScriptPath::scriptPath=:<',scriptPath,'>');
    }
    return scriptPath;
  }
  return '';
}

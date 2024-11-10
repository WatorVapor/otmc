/**
*
*/
const ModuleOption = { type: 'module' };
//const ModuleOption = { };

export class WebWorkerLoader {
  constructor(eeInternal) {
    this.trace = true;
    this.debug = true;
    this.otmc = false;
    this.eeInternal = eeInternal;
    this.isNode = typeof global !== 'undefined' && typeof window === 'undefined';
    if(!this.isNode) {
      this.scriptPath = getScriptPathBrowser();
    }
    if(this.trace) {
      console.log('WebWorkerLoader::constructor::this.scriptPath=:<',this.scriptPath,'>');
    }
    this.ListenEventEmitter_();
  }
  ListenEventEmitter_() {
    const self = this;
    this.eeInternal.on('webwoker.create.worker',(evt)=>{
      if(this.trace) {
        console.log('WebWorkerLoader::ListenEventEmitter_::evt=:<',evt,'>');
      }
      if(this.trace) {
        console.log('WebWorkerLoader::ListenEventEmitter_::this.otmc=:<',this.otmc,'>');
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
      cryptWorker.postMessage(initMsg);
      self.eeInternal.emit('webwoker.crypt.worker',{worker:cryptWorker});
    });
    fetch(`${this.scriptPath}/otmc.did.resolver.worker.js`)
    .then((response) => response.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      if(self.trace) {
        console.log('WebWorkerLoader::createWorker::url=:<',url,'>');
      }
      const resolverWorker = new Worker(url, ModuleOption);
      if(self.trace) {
        console.log('WebWorkerLoader::createWorker::resolverWorker=:<',resolverWorker,'>');
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

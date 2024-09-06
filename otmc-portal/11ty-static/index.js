LOG = {
  trace:false
};
const chokidar = require('chokidar');
const execSync = require('child_process').execSync;
// One-liner for current directory
const inputWatcher = chokidar.watch('./templete_views',{
  persistent: true,
  usePolling: true,
  interval: 500,
});
inputWatcher.on('all', (event, path) => {
  onInputChanged(event, path);
});

const gTimeoutIDs = [];
const onInputChanged = (event, path) => {
  //console.log('onInputChanged::event:=<',event ,'>');
  //console.log('onInputChanged::path:=<',path ,'>');
  for(const tId of gTimeoutIDs) {
    clearTimeout(tId);
  }
  if(gTimeoutIDs.length > 0) {
    gTimeoutIDs.splice(0,gTimeoutIDs.length);
  }
  const timeId = setTimeout(()=>{
    execChangedEvt(path);
  },1000);
  gTimeoutIDs.push(timeId);
}

const execChangedEvt = (path) => {
  console.log('execChangedEvt::path:=<',path ,'>');
  try {
    const result = execSync(`npm run build`);
    console.log('execChangedEvt::result:=<',result.toString('utf-8') ,'>');
  } catch (err) {
    console.log('execChangedEvt::err:=<',err ,'>');
  }
}

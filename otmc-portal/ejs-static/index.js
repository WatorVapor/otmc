LOG = {
  trace:false
};
const fs = require('fs');
const gaze = require('gaze');
const path = require('path');
const execSync = require('child_process').execSync;
const ejs = require('ejs');
const watchOption = {
  persistent: true,
  recursive:true,
};
console.log('::watchOption:=<',watchOption ,'>');
const ejsViewRoot = './otmc-view';
const htmlViewRoot = './otmc-html';
const htmlViewPrefix = '';

/*
fs.watch(ejsViewRoot, watchOption, (eventType, filename) => {
  onOtmcViewChanged(eventType, filename);
});
*/
setTimeout(() => {
  onOtmcViewChanged();
},100);
 gaze('otmc-view/**/*.js', (err, watcher) => {
  console.log('gaze::watcher:=<',watcher ,'>');
  watcher.on('changed', (filename) => {
    console.log('gaze::filename:=<',filename ,'>');
    onOtmcViewChanged(undefined, filename);
  })
 });
 gaze('otmc-view/**/*.ejs', (err, watcher) => {
  console.log('gaze::watcher:=<',watcher ,'>');
  watcher.on('changed', (filename) => {
    console.log('gaze::filename:=<',filename ,'>');
    onOtmcViewChanged(undefined, filename);
  })
 });


const onOtmcViewChanged = (evt, pathWatch) => {
  console.log('onOtmcViewChanged::evt:=<',evt ,'>');
  //console.log('onOtmcViewChanged::pathWatch:=<',pathWatch ,'>');
  const ejsIndexs = execSync(`find ${ejsViewRoot}`).toString('utf-8');
  //console.log('onOtmcViewChanged::ejsIndexs:=<',ejsIndexs ,'>');
  const viewFiles = ejsIndexs.split('\n');
  //console.log('onOtmcViewChanged::viewFiles:=<',viewFiles ,'>');
  for(const viewFile of viewFiles) {
    if(viewFile.length > 0) {
      try {
        const fileStats = fs.lstatSync(`${viewFile}`);
        //console.log('onOtmcViewChanged::fileStats:=<',fileStats ,'>');
        if(fileStats.isFile()){
          const fileExt = path.extname(`${viewFile}`);
          //console.log('onOtmcViewChanged::fileExt:=<',fileExt ,'>');
          const fileBasename = path.basename(`${viewFile}`);
          //console.log('onOtmcViewChanged::fileBasename:=<',fileBasename ,'>');
          if(fileExt === '.ejs') {
            if(!fileBasename.startsWith('_')) {
              //console.log('onOtmcViewChanged::viewFile:=<',viewFile ,'>');
              onOtmcViewCompile(viewFile);
            } else {
              console.log('onOtmcViewChanged::skip viewFile:=<',viewFile ,'>');            
            }
          } else {
            //console.log('onOtmcViewChanged::viewFile:=<',viewFile ,'>');
            onOtmcViewCopy(viewFile);
          }
        }
      } catch (err) {
        console.log('onOtmcViewChanged::err:=<',err ,'>');
      }
    }
  }
}




const onOtmcViewCompile = async (ejsSrc) => {
  console.log('onOtmcViewCompile::ejsSrc:=<',ejsSrc ,'>');
  const htmlDst = ejsSrc.replace(ejsViewRoot,htmlViewRoot).replace('.ejs','.html');
  console.log('onOtmcViewCompile::htmlDst:=<',htmlDst ,'>');
  const htmlDir = path.dirname(htmlDst);
  console.log('onOtmcViewCompile::htmlDir:=<',htmlDir ,'>');
  const htmlDstDir = execSync(`mkdir -p ${htmlDir}`).toString('utf-8');
  console.log('onOtmcViewCompile::htmlDstDir:=<',htmlDstDir ,'>');
  const htmlDstTouch = execSync(`touch ${htmlDst}`).toString('utf-8');
  console.log('onOtmcViewCompile::htmlDstTouch:=<',htmlDstTouch ,'>');

  
  const rootView = path.resolve(ejsViewRoot);
  console.log('onOtmcViewCompile::rootView:=<',rootView ,'>');

  const htmlViewFull = path.resolve(path.dirname(ejsSrc));
  console.log('onOtmcViewCompile::htmlViewFull:=<',htmlViewFull ,'>');
  const htmlViewTitle = htmlViewFull.replace(rootView,'').replaceAll('/','-');
  console.log('onOtmcViewCompile::htmlViewTitle:=<',htmlViewTitle ,'>');

  const data = {
    prefix:htmlViewPrefix,
    title:htmlViewTitle,
  };
  console.log('onOtmcViewCompile::data:=<',data ,'>');
  const options = {
    root:rootView,
    filename:path.basename(ejsSrc)
  };
  console.log('onOtmcViewCompile::options:=<',options ,'>');
  try {
    const htmlContents = await ejs.renderFile(ejsSrc, data, options);
    if(LOG.trace) {
      console.log('onOtmcViewCompile::htmlContents:=<',htmlContents ,'>');
    }
    fs.writeFileSync(htmlDst,htmlContents);
  } catch(err) {
    console.log('onOtmcViewCompile::err:=<',err ,'>');    
  }
}


const onOtmcViewCopy = (ejsSrc) => {
  try {
    //console.log('onOtmcViewCopy::ejsSrc:=<',ejsSrc ,'>');
    const copyDst = ejsSrc.replace(ejsViewRoot,htmlViewRoot);
    //console.log('onOtmcViewCopy::copyDst:=<',copyDst ,'>');
    const copyDir = path.dirname(copyDst);
    //console.log('onOtmcViewCopy::copyDir:=<',copyDir ,'>');
    const copyDstDir = execSync(`mkdir -p ${copyDir}`).toString('utf-8');
    //console.log('onOtmcViewCopy::copyDstDir:=<',copyDstDir ,'>');
    const copyResult = execSync(`cp -f ${ejsSrc} ${copyDir}/`).toString('utf-8');
    //console.log('onOtmcViewCopy::copyResult:=<',copyResult ,'>');
  } catch(err) {
    console.log('onOtmcViewCopy::err:=<',err ,'>');
  }
}


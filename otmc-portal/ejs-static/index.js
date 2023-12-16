const fs = require('fs');
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


fs.watch(ejsViewRoot, watchOption, (eventType, filename) => {
  onOtmcViewChanged(eventType, filename);
});
setTimeout(() => {
  onOtmcViewChanged();
},100);

const onOtmcViewChanged = (evt, path) => {
  //console.log('onOtmcViewChanged::evt:=<',evt ,'>');
  //console.log('onOtmcViewChanged::path:=<',path ,'>');
  const ejsIndexs = execSync(`find ${ejsViewRoot} | grep -v layout`).toString('utf-8');
  //console.log('onOtmcViewChanged::ejsIndexs:=<',ejsIndexs ,'>');
  const viewFiles = ejsIndexs.split('\n');
  //console.log('onOtmcViewChanged::viewFiles:=<',viewFiles ,'>');
  for(const viewFile of viewFiles) {
    if(viewFile.length > 0) {
      const fileStats = fs.lstatSync(`${viewFile}`);
      //console.log('onOtmcViewChanged::fileStats:=<',fileStats ,'>');
      if(fileStats.isFile()){
        onOtmcViewCompile(viewFile);
      }
    }
  }
}

const onOtmcViewCompile = (ejsSrc) => {
  console.log('onOtmcViewCompile::ejsSrc:=<',ejsSrc ,'>');
  const htmlDst = ejsSrc.replace(ejsViewRoot,htmlViewRoot).replace('.ejs','.html');
  console.log('onOtmcViewCompile::htmlDst:=<',htmlDst ,'>');
  const htmlDir = path.dirname(htmlDst);
  console.log('onOtmcViewCompile::htmlDir:=<',htmlDir ,'>');
  const htmlDstDir = execSync(`mkdir -p ${htmlDir}`).toString('utf-8');
  console.log('onOtmcViewCompile::htmlDstDir:=<',htmlDstDir ,'>');
  const htmlDstTouch = execSync(`touch ${htmlDst}`).toString('utf-8');
  console.log('onOtmcViewCompile::htmlDstTouch:=<',htmlDstTouch ,'>');
  
  const template = fs.readFileSync(ejsSrc, 'utf-8');
  console.log('onOtmcViewCompile::template:=<',template ,'>');
  const rootView = path.resolve(ejsViewRoot);
  console.log('onOtmcViewCompile::rootView:=<',rootView ,'>');
  const data = {
    rootView:rootView
  }
  const htmlContents = ejs.render(template, data)
  console.log('onOtmcViewCompile::htmlContents:=<',htmlContents ,'>');
  fs.writeFileSync(htmlDst,htmlContents);
}



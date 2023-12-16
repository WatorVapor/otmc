const chokidar = require('chokidar');
console.log('::chokidar:=<',chokidar ,'>');

const watchOption = {
  persistent: true,
};
console.log('::watchOption:=<',watchOption ,'>');

chokidar.watch('./otmc-view').on('all', (evt, path) => {
  onOtmcViewChanged(evt, path);
});

const onOtmcViewChanged = (evt, path) => {
  console.log('onOtmcViewChanged::evt:=<',evt ,'>');
  console.log('onOtmcViewChanged::path:=<',path ,'>');
}

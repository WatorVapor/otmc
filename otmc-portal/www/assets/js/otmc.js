import { EventEmitter } from 'eventemitter3';
console.log('::::EventEmitter=:<',EventEmitter,'>');
const packPath = `${constAppPrefix}/assets/js`;
export class OtmcWorker extends EventEmitter {
  static trace = false;
  static debug = true;
  constructor() {
    super();
    this.edcrypt = new Worker(`${packPath}/otmc.worker.edcrypt.js`);
    console.log('otmc::constructor::this.edcrypt=:<',this.edcrypt,'>');
  }
  startMining() {
    const data = {
      path:packPath,
      cmd:'mine'
    }
    this.edcrypt.postMessage(data);
  }
}

import fs from 'fs';
export class OtmcConfig  {
  constructor() {
    this.trace0 = false;
    this.trace = true;
    this.debug = true;
  }
  static load(home) {
    if(this.trace0) {
      console.log('OtmcConfig::load::home=<',home,'>');
    }
    try {
      const configPath = `${home}/config.json`;
      const configText = fs.readFileSync(configPath);
      const config = JSON.parse(configText);
      if(this.trace0) {
        console.log('::::config=<',config,'>');
      }
      const conf = {};
      conf.store = config.store;
      fs.mkdirSync(`${conf.store}/secretKey`, { recursive: true });
      return conf;
    } catch ( err ) {
      console.error('::::err=<',err,'>');
    }
  }
}

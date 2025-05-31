import fs from 'fs';
export class OtmcConfig  {
  static trace0 = true;
  static trace = true;
  static debug = true;
  constructor() {
  }
  static load(home) {
    if(OtmcConfig.trace0) {
      console.log('OtmcConfig::load::home=<',home,'>');
    }
    try {
      const configPath = `${home}/config.json`;
      const configText = fs.readFileSync(configPath);
      const config = JSON.parse(configText);
      if(OtmcConfig.trace0) {
        console.log('::::config=<',config,'>');
      }
      fs.mkdirSync(`${config.store}`, { recursive: true });
      return config;
    } catch ( err ) {
      console.error('::::err=<',err,'>');
    }
  }
}

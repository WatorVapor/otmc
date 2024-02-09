const MASS = await import(`./mass.js`);
const GRVT = await import(`./graviton.js`);
export class StarMansion {
  constructor(prefix,target,cb) {
    this.target_ = target;
    if(StarMansion.debug) {
      console.log('StarMansion::constructor:MASS=<',MASS,'>');
    }
    if(target) {
      this.mass_ = new MASS.Mass();
      this.loadMass_();
      this.graviton_ = new GRVT.Graviton(this.mass_,cb);
    } else {
      this.mass_ = new MASS.Mass(prefix);
    }
    if(StarMansion.debug) {
      console.log('StarMansion::constructor:this.mass_=<',this.mass_,'>');
    }
    StarMansion.name_ = localStorage.getItem(constMasnsionName);
  }
  pub() {
    return this.mass_.pubKeyB64_;
  }
  secret() {
    return this.mass_.priKeyB64_;
  }
  address() {
    return this.mass_.address_;
  }
  name() {
    return StarMansion.name_;
  }
  storeName(name) {
    StarMansion.name_ = name;
    localStorage.setItem(constMasnsionName,name);
  }
  verifySecretKey(secretKey) {
    if(StarMansion.debug) {
      console.log('StarMansion::verifySecretKey:secretKey=<',secretKey,'>');
    }
    return this.mass_.verifySecretKey(secretKey);
  }

  importSecretKey(secretKey) {
    if(StarMansion.debug) {
      console.log('StarMansion::importSecretKey:secretKey=<',secretKey,'>');
    }
    return this.mass_.importSecretKey(secretKey);
  }
  loadMass_() {
    const keyPath = `${constMansionPrefix}/${this.target_}`;
    if(StarMansion.debug) {
      console.log('StarMansion::loadMass_:keyPath=<',keyPath,'>');
    }
    const mansionStr = localStorage.getItem(keyPath);
    if(StarMansion.debug) {
      console.log('StarMansion::loadMass_:mansionStr=<',mansionStr,'>');
    }
    if(!mansionStr) {
      return;
    }
    const mansion = JSON.parse(mansionStr);
    if(StarMansion.debug) {
      console.log('StarMansion::loadMass_:mansion=<',mansion,'>');
    }
    if(mansion && mansion.core && mansion.core.secretKey) {
      const address = this.mass_.load(mansion.core.secretKey);
      if(StarMansion.debug) {
        console.log('StarMansion::loadMass_:address=<',address,'>');
        console.log('StarMansion::loadMass_:this.target_=<',this.target_,'>');
      }
      if(this.target_ !== address) {
        this.mass_ = false;
      }
    }
  }
  static debug = true;
  static name_ = null;
}

export class MansionFactory {
  constructor() {
    if(MansionFactory.debug) {
      console.log('MansionFactory::constructor:MASS=<',MASS,'>');
    }
  }
  save(mansionObj) {
    if(MansionFactory.debug) {
      console.log('MansionFactory::save:mansionObj=<',mansionObj,'>');
    }
    const address = mansionObj.address;
    const oldListStr = localStorage.getItem(constMansionList);
    let newList = [];
    if(oldListStr) {
      newList = JSON.parse(oldListStr);
    }
    newList.push(address);
    localStorage.setItem(constMansionList,JSON.stringify(newList));
    const keyMasion = `${constMansionPrefix}/${address}`;
    localStorage.setItem(keyMasion,JSON.stringify(mansionObj));
    localStorage.removeItem(`maap/mansion/create/mass/secretKey`);
    localStorage.removeItem(`maap/mansion/create/mass/publicKey`);
    localStorage.removeItem(`maap/mansion/create/mass/address`);
  }
  static debug = true;
}



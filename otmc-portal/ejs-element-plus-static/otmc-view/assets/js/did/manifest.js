export class DIDManifest {
  static trace = false;
  static debug = true;
  static openRule = {
    id:'',
    diddoc: {
      authentication:{
        policy:'Proof.Chain'
      },
      capabilityInvocation: {
        policy:'Agree.By.Once'
      },
    },
    acl:{
      seed:{
        pub: [ ],
        sub: [ ],
        all: [
          '${did.id}/#'
        ],
      },
      authentication: {
        pub: [ ],
        sub: [ ],
        all: [
          '${did.id}/#'
        ],
      },
      capability: {
        pub: [
          '${did.id}/broadcast/${key.id}/#'
        ],
        sub: [ ],
        all: [
          '${did.id}/${key.id}/sys/did/capability/#'
        ],
      },
      invitation: {
        pub: [ ],
        sub: [ ],
        all: [
          '${did.id}/${key.id}/sys/did/invitation/#'
        ],
      },
      guest:{
        pub: [ ],
        sub:[
          '${did.id}/broadcast/#'
        ],
        all: [
          '${did.id}/${key.id}/sys/did/guest/#'
        ],
      },
    }
  };
  static dogmaRule = {
    id:'',
    did: {
      authentication:{
        policy:'Seed.Dogma'
      },
      capabilityInvocation: {
        policy:'Agree.By.Seed'
      },
    },
    acl:{
      seed:{
        pub: [ ],
        sub: [ ],
        all: [
          '${did.id}/#'
        ],
      },
      authentication: {
        pub: [ ],
        sub: [ ],
        all: [
          '${did.id}/#'
        ],
      },
      capability: {
        pub: [
          '${did.id}/broadcast/${key.id}/#'
        ],
        sub: [ ],
        all: [
          '${did.id}/${key.id}/sys/did/capability/#'
        ],
      },
      invitation: {
        pub: [ ],
        sub: [ ],
        all: [
          '${did.id}/${key.id}/sys/did/invitation/#'
        ],
      },
      guest:{
        pub: [],
        sub:[
        ],
        all: [],
      },
    }
  };  
  constructor() {
  }
  
  static rule(did) {
    const myRule = JSON.parse(JSON.stringify(DIDManifest.openRule));
    myRule.id = did;
    return myRule;
  }
}


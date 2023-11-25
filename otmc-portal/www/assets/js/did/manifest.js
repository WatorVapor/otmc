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
        all: [
          '${did.id}/#'
        ],
      },
      authentication: {
        all: [
          '${did.id}/#'
        ],
      },
      capability: {
        all: [
          '${did.id}/${key.id}/sys/did/capability/#'
        ],
        pub: [
          '${did.id}/broadcast/${key.id}/#'
        ],
      },
      invitation: {
        all: [
          '${did.id}/${key.id}/sys/did/invitation/#'
        ],
      },
      guest:{
        all: [
          '${did.id}/${key.id}/sys/did/guest/#'
        ],
        sub:[
          '${did.id}/broadcast/#'
        ]
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
        all: [
          '${did.id}/#'
        ],
      },
      authentication: {
        all: [
          '${did.id}/#'
        ],
      },
      capability: {
        all: [
          '${did.id}/${key.id}/sys/did/capability/#'
        ],
        pub: [
          '${did.id}/broadcast/${key.id}/#'
        ],
      },
      invitation: {
        all: [
          '${did.id}/${key.id}/sys/did/invitation/#'
        ],
      },
      guest:{
        pub: [],
        sub:[
        ]
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


class DIDManifest {
  static trace = false;
  static debug = true;
  static defaultRule = {
    id:'',
    diddoc: {
      authentication:{
        policy:'chain'
      },
      capabilityInvocation: {
        join:{
          permission:'once'
        }
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
          '${did.id}/${key.id}/sys/did/#'
        ],
        pub: [
          '${did.id}/broadcast/${key.id}/#'
        ],
      },
      guest:{
        all: [
          '${did.id}/${key.id}/sys/did/#'
        ],
        sub:[
          '${did.id}/broadcast/#'
        ]
      },
    }
  };
  static strictRule = {
    id:'',
    did: {
      authentication:{
        policy:'seed'
      },
      capabilityInvocation: {
        join:{
          permission:'all'
        }
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
          '${did.id}/${key.id}/sys/did/document/#'
        ],
        pub: [
          '${did.id}/broadcast/${key.id}/#'
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
    const myRule = JSON.parse(JSON.stringify(DIDManifest.defaultRule));
    myRule.id = did;
    return myRule;
  }
}

module.exports = {
  Manifest:DIDManifest,
}

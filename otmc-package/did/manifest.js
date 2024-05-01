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
      seed:[
        {
          permission: 'allow',
          action: 'all',
          topic:'${did.id}/#'
        },
      ],
      authentication:[
        {
          permission: 'allow',
          action: 'all',
          topic:'${did.id}/#'
        },
      ],
      capability: [
        {
          permission: 'allow',
          action: 'publish',
          topic:'${did.id}/broadcast/${key.id}/#'
        },
        {
          permission: 'allow',
          action: 'all',
          topic:'${did.id}/${key.id}/sys/did/capability/#'
        },
      ],
      invitation: [
        {
          permission: 'allow',
          action: 'all',
          topic:'${did.id}/${key.id}/sys/did/invitation/#'
        },
      ],
      guest:[
        {
          permission: 'allow',
          action: 'subscribe',
          topic:'${did.id}/broadcast/#'
        },
        {
          permission: 'allow',
          action: 'all',
          topic:'${did.id}/${key.id}/sys/did/guest/#'
        },
      ]
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
      seed:[
        {
          permission: 'allow',
          action: 'all',
          topic:'${did.id}/#'
        },
      ],
      authentication:[
        {
          permission: 'allow',
          action: 'all',
          topic:'${did.id}/#'
        },
      ],
      capability: [
        {
          permission: 'allow',
          action: 'publish',
          topic:'${did.id}/broadcast/${key.id}/#'
        },
        {
          permission: 'allow',
          action: 'all',
          topic:'${did.id}/${key.id}/sys/did/capability/#'
        },
      ],
      invitation: [
        {
          permission: 'allow',
          action: 'all',
          topic:'${did.id}/${key.id}/sys/did/invitation/#'
        },
      ],
      guest:[
      ],
    }
  };  
  constructor() {
  }
  
  static ruleChain(did) {
    const myRule = JSON.parse(JSON.stringify(DIDManifest.openRule));
    myRule.id = did;
    return myRule;
  }
  static ruleDogma(did) {
    const myRule = JSON.parse(JSON.stringify(DIDManifest.dogmaRule));
    myRule.id = did;
    return myRule;
  }
}


export class DIDManifest {
  static trace = false;
  static debug = true;
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
        {
          permission: 'allow',
          action: 'all',
          topic:'${did.id}/${key.id}/capability/#'
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
  static capabilityCloseRule = {
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
      ],
      invitation: [
        {
          permission: 'allow',
          action: 'all',
          topic:'${did.id}/${key.id}/sys/did/invitation/#'
        },
      ],
      guest:[
      ]
    }
  };
  static ruleChainGuestClose = {
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
        {
          permission: 'allow',
          action: 'all',
          topic:'${did.id}/${key.id}/capability/#'
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
      ]
    }
  };
  static GuestOpenRule = {
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
        {
          permission: 'allow',
          action: 'all',
          topic:'${did.id}/${key.id}/capability/#'
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
  constructor() {
  }

  static ruleDogma(did) {
    const myRule = JSON.parse(JSON.stringify(DIDManifest.dogmaRule));
    myRule.id = did;
    return myRule;
  }
  static ruleChainCapClose(did) {
    const myRule = JSON.parse(JSON.stringify(DIDManifest.capabilityCloseRule));
    myRule.id = did;
    return myRule;
  }
  static ruleChainGuestClose(did) {
    const myRule = JSON.parse(JSON.stringify(DIDManifest.ruleChainGuestClose));
    myRule.id = did;
    return myRule;
  }
  static ruleChainGuestOpen(did) {
    const myRule = JSON.parse(JSON.stringify(DIDManifest.GuestOpenRule));
    myRule.id = did;
    return myRule;
  }
}


export class DIDManifest {
  static trace = false;
  static debug = true;
  static dogmaRuleSeed = {
    id:'',
    did: {
      authentication:{
        policy:'Seed.Dogma'
      },
    },
    acl:{
      seed:[
        {
          permission: 'allow',
          action: 'all',
          topic:'${did.id}/#'
        },
        {
          permission: 'allow',
          action: 'subscribe',
          topic:'${did.controller}/broadcast/auth/#'
        },
      ],
      authentication:[
        {
          permission: 'allow',
          action: 'all',
          topic:'${did.id}/#'
        },
        {
          permission: 'allow',
          action: 'subscribe',
          topic:'${did.controller}/broadcast/auth/#'
        },
      ],
      guest:[
      ],
    }
  };
  static dogmaRuleRoot = {
    id:'',
    did: {
      authentication:{
        policy:'Root.Dogma'
      },
    },
    acl:{
      seed:[
        {
          permission: 'allow',
          action: 'all',
          topic:'${did.id}/#'
        },
        {
          permission: 'allow',
          action: 'subscribe',
          topic:'${did.controller}/broadcast/auth/#'
        },
      ],
      authentication:[
        {
          permission: 'allow',
          action: 'all',
          topic:'${did.id}/#'
        },
        {
          permission: 'allow',
          action: 'subscribe',
          topic:'${did.controller}/broadcast/auth/#'
        },
      ],
      guest:[
      ],
    }
  };
  static chainRuleGuestClose = {
    id:'',
    diddoc: {
      authentication:{
        policy:'Proof.Chain'
      },
    },
    acl:{
      seed:[
        {
          permission: 'allow',
          action: 'all',
          topic:'${did.id}/#'
        },
        {
          permission: 'allow',
          action: 'subscribe',
          topic:'${did.controller}/broadcast/auth/#'
        },
      ],
      authentication:[
        {
          permission: 'allow',
          action: 'all',
          topic:'${did.id}/#'
        },
        {
          permission: 'allow',
          action: 'subscribe',
          topic:'${did.controller}/broadcast/auth/#'
        },
      ],
      guest:[
      ]
    }
  };
  static chainRuleGuestOpen = {
    id:'',
    diddoc: {
      authentication:{
        policy:'Proof.Chain'
      },
    },
    acl:{
      seed:[
        {
          permission: 'allow',
          action: 'all',
          topic:'${did.id}/#'
        },
        {
          permission: 'allow',
          action: 'subscribe',
          topic:'${did.controller}/broadcast/auth/#'
        },
      ],
      authentication:[
        {
          permission: 'allow',
          action: 'all',
          topic:'${did.id}/#'
        },
        {
          permission: 'allow',
          action: 'subscribe',
          topic:'${did.controller}/broadcast/auth/#'
        },
      ],
      guest:[
        {
          permission: 'allow',
          action: 'subscribe',
          topic:'${did.controller}/broadcast/guest/#'
        },
        {
          permission: 'allow',
          action: 'subscribe',
          topic:'${did.id}/broadcast/guest/#'
        },
      ]
    }
  };
/**
 * Initializes a new instance of the DIDManifest class.
 */
  constructor() {
    
  }
  /**
   * @function
   * @description Returns a manifest rule for dogmaSeed of the given did.
   * @param {string} did - The did to generate a manifest rule for.
   * @returns {Object} A manifest rule for the given did.
   */
  static ruleDogmaSeed(did) {
    const myRule = JSON.parse(JSON.stringify(DIDManifest.dogmaRuleSeed));
    myRule.id = did;
    return myRule;
  }
  /**
   * @function
   * @description Returns a manifest rule for dogmaRoot of the given did.
   * @param {string} did - The did to generate a manifest rule for.
   * @returns {Object} A manifest rule for the given did.
   */
  static ruleDogmaRoot(did) {
    const myRule = JSON.parse(JSON.stringify(DIDManifest.dogmaRuleRoot));
    myRule.id = did;
    return myRule;
  }
/*************  ✨ Codeium Command ⭐  *************/
  /**
   * @function
   * @description Returns a manifest rule for chain guest close of the given did.
   * @param {string} did - The did to generate a manifest rule for.
   * @returns {Object} A manifest rule for the given did.
   */
/******  d328eac7-bc5f-4ebc-8bc4-19f9b8c27fd5  *******/
  static ruleChainGuestClose(did) {
    const myRule = JSON.parse(JSON.stringify(DIDManifest.chainRuleGuestClose));
    myRule.id = did;
    return myRule;
  }
/*************  ✨ Codeium Command ⭐  *************/
  /**
   * @function
   * @description Returns a manifest rule for chain guest open of the given did.
   * @param {string} did - The did to generate a manifest rule for.
   * @returns {Object} A manifest rule for the given did.
   */
/******  b6bc1a92-48b3-47ab-a134-1622b55511cf  *******/
  static ruleChainGuestOpen(did) {
    const myRule = JSON.parse(JSON.stringify(DIDManifest.chainRuleGuestOpen));
    myRule.id = did;
    return myRule;
  }
}


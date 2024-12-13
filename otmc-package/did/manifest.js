export class DIDManifest {
  static trace = false;
  static debug = true;
  static dogmaRuleSeed = {
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
  static dogmaRuleController = {
    did: {
      authentication:{
        policy:'Controller.Dogma'
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
    did: {
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
    did: {
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
  static ruleDogmaSeed() {
    const myRule = JSON.parse(JSON.stringify(DIDManifest.dogmaRuleSeed));
    return myRule;
  }
  /**
   * @function
   * @description Returns a manifest rule for dogmaRoot of the given did.
   * @returns {Object} A manifest rule for the given did.
   */
  static ruleDogmaController() {
    const myRule = JSON.parse(JSON.stringify(DIDManifest.dogmaRuleController));
    return myRule;
  }
  /**
   * @function
   * @description Returns a manifest rule for chain guest close of the given did.
   * @returns {Object} A manifest rule for the given did.
   */
  static ruleChainGuestClose() {
    const myRule = JSON.parse(JSON.stringify(DIDManifest.chainRuleGuestClose));
    return myRule;
  }
  /**
   * @function
   * @description Returns a manifest rule for chain guest close of the given did.
   * @returns {Object} A manifest rule for the given did.
   */
  static ruleChainGuestOpen() {
    const myRule = JSON.parse(JSON.stringify(DIDManifest.chainRuleGuestOpen));
    return myRule;
  }
}
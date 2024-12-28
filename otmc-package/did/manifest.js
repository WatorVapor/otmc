export class DIDManifest {
  static trace = false;
  static debug = true;
  /**
   * Represents the dogma rule seed configuration.
   * 
   * @property {Object} did - The DID (Decentralized Identifier) configuration.
   * @property {Object} did.authentication - The authentication policy for the DID.
   * @property {string} did.authentication.policy - The policy name for authentication.
   * 
   * @property {Object} acl - The Access Control List (ACL) configuration.
   * @property {Array<Object>} acl.seed - The ACL rules for seed.
   * @property {string} acl.seed[].permission - The permission type (e.g., 'allow').
   * @property {string} acl.seed[].action - The action type (e.g., 'all', 'subscribe').
   * @property {string} acl.seed[].topic - The topic pattern for the ACL rule.
   * 
   * @property {Array<Object>} acl.authentication - The ACL rules for authentication.
   * @property {string} acl.authentication[].permission - The permission type (e.g., 'allow').
   * @property {string} acl.authentication[].action - The action type (e.g., 'all', 'subscribe').
   * @property {string} acl.authentication[].topic - The topic pattern for the ACL rule.
   * 
   * @property {Array<Object>} acl.guest - The ACL rules for guests.
   */
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
  /**
   * Dogma Rule Controller configuration object.
   * 
   * @property {Object} did - DID (Decentralized Identifier) related configurations.
   * @property {Object} did.authentication - Authentication policy for DID.
   * @property {string} did.authentication.policy - Policy name for authentication.
   * 
   * @property {Object} acl - Access Control List configurations.
   * @property {Array<Object>} acl.seed - Seed ACL rules.
   * @property {string} acl.seed[].permission - Permission type (e.g., 'allow').
   * @property {string} acl.seed[].action - Action type (e.g., 'all', 'subscribe').
   * @property {string} acl.seed[].topic - Topic pattern for the ACL rule.
   * 
   * @property {Array<Object>} acl.authentication - Authentication ACL rules.
   * @property {string} acl.authentication[].permission - Permission type (e.g., 'allow').
   * @property {string} acl.authentication[].action - Action type (e.g., 'all', 'subscribe').
   * @property {string} acl.authentication[].topic - Topic pattern for the ACL rule.
   * 
   * @property {Array<Object>} acl.guest - Guest ACL rules (currently empty).
   */
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
  /**
   * Represents the chain rule configuration for guest close.
   * 
   * @property {Object} did - The DID (Decentralized Identifier) configuration.
   * @property {Object} did.authentication - The authentication policy for the DID.
   * @property {string} did.authentication.policy - The policy used for authentication, set to 'Proof.Chain'.
   * 
   * @property {Object} acl - The Access Control List (ACL) configuration.
   * @property {Array<Object>} acl.seed - The seed permissions.
   * @property {string} acl.seed[].permission - The permission type, set to 'allow'.
   * @property {string} acl.seed[].action - The action allowed, set to 'all' or 'subscribe'.
   * @property {string} acl.seed[].topic - The topic pattern for the permission.
   * 
   * @property {Array<Object>} acl.authentication - The authentication permissions.
   * @property {string} acl.authentication[].permission - The permission type, set to 'allow'.
   * @property {string} acl.authentication[].action - The action allowed, set to 'all' or 'subscribe'.
   * @property {string} acl.authentication[].topic - The topic pattern for the permission.
   * 
   * @property {Array<Object>} acl.guest - The guest permissions, currently empty.
   */
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
  /**
   * Represents the chain rule for guest open access.
   * 
   * @property {Object} did - The DID (Decentralized Identifier) configuration.
   * @property {Object} did.authentication - The authentication policy for the DID.
   * @property {string} did.authentication.policy - The policy used for authentication, set to 'Proof.Chain'.
   * 
   * @property {Object} acl - The Access Control List (ACL) configuration.
   * @property {Array<Object>} acl.seed - The seed permissions.
   * @property {string} acl.seed[].permission - The permission type, set to 'allow'.
   * @property {string} acl.seed[].action - The action allowed, set to 'all' or 'subscribe'.
   * @property {string} acl.seed[].topic - The topic pattern for the permission.
   * 
   * @property {Array<Object>} acl.authentication - The authentication permissions.
   * @property {string} acl.authentication[].permission - The permission type, set to 'allow'.
   * @property {string} acl.authentication[].action - The action allowed, set to 'all' or 'subscribe'.
   * @property {string} acl.authentication[].topic - The topic pattern for the permission.
   * 
   * @property {Array<Object>} acl.guest - The guest permissions.
   * @property {string} acl.guest[].permission - The permission type, set to 'allow'.
   * @property {string} acl.guest[].action - The action allowed, set to 'subscribe'.
   * @property {string} acl.guest[].topic - The topic pattern for the permission.
   */
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
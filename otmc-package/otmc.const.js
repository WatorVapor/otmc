/**
 * @constant {Object} StoreKey - An object containing keys for various storage paths.
 * @property {string} didKeyList - Key for the list of DID keys.
 * @property {Object} secret - An object containing keys for secret storage.
 * @property {Object} secret.authKey - An object containing keys for authentication.
 * @property {string} secret.authKey.dbName - Key for the authentication database.
 * @property {Object} secret.did - An object containing keys for DID accounts.
 * @property {string} secret.did.dbName - Key for the DID account database.
 * @property {Object} secret.mqtt - An object containing keys for MQTT.
 * @property {Object} secret.mqtt.jwt - An object containing keys for JWT.
 * @property {string} secret.mqtt.jwt.dbName - Key for the MQTT JWT database.
 * @property {Object} open - An object containing keys for open storage.
 * @property {Object} open.did - An object containing keys for open DID.
 * @property {Object} open.did.document - An object containing keys for DID documents.
 * @property {string} open.did.document.dbName - Key for the DID document database.
 * @property {Object} open.did.chain - An object containing keys for DID chains.
 * @property {string} open.did.chain.dbName - Key for the DID chain database.
 * @property {Object} open.did.join - An object containing keys for DID join requests.
 * @property {string} open.did.join.dbName - Key for the DID join credential request verifiable database.
 */
export const StoreKey = {
  didKeyList:'otmc/didkey/list',
  secret: {
    authKey: {
      dbName: 'otmc/secret/did/authKey',
    },
    did: {
      dbName:'otmc/secret/did/account',
    },
    mqtt: {
      jwt: {
        dbName:'otmc/secret/mqtt/jwt',
      },
    },
  },
  open: {
    did: {
      document: {
        dbName:'otmc/open/did/document',
      },
      chain: {
        dbName:'otmc/open/did/chain',
      },
      join: {
        dbName: 'otmc/open/did/join/credential_request_verifiable',
      }
    }
  },
}

export const OtmcPortal = {
  jwt:{
    did:{
      '#wss':'wss://otmc.wator.xyz/jwt/mqtt/otmc/wss',
      'rest':'https://otmc.wator.xyz/ns/did/jwt/mqtt/rest',
    }
  }
}


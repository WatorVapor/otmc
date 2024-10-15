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
      manifest: {
        dbName:'otmc/open/did/manifest',
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
      wss:'wss://mqtt.wator.xyz/jwt/mqtt/otmc/wss/public',
    }
  }
}


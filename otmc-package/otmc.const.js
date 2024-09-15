export const StoreKey = {
  didKeyList:'otmc/didkey/list',
  auth:'otmc/auth/key',
  recovery:'otmc/recovery/key',
  didDoc:'otmc/did/document',
  manifest:'otmc/did/manifest',
  mqttJwt:'otmc/mqtt/jwt',
  invitation:{
    join:'otmc/did/invitation/join',
  },
  secret: {
    authKey:'otmc/secret/did/authKey',
    did: {
      property:'otmc/secret/did/property',
    },
  },
  open: {
    did: {
      document:'otmc/open/did/document',
      manifest:'otmc/open/did/manifest',
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


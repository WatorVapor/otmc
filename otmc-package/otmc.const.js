export const StoreKey = {
  didKeyList:'otmc/didkey/list',
  secret: {
    authKey:'otmc/secret/did/authKey',
    did: {
      account :'otmc/secret/did/account',
    },
    mqtt: {
      jwt:'otmc/secret/mqtt/jwt',
    },
  },
  open: {
    did: {
      document:'otmc/open/did/document',
      manifest:'otmc/open/did/manifest',
    }
  },
  /*
  auth:'otmc/auth/key',
  recovery:'otmc/recovery/key',
  didDoc:'otmc/did/document',
  manifest:'otmc/did/manifest',
  mqttJwt:'otmc/mqtt/jwt',
  */
  invitation:{
    join:'otmc/did/invitation/join',
  },
}

export const OtmcPortal = {
  jwt:{
    did:{
      wss:'wss://mqtt.wator.xyz/jwt/mqtt/otmc/wss/public',
    }
  }
}


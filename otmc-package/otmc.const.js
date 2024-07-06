export const StoreKey = {
  auth:'otmc/auth/key',
  recovery:'otmc/recovery/key',
  didDoc:'otmc/did/document',
  manifest:'otmc/did/manifest',
  mqttJwt:'otmc/mqtt/jwt',
  invitation:{
    join:'otmc/did/invitation/join',
  },
}

export const OtmcPortal = {
  jwt:{
    did:{
      _wss:'wss://mqtt.wator.xyz:8084/jwt/mqtt/otmc/public/ws',
      rest:'https://otmc.wator.xyz/api/v1/mqtt/jwt/public',
    }
  }
}


export const StoreKey = {
  auth:'otmc/auth/key',
  recovery:'otmc/recovery/key',
  didDoc:'otmc/did/document',
  manifest:'otmc/did/manifest',
  mqttJwt:'otmc/mqtt/jwt',
}

export const OtmcPortal = {
  jwt:{
    did:{
      wss:'wss://mqtt.wator.xyz:8084/jwt/did/ws',
      www:'wss://mqtt.wator.xyz:8084/jwt/did/www',
    }
  }
}


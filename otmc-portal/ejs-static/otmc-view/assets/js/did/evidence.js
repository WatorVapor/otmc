class EvidenceConfig {
  static mqtt_wss = 'wss://mqtt.wator.xyz:8084/mqtt';
  static mqtt_ssl = 'mqtts://mqtt.wator.xyz:8883';
  constructor() {
  }
}

class DIDEvidence {
  static trace = false;
  static debug = true;
  constructor(auth,recovery) {
    this.auth_ = auth;
    this.recovery_ = recovery;
  }
  document() {
  }
}

module.exports = {
  Evidence:DIDEvidence,
}
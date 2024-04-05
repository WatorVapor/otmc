# otmc
open transparent mqtt cluster

### otmc structure:
```mermaid
graph TD;
    otmc-peripheral-uwb --> otmc-hub;
    otmc-peripheral-gps --> otmc-hub;
    otmc-peripheral-ble --> otmc-hub;
    otmc-peripheral-wifi --> otmc-hub;
    
    otmc-hub --> mqtt-broker-cluster;
    otmc-portal --> mqtt-broker-cluster;
    
    otmc-team --> otmc-portal;
    otmc-provision --> otmc-portal;
    otmc-dash --> otmc-portal;

    mqtt-broker-cluster --> mqtt-broker-node-1;
    mqtt-broker-cluster --> mqtt-broker-node-2;
    mqtt-broker-cluster --> mqtt-broker-node-*;
    mqtt-broker-cluster --> mqtt-broker-node-n;

```

# otmc
open transparent mqtt cluster

## otmc structure:
```mermaid
graph TD;
    otmc-peripheral-uwb --> otmc-hub;
    otmc-peripheral-gps --> otmc-hub;
    otmc-peripheral-ble --> otmc-hub;
    otmc-peripheral-wifi --> otmc-hub;
    

    otmc-hub --> mqtt-broker-cluster;
    otmc-portal --> mqtt-broker-cluster;

    did-verifiable-resentation-request  --> team-did;
    did-verifiable-credential  --> team-did;
    did-resolver --> team-did;
    did-document --> team-did;
    
    team-manifest --> otmc-team;
    team-property --> otmc-team;
    team-did --> otmc-team;

    otmc-team --> otmc-portal;
    otmc-team --> otmc-hub;
    otmc-provision --> otmc-portal;
    otmc-dash --> otmc-portal;


    mqtt-broker-cluster --> mqtt-broker-node-1;
    mqtt-broker-cluster --> mqtt-broker-node-2;
    mqtt-broker-cluster --> mqtt-broker-node-*;
    mqtt-broker-cluster --> mqtt-broker-node-n;

```

## otmc flowchat.
### otmc mine auth key pair for did team.
```mermaid
flowchart TD
    start["Start mining auth ed25519 keys"]
    loadWebWorker["Load Web work in backgroud"]
    genkeypai["Generate keypair of ed25519 "]
    hashKey["Hash public key"]
    progress["Report progress of mining"]
    goodKey{"Is hash start with 'otm'"}
    storeKey["Save key in storage"]
    finnish["finnish mining auth ed25519 keys"]
    
    start-->loadWebWorker
    loadWebWorker -->genkeypai
    genkeypai -->hashKey
    hashKey -->progress
    progress -->goodKey
    goodKey -- false --> genkeypai
    goodKey -- true --> storeKey
    storeKey --> finnish
```
### otmc create self-control did team.
```mermaid
flowchart TD
    create["Create did team"]
    loadKey["load DID auth key"]
    control["Add self key address to DID document control"]
    document["Create Did document"]
    sign["Sign Did document with auth key"]
    store["Store Did document in local storage"]
    sync["Sync Did document to did resolver storage(cloud)"]

    create --> loadKey
    loadKey --> control
    control --> document
    document --> sign
    sign --> store
    store --> sync

```
### otmc create other-control did team.
```mermaid
flowchart TD
    create["Create did team"]
    loadKey["load DID auth key"]
    input["input controller of the team"]
    control["Add input to DID document control"]
    document["Create Did document"]
    sign["Sign Did document with auth key"]
    store["Store Did document in local storage"]
    vrr["create verifiable resentation request"]
    vcr_accept["control verifiable credential accept"]
    vcr_reject["control verifiable credential reject"]
    sync["Sync Did document to did resolver storage(cloud)"]
    success["success created team with other control"]
    fail["Failure created team with other control"]

    create --> loadKey
    loadKey --> input
    input --> control
    control --> document
    document --> sign
    sign --> store
    store --> vrr
    vrr --accept--> vcr_accept
    vrr --reject--> vcr_reject
    vcr_accept --> sync
    sync --> success 
    vcr_reject --> fail
```
### otmc join exist did team.
```mermaid
flowchart TD
    join["join did team"]
    loadKey["load DID auth key"]
    input["input team DID id"]
    document["create Did document"]
    sign["Sign Did document with auth key"]
    store["Store Did document in local storage"]
    vrr["join verifiable resentation request"]
    vcr_accept["control or self verifiable credential accept"]
    vcr_reject["control or self verifiable credential reject"]
    sync["Sync Did document to did resolver storage(cloud)"]
    success["success created team with other control"]
    fail["Failure created team with other control"]

    join --> loadKey
    loadKey --> input
    input --> document
    document --> sign
    sign --> store
    store --> vrr
    vrr --accept--> vcr_accept
    vrr --reject--> vcr_reject
    vcr_accept --> sync
    sync --> success 
    vcr_reject --> fail
```


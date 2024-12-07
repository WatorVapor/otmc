# otmc and did document
open transparent mqtt cluster

## DidDocument and EdAuth EdDsaKey:

```mermaid
C4Deployment
    Deployment_Node(did, "Did Document") {
        Container(didAddress, "Did Address","id:'did:otmc:otm...'")
        Deployment_Node(authhMembers, "authentication:[]") {
            Container(authMember, "Did Auth Member 1","'did:otmc:otm...#otm...'")
            Container(authMember2, "Did Auth Member ...","'did:otmc:otm...#otm...'")
        }
        Rel(didAddress, authMember,  "${didAddress}#${keyAddress}", "")
    }

    Deployment_Node(EdDsaKey, "EdDsaKey") {
        Container(keyAddress, "Key Address","'otm...'")
        Deployment_Node(ED25519Key, "ED25519 Key Pair") {
            Container(publicKey, "Public Key",)
            Container(secretKey, "Secret Key",)
        }
    }
    Rel(keyAddress, publicKey, "hash->hash->base32", "")
    BiRel(secretKey, publicKey, "", "")


    Rel(didAddress, keyAddress, "did:otmc:${keyAddress}", "")

    Rel(authMember, keyAddress, "${didAddress}#${keyAddress}", "")

    UpdateLayoutConfig($c4ShapeInRow="1", $c4BoundaryInRow="4")

```

## DidDocument root, end entity, seed, fork:

```mermaid
C4Deployment
    Deployment_Node(didRoot, "Did Document Root") {
        Container(didAddress, "Did Address","id:'did:otmc:otm...'")
        Deployment_Node(authhMembers, "authentication:[]") {
            Container(authMember, "Did Auth Member 1","'did:otmc:otm...#otm...'")
            Container(authMemberSeed, "Did Auth Seed Member ...","'did:otmc:otm...#otm...'")
            Container(authMemberFork, "Did Auth Fork Member ...","'did:otmc:otm...#otm...'")
        }
        Rel(didAddress, authMember,  "${didAddress}#${keyAddress}", "")
        BiRel(authMemberSeed, authMemberFork,  "IF 'Member keyAddress' = 'didAddress' -> Seed  ELSE Fork", "")
        UpdateRelStyle(authMemberSeed, authMemberFork, "red", "blue")
        Deployment_Node(controllers, "controller:[]") {
            Container(controller, "Did controller Member 1","'did:otmc:otm...'")
        }
        Rel(controller, didAddress,  "use mine did in controller,root", "")
        UpdateRelStyle(controller, didAddress, "red", "blue","-40","-40")
    }

    Deployment_Node(didEndEntity, "Did Document End Entity") {
        Container(didAddressEE, "Did Address","id:'did:otmc:otm...'")
        Deployment_Node(authhMembersEE, "authentication:[]") {
            Container(authMemberEE, "Did Auth Member 1","'did:otmc:otm...#otm...'")
            Container(authMemberEE2, "Did Auth Member ...","'did:otmc:otm...#otm...'")
        }
        Rel(didAddressEE, authMemberEE,  "${didAddress}#${keyAddress}", "")
        Deployment_Node(controllersEE, "controller:[]") {
            Container(controllerEE, "Did controller Member 1","'did:otmc:otm...'")
        }
        Rel(controllerEE, didAddress,  "Use other did in controller,end entity ", "")
        UpdateRelStyle(controllerEE, didAddress, "red", "blue","-40","-40")

    }

    UpdateLayoutConfig($c4ShapeInRow="1", $c4BoundaryInRow="4")

```

## DidDocument Proof (in progress):

```mermaid
C4Deployment
    Deployment_Node(didProof, "Did Document Proofed") {
        Container(didAddress, "Did Address","id:'did:otmc:otm...'")
        Deployment_Node(authhMembers, "authentication:[]") {
            Container(authMember, "Did Auth Member 1","'did:otmc:otm...#otm...'")
            Container(authMemberSeed, "Did Auth Seed Member ...","'did:otmc:otm...#otm...'")
            Container(authMemberFork, "Did Auth Fork Member ...","'did:otmc:otm...#otm...'")
        }
        Rel(didAddress, authMember,  "${didAddress}#${keyAddress}", "")
        BiRel(authMemberSeed, authMemberFork,  "IF 'Member keyAddress' = 'didAddress' -> Seed  ELSE Fork", "")
        UpdateRelStyle(authMemberSeed, authMemberFork, "red", "blue")
        Deployment_Node(controllers, "controller:[]") {
            Container(controller, "Did controller Member 1","'did:otmc:otm...'")
        }
        Rel(controller, didAddress,  "use mine did in controller,root", "")
        UpdateRelStyle(controller, didAddress, "red", "blue","-40","-40")
    }

    Deployment_Node(didNotProof, "Did Document NOT Proofed") {
        Container(didAddressEE, "Did Address","id:'did:otmc:otm...'")
        Deployment_Node(authhMembersEE, "authentication:[]") {
            Container(authMemberEE, "Did Auth Member 1","'did:otmc:otm...#otm...'")
            Container(authMemberEE2, "Did Auth Member ...","'did:otmc:otm...#otm...'")
        }
        Rel(didAddressEE, authMemberEE,  "${didAddress}#${keyAddress}", "")
        Deployment_Node(controllersEE, "controller:[]") {
            Container(controllerEE, "Did controller Member 1","'did:otmc:otm...'")
        }
        Rel(controllerEE, didAddress,  "Use other did in controller,end entity ", "")
        UpdateRelStyle(controllerEE, didAddress, "red", "blue","-40","-40")

    }

    UpdateLayoutConfig($c4ShapeInRow="1", $c4BoundaryInRow="4")
```

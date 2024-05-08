#!/bin/bash
source ../docker.env.sh
echo "DOCKER_NODE:=${DOCKER_NODE}"
${DOCKER_NODE} node \
  ../cli/join.team.js --address 'did:otmc:otmsnaftnd45lzlcdrsqpr73zzst3okf'

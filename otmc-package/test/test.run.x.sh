#!/bin/bash
source ../docker.env.test.sh
echo "DOCKER_NODE:=${DOCKER_NODE}"
${DOCKER_NODE} npm test

#!/bin/bash
source ./docker.env.sh
echo "DOCKER_NODE:=${DOCKER_NODE}"
${DOCKER_NODE} node ../cli/create.seed.js

#!/bin/bash
source ./docker.env.sh
echo "DOCKER_NODE_BG:=${DOCKER_NODE_BG}"
${DOCKER_NODE_BG} node index.mjs

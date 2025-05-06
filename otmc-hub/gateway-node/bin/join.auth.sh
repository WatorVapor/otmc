#!/bin/bash
SCRIPT_WHERE=$(cd "$(dirname "$0")" && pwd)
echo "SCRIPT_WHERE: $SCRIPT_WHERE"
cd $SCRIPT_WHERE
source ../docker.env.cli.sh
echo "DOCKER_NODE_CLI:=${DOCKER_NODE_CLI}"
${DOCKER_NODE_CLI} node \
  ./cli/cli.mjs --subcommand ${0} ${@:1} \
  || true
cd -

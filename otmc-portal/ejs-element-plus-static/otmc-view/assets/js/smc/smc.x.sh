#!/bin/bash
source ./docker.env.sh
echo "DOCKER_NODE:=${DOCKER_NODE}"
${DOCKER_NODE} java -jar /opt/Smc.jar -js ./otmc.state.machine.sm 

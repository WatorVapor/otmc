#!/bin/bash
source ./docker.env.sh
echo "DOCKER_PYTHON:=${DOCKER_PYTHON}"
${DOCKER_PYTHON} /bin/bash

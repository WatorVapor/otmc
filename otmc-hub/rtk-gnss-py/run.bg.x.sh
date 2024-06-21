#!/bin/bash
source ./docker.env.sh
echo "DOCKER_PYTHON_BG:=${DOCKER_PYTHON_BG}"
${DOCKER_PYTHON_BG} python3 main.py

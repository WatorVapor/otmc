#!/bin/bash
SCRIPT_DIR=$(cd $(dirname $0); pwd)
PARENT_DIR=$(dirname $SCRIPT_DIR)
BASE_NAME=$(basename $SCRIPT_DIR)
echo "SCRIPT_DIR:=${SCRIPT_DIR}"
echo "PARENT_DIR:=${PARENT_DIR}"
chmod 777 -R ./*
read -d ''  DOCKER_NODE << EOF
docker run 
  -v /dev/shm/:/dev/shm/ 
  -v ./:/ws 
  -w /ws 
  --net host 
  --memory=1G 
  --cpu-shares=128 
  node:lts
EOF


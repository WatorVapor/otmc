#!/bin/bash
#echo "BASH_SOURCE[0]:=${BASH_SOURCE[0]}"
#SCRIPT_DIR=$(cd $(dirname $0); pwd)
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PARENT_DIR=$(dirname $SCRIPT_DIR)
GPARENT_DIR=$(dirname $PARENT_DIR)
BASE_NAME=$(basename $SCRIPT_DIR)
PARENT_NAME=$(basename $PARENT_DIR)
GPARENT_NAME=$(basename $GPARENT_DIR)
#echo "SCRIPT_DIR:=${SCRIPT_DIR}"
#echo "PARENT_DIR:=${PARENT_DIR}"
#echo "GPARENT_DIR:=${GPARENT_DIR}"

DOCKER_MAME_CLI=${GPARENT_NAME}-${PARENT_NAME}-${BASE_NAME}-cli
docker stop ${DOCKER_MAME_CLI}
docker rm ${DOCKER_MAME_CLI}
read -d ''  DOCKER_NODE_CLI << EOF
docker run -it
  -v /etc/group:/etc/group:ro 
  -v /etc/passwd:/etc/passwd:ro 
  -v /dev/shm/:/dev/shm/ 
  -v /opt/otmc:/opt/otmc
  -v ${GPARENT_DIR}:${GPARENT_DIR} 
  -v ${HOME}:${HOME} 
  -u $(id -u $USER):$(id -g $USER) 
  -w ${SCRIPT_DIR} 
  --net host 
  --memory=256M 
  --cpu-shares=128 
  --name ${DOCKER_MAME_CLI} 
  node:22
EOF

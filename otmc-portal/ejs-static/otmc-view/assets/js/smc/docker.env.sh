#!/bin/bash
docker build --tag wator-smc ./
SCRIPT_DIR=$(cd $(dirname $0); pwd)
PARENT_DIR=$(dirname $SCRIPT_DIR)
BASE_NAME=$(basename $SCRIPT_DIR)
echo "SCRIPT_DIR:=${SCRIPT_DIR}"
echo "PARENT_DIR:=${PARENT_DIR}"
DOCKER_MAME=${BASE_NAME}-unix
docker stop ${DOCKER_MAME}
docker rm ${DOCKER_MAME}
read -d ''  DOCKER_NODE << EOF
docker run -it
  -v /etc/group:/etc/group:ro 
  -v /etc/passwd:/etc/passwd:ro 
  -v /dev/shm/:/dev/shm/ 
  -v ${PARENT_DIR}:${PARENT_DIR} 
  -v ${HOME}:${HOME} 
  -u $(id -u $USER):$(id -g $USER) 
  -w ${SCRIPT_DIR} 
  --net host 
  --memory=1G 
  --cpu-shares=128 
  --name ${DOCKER_MAME} 
  wator-smc
EOF


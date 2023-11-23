#!/bin/bash
source ./docker.env.sh
echo "DOCKER_NODE:=${DOCKER_NODE}"
${DOCKER_NODE} emcc -sWASM=1 \
  -sSTANDALONE_WASM -sINVOKE_RUN=0 \
  main.c tweetnacl.export.c tweetnacl.c -o tweetnacl.html \
  -sEXPORTED_FUNCTIONS=_int_sqrt -sEXPORTED_RUNTIME_METHODS=ccall,cwrap

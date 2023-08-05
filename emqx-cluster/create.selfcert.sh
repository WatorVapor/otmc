#!/bin/bash
mkdir -p ./self-certs/
openssl genrsa -des3 -out ./self-certs/rootCA.key 2048
pwd
openssl req -x509 -new -nodes -key ./self-certs/rootCA.key -sha256 -days 3650 -out ./self-certs/rootCA.crt
pwd
openssl genrsa -out ./self-certs/server.key 2048
pwd
openssl req -new -key ./self-certs/server.key -out ./self-certs/server.csr
pwd
openssl x509 -req -in ./self-certs/server.csr -CA ./self-certs/rootCA.crt -CAkey ./self-certs/rootCA.key -CAcreateserial -out ./self-certs/server.crt -days 365
pwd

#!/bin/bash
mkdir -p ./self-certs/
cd ./self-certs/
pwd
openssl genrsa -des3 -out ./rootCA.key 2048
openssl req -x509 -new -nodes -key ./rootCA.key -sha256 -days 3650 -out ./rootCA.crt
openssl genrsa -out ./server.key 2048
openssl req -new -key ./server.key -out ./server.csr
openssl x509 -req -in ./server.csr -CA ./rootCA.crt -CAkey ./rootCA.key -CAcreateserial -out ./server.crt -days 365
cd -
pwd

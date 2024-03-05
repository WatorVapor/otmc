#!/bin/bash
TTY_CONF=/etc/systemd/system/getty@tty59.service.d/override.conf
sudo apt-get update && sudo apt-get install -y docker.io docker-compose
sudo usermod -aG docker $USER
sudo touch ${TTY_CONF}
sudo echo "" >${TTY_CONF}
sudo echo "[Service]" >>${TTY_CONF}
sudo echo "ExecStart=" >>${TTY_CONF}
sudo echo "ExecStart=-/sbin/agetty -a ${USER} --noclear %I $TERM" >>${TTY_CONF}

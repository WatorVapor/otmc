#!/bin/bash
sudo apt-get update && sudo apt-get install -y docker.io docker-compose
sudo usermod -aG docker $USER

TTY_TMP_CONF=./tmp.override.conf
touch ${TTY_TMP_CONF}
echo "" > ${TTY_TMP_CONF}
echo "[Service]" >> ${TTY_TMP_CONF}
echo "ExecStart=" >> ${TTY_TMP_CONF}
echo "ExecStart=-/sbin/agetty -a ${USER} --noclear %I $TERM" \
 >> ${TTY_TMP_CONF}

TTY_CONF=/etc/systemd/system/getty@tty59.service.d/
sudo mkdir -p ${TTY_CONF}
sudo cp -f ${TTY_TMP_CONF} ${TTY_CONF}/override.conf
sudo systemctl daemon-reload
sudo systemctl enable getty@tty59

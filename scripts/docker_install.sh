#/bin/bash

# Run from ../Dockerfile to reduce file layers and overall image size
# Cleans up after itself for a lightweight image

REQ_PKGS="libexpat1-dev libssl-dev daemontools daemontools-run"
TMP_PKGS="carton build-essential"

# system update
apt-get update

# security updates
apt-get upgrade -y -o Dpkg::Options::="--force-confold"
apt-get install --yes $REQ_PKGS $TMP_PKGS

# VHS API
adduser --quiet --no-create-home --disabled-password api
mkdir /etc/service/vhsapi
cp -R /opt/api/etc/service/vhsapi /etc/service/vhsapi

chown api /opt/api

cd /opt/api
carton install

# Uninstall TMP_PKGS
apt-get remove --yes $TMP_PKGS

# Clean up package manager cruft
apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
#/bin/bash

# Run from ../Dockerfile to reduce file layers and overall image size
# Cleans up after itself for a lightweight image
REQ_PKGS="libexpat1-dev libssl-dev build-essential"
PERL_PKGS="carton"
REDIS_PKGS="redis-server"

# system update
apt-get update

# security updates
DEBIAN_FRONTEND=noninteractive apt-get install --yes $REQ_PKGS

DEBIAN_FRONTEND=noninteractive apt-get install --yes $PERL_PKGS

DEBIAN_FRONTEND=noninteractive apt-get install --yes $REDIS_PKGS

# VHS API
adduser --quiet --no-create-home --disabled-password api
mkdir /etc/service/vhsapi
cp -R /opt/api/etc/service/vhsapi /etc/service

chown api /opt/api

cd /opt/api
carton install

# Configure and Run Redis
cp -R /opt/api/etc/redis/redis.conf /etc/redis/redis.conf
cp -R /opt/api/etc/service/redis /etc/service

# Uninstall TMP_PKGS
# apt-get remove --yes $TMP_PKGS

# Clean up package manager cruft
# apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Purpose

Time series data something something.

# Docker

Build with a standard `docker build .`

To run successfully in Docker you need to provide the REDIS_HOST env

`docker run -d -e REDIS_PORT_6379_TCP_ADDR=<hostip> <image-id>`

# Config options

All configs can be ENV or arg
- port/PORT: default 8080
- redis-host/REDIS_PORT_6379_TCP_ADDR: default 127.0.0.1
- redis-port/REDIS_PORT_6379_TCP_PORT: default 6379

# Dev Setup

Standard Node.JS project:
1. npm install
2. node ./index.js


# Docker

Can be run with `--link <redis-servce>:redis`


# Purpose

Time series data something something.

# Docker

Build with a standard `docker build .`

To run successfully in Docker you need to provide the INFLUX_* env

`docker run -d -e INFLUX_HOST=<hostip> <image-id>`

# Config options

All configs can be ENV or arg

- influx-host/INFLUX_HOST: default localhost
- influx-port/INFLUX_PORT: default 8086
- influx-user/INFLUX_USER
- influx-pw/INFLUX_PASSWORD
- influx-db/INFLUX_DB: default api

# Dev Setup

Standard Node.JS project:
1. npm install
2. node ./index.js

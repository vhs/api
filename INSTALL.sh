#!/bin/bash

sudo cp etc/service/vhsapi/run /etc/service/vhsapi/run
sudo cp etc/nginx/vhs-api /etc/nginx/sites-enabled/vhs-api

sudo /etc/init.d/nginx reload
sudo svc -h /etc/service/vhsapi



FROM phusion/baseimage:0.9.17

# Best practics ubuntu base image: https://github.com/phusion/baseimage-docker

CMD ["/sbin/my_init"]

ADD . /opt/vhsapi

RUN /opt/api/scripts/docker_install.sh

EXPOSE 3000



FROM phusion/baseimage

# Best practics ubuntu base image: https://github.com/phusion/baseimage-docker

CMD ["/sbin/my_init"]

ADD . /opt/api

RUN /opt/api/scripts/docker_install.sh

EXPOSE 3000 80



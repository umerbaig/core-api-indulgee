FROM centos:latest
MAINTAINER Hamza Baig <hamzabaig18@gmail.com>

EXPOSE 8000 

# RUN rpm -Uvh http://mirror.pnl.gov/epel/7/x86_64/e/epel-release-7-5.noarch.rpm
RUN curl -sL https://rpm.nodesource.com/setup_6.x | bash -
RUN yum install nodejs -y
RUN yum install -y epel-release nodejs make gcc-c++
ADD package.json /tmp/package.json
RUN cd /tmp/ && npm install

# moving app and modules into app folder
WORKDIR /app
ADD . /app
RUN mv /tmp/node_modules/ /app/

CMD ["npm", "start"]


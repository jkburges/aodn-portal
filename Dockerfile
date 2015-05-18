FROM java:openjdk-7-jdk
MAINTAINER jkburges@gmail.com

EXPOSE 8080

ADD . /app
WORKDIR /app

# Any way to inherit this from parent Dockerfile?
ENV JAVA_HOME /usr/lib/jvm/java-7-openjdk-amd64

RUN bash ./grailsw refresh-dependencies
CMD bash ./grailsw run-app


FROM elasticsearch:5.5

MAINTAINER Terascope, LLC

COPY es-start.sh /usr/local/bin/es-start
COPY elasticsearch.yml /usr/share/elasticsearch/config/

RUN chmod +x /usr/local/bin/es-start \
    && chown elasticsearch:elasticsearch /usr/local/bin/es-start

USER elasticsearch

CMD [ "es-start" ]

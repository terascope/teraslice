FROM elasticsearch:5.5-alpine

RUN apk add --no-cache curl

COPY es-start.sh /usr/local/bin/es-start
COPY es-cleanup.sh /usr/local/bin/es-cleanup
COPY elasticsearch.yml /usr/share/elasticsearch/config/

RUN chmod +x /usr/local/bin/es-start \
    && chmod +x /usr/local/bin/es-cleanup \
    && chown elasticsearch:elasticsearch /usr/local/bin/es-start \
    && chown elasticsearch:elasticsearch /usr/local/bin/es-cleanup

ENV INDEX_SETTINGS "{\"index.max_result_window\": \"20000\"}"

USER elasticsearch

CMD [ "es-start" ]

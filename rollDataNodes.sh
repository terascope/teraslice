#!/bin/bash

docker-compose stop  elasticsearch-data1-3
docker-compose up  elasticsearch-data1-3 -d

sleep 30
while test green != "$(http localhost:9200/_cat/health h==status)"; do     sleep 2;     echo -n .; done


docker-compose stop  elasticsearch-data1-2
docker-compose up  elasticsearch-data1-2 -d

sleep 30
while test green != "$(http localhost:9200/_cat/health h==status)"; do     sleep 2;     echo -n .; done

docker-compose stop  elasticsearch-data1-1
docker-compose up  elasticsearch-data1-1 -d



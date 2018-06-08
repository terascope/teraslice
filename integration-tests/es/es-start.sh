#!/bin/bash

if [ -d "/usr/share/elasticsearch/data/" ]; then
    echo "* removing old data"
    rm -rf /usr/share/elasticsearch/data/*
fi

if [ -d "/usr/share/elasticsearch/logs/" ]; then
    echo "* removing old logs"
    rm -rf /usr/share/elasticsearch/logs/*
fi

elasticsearch

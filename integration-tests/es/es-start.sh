#!/bin/bash

trap "exit" INT TERM ERR
trap "kill 0" EXIT

es-cleanup &
echo "starting elasticsearch"
elasticsearch &
wait

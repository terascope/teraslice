#!/usr/bin/env bash

node ../../packages/teraslice/service.js -c ./teraslice-master-local.yaml > ./master.log 2>&1  &
pid=$!
echo ${pid} > master.pid
echo "Server PID: ${pid}"
echo "Follow logs with:"
echo "  tail -f master.log | bunyan"
echo "Kill server with:"
echo '  kill $(cat master.pid)'

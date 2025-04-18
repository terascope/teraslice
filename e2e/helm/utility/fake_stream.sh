#!/usr/bin/env bash

# This script is intended to emulate a bursty stream writing
# to kafka using kafkacat.  It should be called like:
#     fake_stream.sh temp/noaa-2016-sorted.json [testTopic]

LINES=500
INFILE=$1
TOPIC=${2:-testTopic}
CMD="kcat" # kafkacat has recently changed its name to kcat, not in this case thouhg
BROKER="localhost"

if [ -z "$1" ]
  then
    echo "No INFILE argument supplied"
    echo
    echo "Usage: fake_stream.sh temp/noaa-2016-sorted.json [testTopic]"
    exit 1
fi

case "$(uname -s)" in
    Linux*)
        splitCmd="split"
        ;;
    Darwin*)
        splitCmd="gsplit"
        ;;
    *)
        exit 2
        ;;
esac

echo "Writing to ${BROKER} on topic ${TOPIC}"

${splitCmd} -l ${LINES} --filter "${CMD} -P -b ${BROKER} -t ${TOPIC}; sleep 1; echo -n ." ${INFILE}

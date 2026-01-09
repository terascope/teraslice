#!/bin/bash

# Check if file argument is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <logfile>"
    exit 1
fi

LOGFILE="$1"

# Check if file exists
if [ ! -f "$LOGFILE" ]; then
    echo "Error: File '$LOGFILE' not found"
    exit 1
fi

# Filter logs with level 50
grep '"level":50' "$LOGFILE"
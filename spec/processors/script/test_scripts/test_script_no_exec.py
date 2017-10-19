#!/usr/bin/env python
import sys
import json

json_string = sys.stdin.readline()
json_data = json.loads(json_string)
sys.stdout.write(json.dumps(json_data))

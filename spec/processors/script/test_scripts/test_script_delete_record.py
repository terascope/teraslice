#!/usr/bin/env python
import sys
import json

number_of_items_to_delete = 1

if len(sys.argv) == 2:
    if sys.argv[1].isdigit():
        number_of_items_to_delete = int(sys.argv[1])

json_string = sys.stdin.readline()
json_data = json.loads(json_string)

for _ in xrange(0, number_of_items_to_delete):
    json_data.pop()

sys.stdout.write(json.dumps(json_data))

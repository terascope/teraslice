#!/usr/bin/env python
import sys
import json
import getopt

number_of_items_to_delete = 0
opts, args = getopt.getopt(sys.argv[1:],"d:",["delete="])

for opt, arg in opts:
  if opt in ("-d", "--delete"):
      if arg.isdigit():
          number_of_items_to_delete = int(arg)

json_string = sys.stdin.readline()
json_data = json.loads(json_string)

for _ in xrange(0, number_of_items_to_delete):
    json_data.pop()

sys.stdout.write(json.dumps(json_data))

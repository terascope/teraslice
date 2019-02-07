---
title: Teraslice Client JS
sidebar_label: teraslice-client-js
---

> Javascript client for Teraslice

## Installation

```bash
# Using yarn
yarn add teraslice-client-js
# Using npm
npm install --save teraslice-client-js
```

## Job submission example

```js
var teraslice = require('teraslice-client-js')({
    host: 'http://localhost:5678'
});

var job = {
  "name": "Data Generator",
  "lifecycle": "once",
  "workers": 1,
  "operations": [
    {
      "_op": "elasticsearch_data_generator",
      "size": 1
    },
    {
      "_op": "elasticsearch_index_selector",
      "index": "client-test-logs",
      "type": "events"
    },
    {
      "_op": "elasticsearch_bulk",
      "size": 50
    }
  ]
};

teraslice.jobs.submit(job)
    .then(function(job) {
        console.log(job.id());
        job.status().then(console.log)
    })

```

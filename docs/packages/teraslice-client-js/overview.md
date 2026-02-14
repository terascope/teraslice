---
title: Teraslice Client JS
sidebar_label: Overview
---

> A Node.js client for teraslice jobs, assets, and cluster references.

## Installation

```bash
# Using pnpm
pnpm add teraslice-client-js
# Using npm
npm install --save teraslice-client-js
```

## Job submission example

```js
const { TerasliceClient } = require('teraslice-client-js');

const teraslice = new TerasliceClient({
    host: 'http://localhost:5678'
})

var job = {
  "name": "Data Generator",
  "lifecycle": "once",
  "workers": 1,
  "assets": ["standard", "elasticsearch"],
  "operations": [
    {
      "_op": "data_generator",
      "size": 1
    },
    {
      "_op": "elasticsearch_bulk",
      "index": "client-test-logs",
      "type": "events",
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

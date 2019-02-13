# teraslice-client-js

<!-- THIS FILE IS AUTO-GENERATED, EDIT docs/packages/teraslice-client-js/overview.md INSTEAD -->

**NOTE:** This a package within the [Teraslice](https://github.com/terascope/teraslice) monorepo, more documentation can be found [here](https://terascope.github.io/teraslice/docs/).

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

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](./LICENSE) licensed.

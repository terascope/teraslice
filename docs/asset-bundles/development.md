---
title: Asset Bundle Development
sidebar_label: Development
---

It is possible to implement custom operations (slicers, readers, and processors)
and utilize them in your Teraslice jobs.

The first step to utilizing custom operations is to configure your Teraslice
nodes to point to the directory containing your custom code, this is done by
setting the `assets_directory` setting in the `teraslice` section of your
configuration file as shown below.

```yaml
# ...
teraslice:
    assets_directory: '/app/source/assets/'
# ...
```

This directory must contain a `package.json`, a `assets` directory with your
custom operations, and the `node_modules` required by your custom code. It
will look something like this:

```sh
.
├── node_modules
│   └── lodash
├── package.json
└── assets
    ├── asset.json
    └── count
        ├── index.js
        ├── processor.js
        └── schema.js
```

In order to decrease the size of your asset bundle keepy the `devDependencies` and any test files at the top-level of the asset bundle
and not within the `assets` directory.

An `asset.json` is used to define a bundle of operations, it contains a name and version.

```json
{
    "name": "example",
    "version": "1.0.0"
}
```

A job configuration that makes use of a custom operator would simply call the
operator just like any other operator, as shown below:

```json
{
    "name": "Update Rate Test",
    "lifecycle": "once",
    "workers": 1,
    "assets": ["elasticsearch"],
    "operations": [
        {
            "_op": "elasticsearch_data_generator",
            "size": 5000
        },
        {
            "_op": "count"
        },
        {
            "_op": "elasticsearch_index_selector",
            "index": "update-test-1",
            "type": "events"
        },
        {
            "_op": "elasticsearch_bulk",
            "size": 5000
        }
    ]
}
```

See the [teraslice-cli](../packages/teraslice-cli#assets) documentation for assets.

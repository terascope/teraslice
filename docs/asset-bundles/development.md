---
title: Asset Development
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
        ├── processor.js
        └── schema.js
```

In order to decrease the size of your asset bundle keep the `devDependencies` and any test files at the top-level of the asset bundle
and not within the `assets` directory.

An `asset.json` is used to define a bundle of operations, it contains a name and version.

```json
{
    "name": "example",
    "version": "1.0.0"
}
```

An `asset.json` can also contain `node_version`, `platform` and `arch` which will be used to restrict the asset for a given environment, which will allowing upgrades to the `node` without breaking jobs. If the value for those restrictions are not specified or are *falsy*, teraslice will not consider it restricted. This is useful for making an asset bundle that isn't locked down by node version or os.

Setting `minimum_teraslice_version` will restrict the version of teraslice that can run an asset (teraslice v2.8.0+).
A `description` field is often included as well.

A job configuration that makes use of a custom operator would simply call the
operator just like any other operator, as shown below:

```json
{
    "name": "Update Rate Test",
    "lifecycle": "once",
    "workers": 1,
    "assets": ["elasticsearch", "standard", "example"],
    "operations": [
        {
            "_op": "data_generator",
            "size": 5000
        },
        {
            "_op": "count",
            "log_level": "debug"
        },
        {
            "_op": "elasticsearch_bulk",
            "index": "update-test-1",
            "type": "events",
            "size": 5000
        }
    ]
}
```

The `count` operator used above simply logs the execution of the operator and
counts the number of records passed in with the data object, it could be
implemented as shown below:

**Processor:**

<!--DOCUSAURUS_CODE_TABS-->
<!--JavaScript-->
```js
'use strict';

const { BatchProcessor } = require('@terascope/job-components');

class CountProcessor extends BatchProcessor {
    async onBatch(data) {
        const level = this.opConfig.log_level;
        this.logger[level]('Inside custom processor \'count\'');
        this.logger[level]('Number of items in data: ' + Object.keys(data).length);
        return data;
    }
}

module.exports = CountProcessor;
```
<!--TypeScript-->
```ts
import { BatchProcessor } from '@terascope/job-components';

export default class CountProcessor extends BatchProcessor {
    async onBatch(data) {
        const level = this.opConfig.log_level;
        this.logger[level]('Inside custom processor \'count\'');
        this.logger[level]('Number of items in data: ' + Object.keys(data).length);
        return data;
    }
}
```
<!--END_DOCUSAURUS_CODE_TABS-->

**Schema:**

<!--DOCUSAURUS_CODE_TABS-->
<!--JavaScript-->
```js
'use strict';

const { ConvictSchema } = require('@terascope/job-components');

class Schema extends ConvictSchema {
    build() {
        return {
            log_level: {
                default: 'info',
                doc: 'The log level to use',
                format: ['trace', 'debug', 'info'],
            }
        };
    }
}

module.exports = Schema;
```
<!--TypeScript-->
```ts
import { ConvictSchema } from '@terascope/job-components';

export default class Schema extends ConvictSchema {
    build() {
        return {
            log_level: {
                default: 'info',
                doc: 'The log level to use',
                format: ['trace', 'debug', 'info'],
            }
        };
    }
}
```
<!--END_DOCUSAURUS_CODE_TABS-->

See the [teraslice-cli](../packages/teraslice-cli/overview#assets) documentation for assets.

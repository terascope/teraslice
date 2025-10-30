---
title: Development
---

When developing on an operation you'll need to be aware of three packages.

- [@teracope/job-components](../packages/job-components/overview.md) - contains the abstract classes and components for building and interacting with Teraslice operations.
- [@teracope/core-utils](../packages/core-utils/overview.md) - contains many useful utility functions
- [teraslice-test-harness](../packages/teraslice-test-harness/overview.md) - a testing framework for teraslice.

## Reader

A reader is expected to have the following folder structure:

```sh
<example-reader>
├── fetcher.js
├── schema.js
└── slicer.js
```

### Fetcher

<!--DOCUSAURUS_CODE_TABS-->
<!--JavaScript-->
```js
'use strict';

const { Fetcher } = require('@terascope/job-components');

class ExampleFetcher extends Fetcher {
    constructor(...args) {
        super(...args);
        this._initialized = false;
        this._shutdown = false;
    }

    async initialize() {
        this._initialized = true;
        return super.initialize();
    }

    async shutdown() {
        this._shutdown = true;
        return super.shutdown();
    }

    async fetch() {
        const result = [];
        for (let i = 0; i < 10; i++) {
            result.push({
                id: i,
                data: [Math.random(), Math.random(), Math.random()],
            });
        }
        return result;
    }
}

module.exports = ExampleFetcher;
```
<!--TypeScript-->
```ts
import { Fetcher } from '@terascope/job-components';

export default class ExampleFetcher extends Fetcher {
    _initialized = false;
    _shutdown = false;

    async initialize() {
        this._initialized = true;
        return super.initialize();
    }

    async shutdown() {
        this._shutdown = true;
        return super.shutdown();
    }

    async fetch() {
        const result = [];
        for (let i = 0; i < 10; i++) {
            result.push({
                id: i,
                data: [Math.random(), Math.random(), Math.random()],
            });
        }
        return result;
    }
}
```
<!--END_DOCUSAURUS_CODE_TABS-->

### Schema

<!--DOCUSAURUS_CODE_TABS-->
<!--JavaScript-->
```js
'use strict';

const { Fetcher } = require('@terascope/job-components');

class ExampleFetcher extends Fetcher {
    constructor(...args) {
        super(...args);
        this._initialized = false;
        this._shutdown = false;
    }

    async initialize() {
        this._initialized = true;
        return super.initialize();
    }

    async shutdown() {
        this._shutdown = true;
        return super.shutdown();
    }

    async fetch() {
        const result = [];
        for (let i = 0; i < 10; i++) {
            result.push({
                id: i,
                data: [Math.random(), Math.random(), Math.random()],
            });
        }
        return result;
    }
}

module.exports = ExampleFetcher;
```
<!--TypeScript-->
```ts
import { Fetcher } from '@terascope/job-components';

export default class ExampleFetcher extends Fetcher {
    _initialized = false;
    _shutdown = false;

    async initialize() {
        this._initialized = true;
        return super.initialize();
    }

    async shutdown() {
        this._shutdown = true;
        return super.shutdown();
    }

    async fetch() {
        const result = [];
        for (let i = 0; i < 10; i++) {
            result.push({
                id: i,
                data: [Math.random(), Math.random(), Math.random()],
            });
        }
        return result;
    }
}
```
<!--END_DOCUSAURUS_CODE_TABS-->

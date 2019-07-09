---
title: Data Entities
---

A DataEntity is wrapper for data that can hold additional metadata properties without mutating the original data.

Check out the [API docs](../packages/utils/api/classes/dataentity.md) for more details.

## Usage

### new DataEntity

This is more straightforward way of creating data entities but since it shallow clones the input, it is slower than `DataEntity.make`.

```js
'use strict';

const { DataEnity } = require('@terascope/utils');
// it is also available on job-components
// const { DataEnity } = require('@terascope/job-components');

const input = {
    foo: 1,
    bar: 'hello',
    baz: {
        hi: true
    }
};

const metadata = {
    from: 'test'
}

const dataEntity = new DataEntity(input, metadata);

// the input should have been shallow cloned
expect(dataEntity).not.toBe(input);
expect(dataEntity).toEqual(input);
expect(DataEntity.isDataEntity(input)).toBeFalse();
expect(DataEntity.isDataEntity(dataEntity)).toBeTrue();

// use the method getMetadata to contain the metadata passed in
expect(dataEntity.getMetadata()).toMatchObject(metadata);
// it should set the _createTime timestamp
expect(dataEntity.getMetadata('_createTime')).toBeNumber();
// get a specific key
expect(dataEntity.getMetadata('from')).toEqual('test');
// should be able to set a specific key
dataEntity.setMetadata('touchedAt', Date.now());
expect(dataEntity.getMetadata('touchedAt')).toBeNumber();

// should be able to convert it to a buffer
expect(dataEntity.toBuffer()).toEqual(Buffer.from(JSON.stringify(dataEntity)));
```

### DataEntity.make

A utility for safely converting an object a `DataEntity`. If the input is a DataEntity it will return it and have no side-effect. If you want a create new DataEntity from an existing DataEntity either use `new DataEntity` or shallow clone the input before
passing it to `DataEntity.make`.

**NOTE:** `DataEntity.make` is different from using `new DataEntity`
because it attaching it doesn't shallow cloning the object
onto the `DataEntity` instance, this is significatly faster and so it
is recommended to use this in production.

```js
'use strict';

const { DataEnity } = require('@terascope/utils');

const input = {
    foo: 1,
    bar: 'hello',
    baz: {
        hi: true
    }
};

const metadata = {
    from: 'test'
}

const dataEntity = DataEntity.make(input, metadata);

// the input should NOT have been shallow cloned
expect(dataEntity).toBe(input);
expect(dataEntity).toEqual(input);
expect(DataEntity.isDataEntity(input)).toBeTrue();
expect(DataEntity.isDataEntity(dataEntity)).toBeTrue();

// otherwise the behavoir should be the same as new DataEntity.
```

### DataEntity.makeArray

A utility for safely converting an input of an object, or an array of objects, to an array of DataEntities. This will detect if passed an already converted input and return it. Since this uses `DataEntity.make` under the hood it won't shallow clone the input.

```js
'use strict';

const { DataEnity } = require('@terascope/utils');

const input = [
    {
        foo: 1,
    },
    {
        bar: 1,
    }
];

const dataEntities = DataEntity.makeArray(input);
expect(dataEntites).toBeArrayOfSize(2);
expect(DataEntity.isDataEntityArray(dataEntities)).toBeTrue();
```

## Conventional Metadata

As a convention we use the following metadata keys in many of our asset bundles

| Key            | Description                                                                                          | Type             | Notes                           |
| -------------- | ---------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------- |
| `_createTime`  | The time at which this entity was created.                                                           | `Unix Timestamp` | readonly and automatically set. |
| `_ingestTime`  | The time at which the data was ingested into the source data                                         | `Unix Timestamp` | optional                        |
| `_processTime` | The time at which the data was consumed by the reader                                                | `Unix Timestamp` | optional                        |
| `_eventTime`   | The time associated with this data entity, usually off of a specific field on source data or message | `Unix Timestamp` | optional                        |
| `_key`         | A unique key for the data which will be can be used to key the data                                  | `String`         | optional                        |

Checkout [this Github issue](https://github.com/terascope/teraslice/issues/950) for more details.

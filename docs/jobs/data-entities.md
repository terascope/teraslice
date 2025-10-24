---
title: Data Entities
---

A DataEntity is wrapper for data that can hold additional metadata properties without mutating the original data.

Check out the [API docs](../packages/utils/api/entities/data-entity/classes/DataEntity.md) for more details.

## Usage

### new DataEntity

This is more straightforward way of creating data entities but since `DataEntity.make` safely handles a `DataEntity` input and has potential performance improvements it is recommended to use that in production.

```js
'use strict';

const { DataEntity } = require('@terascope/core-utils');
// it is also available on job-components
// const { DataEntity } = require('@terascope/job-components');

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

// should be able to set a time key key
dataEntity.setTime('_eventTime', new Date());
// it will set the getTime field
expect(dataEntity.getTime('_eventTime')).toBeNumber();

// should be able to convert it to a buffer
expect(dataEntity.toBuffer()).toEqual(Buffer.from(JSON.stringify(dataEntity)));
```

### DataEntity.make

A utility for safely converting an object a `DataEntity`. If the input is a DataEntity it will return it and have no side-effect. If you want a create new DataEntity from an existing DataEntity either use `new DataEntity` or shallow clone the input before passing it to `DataEntity.make`.

```js
'use strict';

const { DataEntity } = require('@terascope/core-utils');

const input = {
    foo: 1,
    bar: 'hello',
    baz: {
        hi: true
    }
};

const dataEntity = DataEntity.make(input);
const result = DataEntity.make(dataEntity);
expect(result).toBe(dataEntity);

// the behavoir should be the same as new DataEntity.
```

### DataEntity.makeArray

A utility for safely converting an input of an object, or an array of objects, to an array of DataEntities. This will detect if passed an already converted input and return it.

```js
'use strict';

const { DataEntity } = require('@terascope/core-utils');

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

### DataEntity.fork

Create a new instance of a DataEntity. If the second param `withData` is set to `true` both the data and metadata will be forked, if set to `false` only the metadata will be copied. Defaults to `true`.

```js
const { DataEntity } = require('@terascope/core-utils');

const input = {
    foo: 'bar',
};

const metadata = {
    _key: 'hello'
};

const dataEntity = DataEntity.make(input, metadata);

// this is the default behavior
const forkedWithData = DataEntity.fork(dataEntity, true);
expect(forkedWithData).not.toBe(dataEntity);
expect(forkedWithData).toHaveProperty('foo', 'bar');
expect(forkedWithData.getKey()).toBe('hello');

// useful for create barebones instance with the same metadata
const forkedWithoutData = DataEntity.fork(dataEntity, false);
expect(forkedWithoutData).not.toBe(dataEntity);
expect(forkedWithoutData).not.toHaveProperty('foo', 'bar');
expect(forkedWithData.getKey()).toBe('hello');
```

### DataEntity.fromBuffer

A utility for converting a `Buffer` to a `DataEntity`, using the DataEntity encoding.

```js
const { DataEntity } = require('@terascope/core-utils');

const jsonBuffer = Buffer.from(JSON.stringify({ foo: 'bar' }));
const dataEntity = DataEntity.fromBuffer(jsonBuffer, {
    // defaults to json
    _encoding: 'json'
});
expect(dataEntity).toHaveProperty('foo', 'bar');

const rawDataEntity = DataEntity.fromBuffer(jsonBuffer, {
    // defaults to json
    _encoding: 'raw'
});

expect(rawDataEntity).not.toHaveProperty('foo', 'bar');
expect(rawDataEntity.getRawData().toString('utf8')).toEqual(jsonBuffer.toString('utf8'))
```

### DataEntity->getMetadata

Get the metadata for the DataEntity. If a field is specified, it will get that property of the metadata.

```js
'use strict';

const { DataEntity } = require('@terascope/core-utils');

const metadata = {
    from: 'test'
}
const dataEntity = new DataEntity({}, metadata);

expect(dataEntity.getMetadata()).toMatchObject(metadata);
expect(dataEntity.getMetadata('_createTime')).toBeNumber();
expect(dataEntity.getMetadata('from')).toEqual('test');

dataEntity.setMetadata('touched', 1);
expect(dataEntity.getMetadata('touched')).toBeNumber();
```

### DataEntity->setMetadata

Given a field and value set the metadata on the record. The field cannot be empty or `_createTime`.

```js
'use strict';

const { DataEntity } = require('@terascope/core-utils');

const dataEntity = new DataEntity();

expect(() => {
    dataEntity.setMetadata('_createTime');
}).toThrow();

expect(() => {
    dataEntity.setMetadata('');
}).toThrow();

dataEntity.setMetadata('touched', 1);
expect(dataEntity.getMetadata('touched')).toBeNumber();
```

### DataEntity->getKey

Get the unique document `_key` from the metadata. If no `_key` is found, an error will be thrown. The key can be a `number` of `string`.

```js
'use strict';

const { DataEntity } = require('@terascope/core-utils');

expect(() => {
    new DataEntity().getKey();
}).toThrow();

const dataEntity = new DataEntity({}, {
    _key: 'foo'
});
expect(dataEntity.getKey()).toEqual('foo');
```

### DataEntity->setKey

Set the unique document `_key` from the metadata. If no `_key` is found, an error will be thrown

```js
'use strict';

const { DataEntity } = require('@terascope/core-utils');

expect(() => {
    new DataEntity().setKey({ invalid: 'key' });
}).toThrow();

expect(() => {
    new DataEntity().setKey(null);
}).toThrow();

const dataEntity = new DataEntity({}, {
    _key: 'foo'
});

dataEntity.setKey('bar');
expect(dataEntity.getKey()).toEqual('bar');
```

### DataEntity->getCreateTime

Get the time at which this entity was created.

```js
'use strict';

const { DataEntity } = require('@terascope/core-utils');

const dataEntity = new DataEntity();

expect(dataEntity.getCreateTime()).toBeDate();
```

### DataEntity->getIngestTime / DataEntity->setIngestTime

The time at which the data was ingested into the source data.

`->getIngestTime`:

- If none is found, `undefined` will be returned.
- If an invalid date is found, `false` will be returned.

`->setIngestTime`:

- If the value is empty it will set the time to now.
- If an invalid date is given, an error will be thrown.

Any date formated accepted by [JavaScript Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#Parameters) can be used.

```js
'use strict';

const { DataEntity } = require('@terascope/core-utils');

const dataEntity = new DataEntity({}, {
    _key: 'foo'
});

expect(dataEntity.getIngestTime()).toBe(undefined);

// if nothing is passed in it is set Date.now()
dataEntity.setIngestTime();
// use a date
dataEntity.setIngestTime(new Date());
// use a ISO or JavaScript Date string
dataEntity.setIngestTime('2019-09-06T16:13:24.439Z');
// use a UNIX epoch time
dataEntity.setIngestTime(Date.now() - 1000);

expect(dataEntity.getIngestTime()).toBeDate();
```

### DataEntity->getProcessTime / DataEntity->setProcessTime

The time at which the data was consumed by the reader.

`->getProcessTime`:

- If none is found, `undefined` will be returned.
- If an invalid date is found, `false` will be returned.

`->setProcessTime`:

- If the value is empty it will set the time to now.
- If an invalid date is given, an error will be thrown.

Any date formated accepted by [JavaScript Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#Parameters) can be used.

```js
'use strict';

const { DataEntity } = require('@terascope/core-utils');

const dataEntity = new DataEntity({}, {
    _key: 'foo'
});

expect(dataEntity.getProcessTime()).toBe(undefined);

// if nothing is passed in it is set Date.now()
dataEntity.setProcessTime();
// use a date
dataEntity.setProcessTime(new Date());
// use a ISO or JavaScript Date string
dataEntity.setProcessTime('2019-09-06T16:13:24.439Z');
// use a UNIX epoch time
dataEntity.setProcessTime(Date.now() - 1000);

expect(dataEntity.getProcessTime()).toBeDate();
```

### DataEntity->getEventTime / DataEntity->setEventTime

The time associated from a specific field on source data or message.

`->getEventTime`:

- If none is found, `undefined` will be returned.
- If an invalid date is found, `false` will be returned.

`->setEventTime`:

- If the value is empty it will set the time to now.
- If an invalid date is given, an error will be thrown.

Any date formated accepted by [JavaScript Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#Parameters) can be used.

```js
'use strict';

const { DataEntity } = require('@terascope/core-utils');

const dataEntity = new DataEntity({}, {
    _key: 'foo'
});

expect(dataEntity.getEventTime()).toBe(undefined);

// if nothing is passed in it is set Date.now()
dataEntity.setEventTime();
// use a date
dataEntity.setEventTime(new Date());
// use a ISO or JavaScript Date string
dataEntity.setEventTime('2019-09-06T16:13:24.439Z');
// use a UNIX epoch time
dataEntity.setEventTime(Date.now() - 1000);

expect(dataEntity.getEventTime()).toBeDate();
```

### DataEntity->getRawData

Get the raw data, usually used for encoding type `raw`. If there is no data, an error will be thrown.

```js
'use strict';

const { DataEntity } = require('@terascope/core-utils');

expect(() => {
    new DataEntity().getRawData();
}).toThrow();

const buf = Buffer.from('foo:bar');
const dataEntity = DataEntity.fromBuffer(buf, {
    _encoding: 'raw'
});

expect(dataEntity.getRawData()).toBe(buf);
```

### DataEntity->setRawData

Set the raw data, usually used for encoding type `raw`. If given `null`, it will unset the data.

```js
'use strict';

const { DataEntity } = require('@terascope/core-utils');

const dataEntity = new DataEntity();

expect(() => {
    dataEntity.setRawData();
}).toThrow();

expect(() => {
    dataEntity.setRawData({ invalid: 'buffer' });
}).toThrow();

dataEntity.setRawData(Buffer.from('test'));
// when given string it will convert it to a buffer
dataEntity.setRawData('test');

// when given null it will unset the data
dataEntity.setRawData(null);
```

### DataEntity->toBuffer

Convert the DataEntity to an encoded buffer.

```js
'use strict';

const { DataEntity } = require('@terascope/core-utils');

const dataEntity = new DataEntity({
    foo: 'bar'
});

dataEntity.toBuffer({
    // this is the default
    _encoding: 'json'
}); // this should out put a buffer with {"foo":"bar"}

dataEntity.setRawData(Buffer.from('foo:bar'))
dataEntity.toBuffer({
    _encoding: 'raw'
}); // this should out put a buffer with 'foo:bar'
```

## Conventional Metadata

As a convention we use the following metadata keys in many of our asset bundles

| Key            | Description                                                                                          | Type             | Notes                           |
| -------------- | ---------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------- |
| `_createTime`  | The time at which this entity was created.                                                           | `Unix Timestamp` | readonly and automatically set. |
| `_ingestTime`  | The time at which the data was ingested into the source data                                         | `Unix Timestamp` | optional                        |
| `_processTime` | The time at which the data was consumed by the reader                                                | `Unix Timestamp` | optional                        |
| `_eventTime`   | The time associated with this data entity, usually off of a specific field on source data or message | `Unix Timestamp` | optional                        |
| `_key`         | A unique key for the data which will be can be used to key the data                                  | `String          | Number`                         | optional |

Checkout [this Github issue](https://github.com/terascope/teraslice/issues/950) for more details.

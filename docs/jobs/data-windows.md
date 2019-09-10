---
title: Data Windows
---

Acts as an collection of DataEntities associated to a particular key or time frame.
A `DataWindow` should be able to be used in-place of an `Array` in most cases.

Check out the [API docs](../packages/utils/api/classes/datawindow.md) for more details.

## Usage

### new DataWindow

A straightforward way of creating a window

```js
'use strict';

const { DataWindow, DataEntity } = require('@terascope/utils');
// it is also available on job-components
// const { DataWindow } = require('@terascope/job-components');

const input = [
    new DataEntity({
        foo: 1,
        bar: 'hello',
        baz: {
            hi: true
        }
    })
];

const metadata = {
    _key: 'test'
}

const dataWindow = new DataWindow(input, metadata);

expect(dataWindow).toBeArrayOfSize(1);
expect(DataWindow.isDataWindow(dataWindow)).toBeTrue();
expect(dataWindow.getKey()).toBe('test');
```

### DataWindow.make

A utility for safely creating a `DataWindow`. The main different between `new DataWindow` and `DataWindow.make`, that if given a `DataWindow` it will return it and not create a new one.

```js
'use strict';

const { DataWindow } = require('@terascope/utils');

const input = {
    foo: 1,
    bar: 'hello',
    baz: {
        hi: true
    }
};

const dataWindow = DataWindow.make(input);
const result = DataWindow.make(dataWindow);
expect(result).toBe(dataWindow);

// the behavoir should be the same as new DataWindow.
```

### DataWindow->getMetadata

Get the metadata for the window. If a field is specified, it will get that property of the metadata.

```js
'use strict';

const { DataWindow } = require('@terascope/utils');

const metadata = {
    from: 'test'
}
const dataWindow = new DataWindow([], metadata);

expect(dataWindow.getMetadata()).toMatchObject(metadata);
expect(dataWindow.getMetadata('_createTime')).toBeNumber();
expect(dataWindow.getMetadata('from')).toEqual('test');

dataWindow.setMetadata('touched', 1);
expect(dataWindow.getMetadata('touched')).toBeNumber();
```

### DataWindow->setMetadata

Given a field and value set the metadata on the record. The field cannot be empty or `_createTime`.

```js
'use strict';

const { DataWindow } = require('@terascope/utils');

const dataWindow = new DataWindow();

expect(() => {
    dataWindow.setMetadata('_createTime');
}).toThrow();

expect(() => {
    dataWindow.setMetadata('');
}).toThrow();

dataWindow.setMetadata('touched', 1);
expect(dataWindow.getMetadata('touched')).toBeNumber();
```

### DataWindow->getKey

Get the unique `_key` for the window. If no `_key` is found, an error will be thrown. The key can be a `number` of `string`.

```js
'use strict';

const { DataWindow, DataEntity } = require('@terascope/utils');

expect(() => {
    new DataWindow().getKey();
}).toThrow();

const entity = new DataEntity();
const dataWindow = new DataWindow(entity, {
    _key: 'foo'
});
expect(dataWindow.getKey()).toEqual('foo');
```

### DataWindow->setKey

Set the unique `_key` for the window. If no `_key` is found, an error will be thrown

```js
'use strict';

const { DataWindow } = require('@terascope/utils');

expect(() => {
    new DataWindow().setKey({ invalid: 'key' });
}).toThrow();

expect(() => {
    new DataWindow().setKey(null);
}).toThrow();

const dataWindow = new DataWindow(null, {
    _key: 'foo'
});

dataWindow.setKey('bar');
expect(dataWindow.getKey()).toEqual('bar');
```

### DataWindow->getCreateTime

Get the time at which the window was created.

```js
'use strict';

const { DataWindow } = require('@terascope/utils');

const dataWindow = new DataWindow();

expect(dataWindow.getCreateTime()).toBeDate();
```

### DataWindow->getStartTime / DataWindow->setStartTime

The time at which the window started collecting data entities, this usefuly for dealing with a timed windows.

`->getStartTime`:

- If none is found, `undefined` will be returned.
- If an invalid date is found, `false` will be returned.

`->setStartTime`:

- If the value is empty it will set the time to now.
- If an invalid date is given, an error will be thrown.

Any date formated accepted by [JavaScript Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#Parameters) can be used.

```js
'use strict';

const { DataWindow } = require('@terascope/utils');

const dataWindow = new DataWindow({ example: true }, {
    _key: 'foo'
});

expect(dataWindow.getStartTime()).toBe(undefined);

// if nothing is passed in it is set Date.now()
dataWindow.setStartTime();
// use a date
dataWindow.setStartTime(new Date());
// use a ISO or JavaScript Date string
dataWindow.setStartTime('2019-09-06T16:13:24.439Z');
// use a UNIX epoch time
dataWindow.setStartTime(Date.now() - 1000);

expect(dataWindow.getStartTime()).toBeDate();
```

### DataWindow->getFinishTime / DataWindow->setFinishTime

The time at which the window finished collecting data entities, this usefuly for dealing with a timed windows.

`->getFinishTime`:

- If none is found, `undefined` will be returned.
- If an invalid date is found, `false` will be returned.

`->setFinishTime`:

- If the value is empty it will set the time to now.
- If an invalid date is given, an error will be thrown.

Any date formated accepted by [JavaScript Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#Parameters) can be used.

```js
'use strict';

const { DataWindow } = require('@terascope/utils');

const input = [
    { count: 1 },
    { count: 2 },
    { count: 3 }
];

const dataWindow = new DataWindow(input, {
    _key: 'foo'
});

expect(dataWindow.getFinishTime()).toBe(undefined);

// if nothing is passed in it is set Date.now()
dataWindow.setFinishTime();
// use a date
dataWindow.setFinishTime(new Date());
// use a ISO or JavaScript Date string
dataWindow.setFinishTime('2019-09-06T16:13:24.439Z');
// use a UNIX epoch time
dataWindow.setFinishTime(Date.now() - 1000);

expect(dataWindow.getFinishTime()).toBeDate();
```

## Conventional Metadata

As a convention we use the following metadata keys in many of our asset bundles

| Key           | Description                                                         | Type             | Notes                           |
| ------------- | ------------------------------------------------------------------- | ---------------- | ------------------------------- |
| `_createTime` | The time at which the window was created.                           | `Unix Timestamp` | readonly and automatically set. |
| `_startTime`  | The time at which the window started collecting data                | `Unix Timestamp` | optional                        |
| `_finishTime` | The time at which the window completed collecting data              | `Unix Timestamp` | optional                        |
| `_key`        | A unique key for the data which will be can be used to key the data | `String|Number`  | optional                        |

Checkout [this Github issue](https://github.com/terascope/teraslice/issues/950) for more details.

---
title: Data Frame
---

## Architecture

First lets discuss optimizations in JavaScript vs other languages, since JavaScript is a high level language it does not allow access to the raw bytes of a string, even if it did, the bytes would need to be converted from UTF-16 to UTF-8 to be useful, the language also does not have fine grain numeric types, `int8` or `uint16`. Those limitations make optimizations that other libraries use less relevant, and often times it is slower.

When designing this implementation we wanted to model after the design Apache Arrow DataFrame but to also make the interface more intuitive and store the data in JavaScript objects instead of vectorized buffers. We also knew that while building this, we would use sacrifice memory over speed, since in our environment memory is cheap, this allows to use a more memory intensive data structure that makes application run faster (unless the allocation of the additional memory reduces the performance gains).

Most data structures and objects in our implementation are immutable, whether enforced or not. The only object that is considered mutable is the metadata on the DataFrame. If immutability is maintained there are several performance that are made:

- When a column is transformed, for example changing the case on a string to upper case, that column will be placed in a new data frame with all of the other columns. This new frame takes up minimal memory since most of it pointers to the previous columns and we rely on the garbage collector to clean it up old column and/or frame. Since the old frame was never modified we can still use the original data frame as is and know their weren't any side effects to deal with (this makes building on top of this library easier or caching the data frames more effective)
- When the DataFrame is built certain optimizations and validation can applied once during construction. Like creating a field to column index map to make getting the column faster.
- When objects are used with immutability it is much faster (and easier) for the garbage collector scavenge the unused objects

A lot of the data we deal with has `nil` (`null` or `undefined`) values, so when designing how to store the values for a column, using a [SparseMap](https://yomguithereal.github.io/mnemonist/sparse-map) is more appropriate since it reduces the number of iterations over the values and to check certain aspects of the values (like how any non-`nil` values). And since only nil values are stored in the values on `SparseMap` that the V8 can optimize the type of array, like small integers will be reduced down to a `Int8Array`.

A [`DataFrame`](https://github.com/terascope/teraslice/blob/master/packages/data-mate/src/data-frame/DataFrame.ts) is made up of a few parts, one or more columns. Each [`Column`](https://github.com/terascope/teraslice/blob/master/packages/data-mate/src/column/Column.ts) has a name and exposes higher level APIs but most of the metadata and data lives on the a [`Vector`](https://github.com/terascope/teraslice/blob/master/packages/data-mate/src/vector/Vector.ts). A [`Vector`](https://github.com/terascope/teraslice/blob/master/packages/data-mate/src/vector/Vector.ts) stores the field configuration and has lower level APIs to access data, the data is stored in a data bucket which is actually one or more [`ReadableData`](https://github.com/terascope/teraslice/blob/master/packages/data-mate/src/core/ReadableData.ts) objects. A [`ReadableData`](https://github.com/terascope/teraslice/blob/master/packages/data-mate/src/core/ReadableData.ts) is level lever object that does not care about the data type and is really just a read only abstraction over the [SparseMap](https://yomguithereal.github.io/mnemonist/sparse-map) which will that implement to be replaced or customized in the future.

To build a [`DataFrame`](https://github.com/terascope/teraslice/blob/master/packages/data-mate/src/data-frame/DataFrame.ts), first you need to build one or more [`Column`](https://github.com/terascope/teraslice/blob/master/packages/data-mate/src/column/Column.ts) instances. To build a [`Column`](https://github.com/terascope/teraslice/blob/master/packages/data-mate/src/column/Column.ts) first you need to be a [`Vector`](https://github.com/terascope/teraslice/blob/master/packages/data-mate/src/vector/Vector.ts), which is done by using the [`Builder`](https://github.com/terascope/teraslice/blob/master/packages/data-mate/src/builder/Builder.ts). To use the [`Builder`](https://github.com/terascope/teraslice/blob/master/packages/data-mate/src/builder/Builder.ts) construct it with the data type configuration and write out the values, when done call `Builder->toVector()` which you can then you create a Column.

When doing row level operations, the whole data needs to be regenerated, which makes this a more expensive operation but this is general performance problem in most Columnar storage formats.

## Components

### DataFrame

[View the source](https://github.com/terascope/teraslice/blob/master/packages/data-mate/src/data-frame/DataFrame.ts)
[View the API docs](https://terascope.github.io/teraslice/docs/packages/data-mate/api/classes/data_frame_DataFrame.DataFrame)

#### Examples

```ts
const dataTypeConfig = {
    version: 1,
    fields: {
        name: {
            type: FieldType.Keyword,
        },
        age: {
            type: FieldType.Short,
        },
        gender: {
            type: FieldType.Keyword
        },
        birth_date: {
            type: FieldType.Date
        }
    }
};

let dataFrame = DataFrame.fromJSON(dataTypeConfig, [
    {
        name: 'Jill',
        age: 39,
        gender: 'F',
        birth_date: '1981-08-20T07:00:00.000Z',
    },
    {
        name: 'Billy',
        age: 47,
        gender: 'M',
        birth_date: '1973-06-05T07:00:00.000Z',
    },
    {
        name: 'Frank',
        age: 20,
        gender: 'M',
        birth_date: '2000-03-05T07:00:00.000Z'
    },
]);

// ...
// Get the number of rows
// ...
dataFrame.size;
// => 3

// Columns
// ...
dataFrame.columns;
// => [Column<name>, Column<age>, Column<gender>, Column<birth_date>]

// ...
// Transform a field
// ...
dataFrameAdapter(functionConfigRepository.toDailyDate, {
    field: 'birth_date'
})
    .select('birth_date')
    .toJSON();
// => [{ birth_date: '1981-08-20' }, { birth_date: '1973-06-05' }, { birth_date: '2000-03-05' }]

// ...
// OR
// ...

dataFrameAdapter(functionConfigRepository.lookup, {
    args: {
        in: {
            M: 'Male',
            F: 'Female,
        }
    },
    field: 'gender'
})
    .select('gender')
    .toJSON();
// => [{ gender: 'Female' }, { gender: 'Male' }, { gender: 'Male' }]

// ...
// Validate a field
// ...
dataFrameAdapter(functionConfigRepository.isGreaterThanOrEqualTo, {
    args: {
        value: 30
    },
    field: 'age'
})
    .select('age')
    .toJSON();
// => [{ age: 39 }, { age: 47 }]

// ...
// Select a couple fields, order the results by and and return the oldest person
// ...
dataFrame = dataFrame.select('gender', 'name').orderBy('age:desc').limit(1);

dataFrame.toJSON();
// => [
//       { age: 47, name: 'Billy' },
//    ]

// Optionally you can serialize the frame using a custom data frame format
// you can then write that to a file and read it directly back into a data frame
// ...
let serialized = dataFrame.serialize();
// => <encoded string>
await DataFrame.deserialize(serialized);
```


### Column

[View the source](https://github.com/terascope/teraslice/blob/master/packages/data-mate/src/column/Column.ts)
[View the API docs](https://terascope.github.io/teraslice/docs/packages/data-mate/api/classes/column_Column.Column)

#### Examples

```ts
let column = Column.fromJSON('age', {
    type: FieldType.Short
}, [38, 47, 10, 10]);

// ...
// Get the number of rows
// ...
column.size;
// => 4

// ...
// Return the vector, you use to do more complicated operations.
// ...
column.vector;
// => Vector<number>

// ...
// Calculate the sum of a field
// ...
column.sum();
// => 106

// ...
// Return the unique list of values
// ...
column = column.unique();
// => [38, 47, 10]

// ...
// Return the unique list of values
// ...
column = column.sort();
// => [10, 47, 38]

// ...
// Output the javascript array of the values
// ...
column.toJSON();
// => [10, 38, 47]
```

### Vector

[View the source](https://github.com/terascope/teraslice/blob/master/packages/data-mate/src/vector/Vector.ts)
[View the API docs](https://terascope.github.io/teraslice/docs/packages/data-mate/api/classes/vector_Vector.Vector)


```ts
```

### Builder

[View the source](https://github.com/terascope/teraslice/blob/master/packages/data-mate/src/builder/Builder.ts)
[View the API docs](https://terascope.github.io/teraslice/docs/packages/data-mate/api/classes/builder_Builder.Builder)

#### Examples

```ts
// create a WritableData instance with a row size of 5
// this is where the builder will write the data
const data = new WritableData(5);
const builder = Builder.make(data, {
    config: {
        type: FieldType.Integer
    }
});

const dataPoints = [5, 12, null, 100, 2];
for (const item of dataPoints) {
    builder.append(i);
}

const vector = builder.toVector()
// Vector<number>(size: 5)

new Column(vector, { name: 'data_points' })
```

### AggregationFrame

[View the source](https://github.com/terascope/teraslice/blob/master/packages/data-mate/src/aggregation-frame/AggregationFrame.ts)
[View the API docs](https://terascope.github.io/teraslice/docs/packages/data-mate/api/classes/aggregation_frame_AggregationFrame.AggregationFrame)

#### Examples

```ts
const dataTypeConfig = {
    version: 1,
    fields: {
        name: {
            type: FieldType.Keyword,
        },
        age: {
            type: FieldType.Short,
        },
        gender: {
            type: FieldType.Keyword
        },
        birth_date: {
            type: FieldType.Date
        }
    }
};

let dataFrame = DataFrame.fromJSON(dataTypeConfig, [
    {
        name: 'Jill',
        age: 39,
        gender: 'F',
        birth_date: '1981-08-20T07:00:00.000Z',
    },
    {
        name: 'Billy',
        age: 47,
        gender: 'M',
        birth_date: '1973-06-05T07:00:00.000Z',
    },
    {
        name: 'Frank',
        age: 20,
        gender: 'M',
        birth_date: '2000-03-05T07:00:00.000Z'
    },
]);

// ...
// Count the number of records for each gender
// ...
const resultFrame = await dataFrame
    .select('name', 'gender')
    .aggregate()
    .groupBy('gender')
    .count('gender', 'count_per_gender')
    .orderBy('count_per_gender')
    .run();
// => [
//       { name: 'JILL', gender: 'F', count_per_gender: 1 },
//       { name: 'BILLY', gender: 'M', count_per_gender: 2 }
//    ]
```

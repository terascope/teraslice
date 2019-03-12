---
title: Chunked File Reader
sidebar_label: chunked-file-reader
---

> This module is an abstracted reader for use in various Teraslice readers. It uses an externally-defined reader to read data and the packages up the data in a dataEntity for use with other Teraslice processors. Chunk parsing is wrapped up in this module and supports `json`, `ldjson`
(line-delimited JSON), `tsv`, `csv`, and `raw`.

# Installation

```bash
# Using yarn
yarn add @terascope/chunked-file-reader
# Using npm
npm install --save @terascope/chunked-file-reader
```

## getOffsets

| Parameter | Description                |
| --------- | -------------------------- |
| size      | Target slice size in bytes |
| total     | Total file size in bytes   |
| delimiter | File delimiter             |

This function takes `size`, `total`, and `delimiter` and returns an array of offsets to use for the
given file. The offsets will follow this format:

```js
{
    length: 1000,
    offset: 0
}
```

## getChunk

slice, opConfig, metadata, logger

| Parameter    | Description                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| readerClient | Custom reader client. Must take `offset` and `length` as para meters (`readerClient(offset, length)`) |
| slice        | Current slice to process. Must have the same structure as the return from `getOffsets`                |
| opConfig     | Custom reader's configuration. At the very least, it must contain a `_dead_letter_action` attribute   |
| metadata     | An object containing additional metadata to add to the record. Must at least be `{}`                  |
| logger       | The logger to use with the reader                                                                     |

`_dead_letter_action` has three supported options: `throw`, `log`, `none`. Additional documentation
can be found [here](https://github.com/terascope/teraslice/blob/master/docs/configuration/ops.md#operation-level-configuration-options).

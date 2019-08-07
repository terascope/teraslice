---
title: Utils: `PRetryConfig`
sidebar_label: PRetryConfig
---

# Interface: PRetryConfig

## Hierarchy

* **PRetryConfig**

## Index

### Properties

* [backoff](pretryconfig.md#backoff)
* [delay](pretryconfig.md#delay)
* [endWithFatal](pretryconfig.md#endwithfatal)
* [logError](pretryconfig.md#logerror)
* [matches](pretryconfig.md#optional-matches)
* [maxDelay](pretryconfig.md#maxdelay)
* [reason](pretryconfig.md#optional-reason)
* [retries](pretryconfig.md#retries)

## Properties

###  backoff

• **backoff**: *number*

*Defined in [promises.ts:36](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/utils/src/promises.ts#L36)*

The backoff multiplier

**`default`** 2

___

###  delay

• **delay**: *number*

*Defined in [promises.ts:22](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/utils/src/promises.ts#L22)*

The initial time to delay before retrying the function

**`default`** 500

___

###  endWithFatal

• **endWithFatal**: *boolean*

*Defined in [promises.ts:41](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/utils/src/promises.ts#L41)*

If set to true, this will set fail with fatalError to true

___

###  logError

• **logError**: *function*

*Defined in [promises.ts:51](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/utils/src/promises.ts#L51)*

Log function for logging any errors that occurred

#### Type declaration:

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

___

### `Optional` matches

• **matches**? : *string | `RegExp`[]*

*Defined in [promises.ts:58](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/utils/src/promises.ts#L58)*

If this not specified or is empty, all errors will be treated as retryable.
If any of the items in the array match the error message,
it will be considered retryable

___

###  maxDelay

• **maxDelay**: *number*

*Defined in [promises.ts:29](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/utils/src/promises.ts#L29)*

The maximum time to delay when retrying in milliseconds

**`default`** 60000

___

### `Optional` reason

• **reason**? : *undefined | string*

*Defined in [promises.ts:46](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/utils/src/promises.ts#L46)*

Set a error message prefix

___

###  retries

• **retries**: *number*

*Defined in [promises.ts:15](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/utils/src/promises.ts#L15)*

The number of retries to attempt before failing.
This does not include the initial attempt

**`default`** 3

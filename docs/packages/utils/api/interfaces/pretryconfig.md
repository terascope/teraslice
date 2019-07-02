---
title: Utils :: PRetryConfig
sidebar_label: PRetryConfig
---

# Interface: PRetryConfig

## Hierarchy

* **PRetryConfig**

### Index

#### Properties

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

*Defined in [promises.ts:35](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/utils/src/promises.ts#L35)*

The backoff multiplier

**`default`** 2

___

###  delay

• **delay**: *number*

*Defined in [promises.ts:21](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/utils/src/promises.ts#L21)*

The initial time to delay before retrying the function

**`default`** 500

___

###  endWithFatal

• **endWithFatal**: *boolean*

*Defined in [promises.ts:40](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/utils/src/promises.ts#L40)*

If set to true, this will set fail with fatalError to true

___

###  logError

• **logError**: *function*

*Defined in [promises.ts:50](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/utils/src/promises.ts#L50)*

Log function for logging any errors that occurred

#### Type declaration:

▸ (...`args`: *any[]*): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

___

### `Optional` matches

• **matches**? : *string | `RegExp`[]*

*Defined in [promises.ts:57](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/utils/src/promises.ts#L57)*

If this not specified or is empty, all errors will be treated as retryable.
If any of the items in the array match the error message,
it will be considered retryable

___

###  maxDelay

• **maxDelay**: *number*

*Defined in [promises.ts:28](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/utils/src/promises.ts#L28)*

The maximum time to delay when retrying in milliseconds

**`default`** 60000

___

### `Optional` reason

• **reason**? : *undefined | string*

*Defined in [promises.ts:45](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/utils/src/promises.ts#L45)*

Set a error message prefix

___

###  retries

• **retries**: *number*

*Defined in [promises.ts:14](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/utils/src/promises.ts#L14)*

The number of retries to attempt before failing.
This does not include the initial attempt

**`default`** 3

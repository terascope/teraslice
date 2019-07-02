---
title: Utils Promises
sidebar_label: Promises
---

> Promises for @terascope/utils

[Globals](../overview.md) / ["promises"](_promises_.md) /

# External module: "promises"

### Index

#### Interfaces

* [PRetryConfig](../interfaces/_promises_.pretryconfig.md)

#### Functions

* [getBackoffDelay](_promises_.md#getbackoffdelay)
* [pDelay](_promises_.md#const-pdelay)
* [pImmediate](_promises_.md#const-pimmediate)
* [pRetry](_promises_.md#pretry)
* [waterfall](_promises_.md#waterfall)

## Functions

###  getBackoffDelay

▸ **getBackoffDelay**(`current`: *number*, `factor`: *number*, `max`: *number*, `min`: *number*): *number*

*Defined in [promises.ts:147](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/promises.ts#L147)*

Get backoff delay that will safe to retry and is slightly staggered

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`current` | number | - |
`factor` | number | 2 |
`max` | number | 60000 |
`min` | number | 500 |

**Returns:** *number*

___

### `Const` pDelay

▸ **pDelay**(`delay`: *number*): *`Promise<Object>`*

*Defined in [promises.ts:172](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/promises.ts#L172)*

promisified setTimeout

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`delay` | number | 1 |

**Returns:** *`Promise<Object>`*

___

### `Const` pImmediate

▸ **pImmediate**(): *`Promise<Object>`*

*Defined in [promises.ts:179](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/promises.ts#L179)*

promisified setImmediate

**Returns:** *`Promise<Object>`*

___

###  pRetry

▸ **pRetry**<**T**>(`fn`: *`PromiseFn<T>`*, `options?`: *`Partial<PRetryConfig>`*): *`Promise<T>`*

*Defined in [promises.ts:63](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/promises.ts#L63)*

A promise retry fn.

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`fn` | `PromiseFn<T>` |
`options?` | `Partial<PRetryConfig>` |

**Returns:** *`Promise<T>`*

___

###  waterfall

▸ **waterfall**(`input`: *any*, `fns`: *`PromiseFn`[]*, `addBreak`: *boolean*): *`Promise<any>`*

*Defined in [promises.ts:190](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/promises.ts#L190)*

Async waterfall function

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`fns` | `PromiseFn`[] | - |
`addBreak` | boolean | false |

**Returns:** *`Promise<any>`*

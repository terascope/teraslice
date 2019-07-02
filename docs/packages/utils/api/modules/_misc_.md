---
title: Utils Misc
sidebar_label: Misc
---

> Misc for @terascope/utils

[Globals](../overview.md) / ["misc"](_misc_.md) /

# External module: "misc"

### Index

#### Variables

* [isDev](_misc_.md#const-isdev)
* [isProd](_misc_.md#const-isprod)
* [isTest](_misc_.md#const-istest)

#### Functions

* [enumerable](_misc_.md#enumerable)
* [locked](_misc_.md#locked)

## Variables

### `Const` isDev

• **isDev**: *boolean* =  NODE_ENV === 'development'

*Defined in [misc.ts:5](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/misc.ts#L5)*

___

### `Const` isProd

• **isProd**: *boolean* =  NODE_ENV === 'production'

*Defined in [misc.ts:3](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/misc.ts#L3)*

___

### `Const` isTest

• **isTest**: *boolean* =  NODE_ENV === 'test'

*Defined in [misc.ts:4](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/misc.ts#L4)*

## Functions

###  enumerable

▸ **enumerable**(`enabled`: *boolean*): *`(Anonymous function)`*

*Defined in [misc.ts:18](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/misc.ts#L18)*

A decorator for making a method enumerable or none-enumerable

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`enabled` | boolean | true |

**Returns:** *`(Anonymous function)`*

___

###  locked

▸ **locked**(): *`(Anonymous function)`*

*Defined in [misc.ts:8](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/misc.ts#L8)*

A decorator for locking down a method

**Returns:** *`(Anonymous function)`*

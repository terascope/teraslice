---
title: Utils Utils
sidebar_label: Utils
---

> Utils for @terascope/utils

[Globals](../overview.md) / ["utils"](_utils_.md) /

# External module: "utils"

### Index

#### Functions

* [fastAssign](_utils_.md#fastassign)
* [getField](_utils_.md#getfield)
* [getFirst](_utils_.md#getfirst)
* [getTypeOf](_utils_.md#gettypeof)
* [isBooleanLike](_utils_.md#isbooleanlike)
* [isEmpty](_utils_.md#isempty)
* [isFunction](_utils_.md#isfunction)
* [noop](_utils_.md#noop)
* [parseJSON](_utils_.md#parsejson)
* [parseList](_utils_.md#parselist)
* [toBoolean](_utils_.md#toboolean)
* [tryParseJSON](_utils_.md#tryparsejson)

## Functions

###  fastAssign

▸ **fastAssign**<**T**, **U**>(`target`: *`T`*, `source`: *`U`*): *`T`*

*Defined in [utils.ts:76](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/utils.ts#L76)*

Perform a shallow clone of an object to another, in the fastest way possible

**Type parameters:**

▪ **T**

▪ **U**

**Parameters:**

Name | Type |
------ | ------ |
`target` | `T` |
`source` | `U` |

**Returns:** *`T`*

___

###  getField

▸ **getField**<**V**>(`input`: *undefined*, `field`: *string*, `defaultVal?`: *[V]()*): *`V`*

*Defined in [utils.ts:132](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/utils.ts#L132)*

A typesafe get function (will always return the correct type)

**IMPORTANT** This does not behave like lodash.get,
it does not deal with dot notation (nested fields)
and it will use the default when dealing with OR statements

**Type parameters:**

▪ **V**

**Parameters:**

Name | Type |
------ | ------ |
`input` | undefined |
`field` | string |
`defaultVal?` | [V]() |

**Returns:** *`V`*

▸ **getField**<**T**, **P**>(`input`: *`T`*, `field`: *`P`*): *`T[P]`*

*Defined in [utils.ts:133](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/utils.ts#L133)*

**Type parameters:**

▪ **T**: *`__type`*

▪ **P**: *keyof T*

**Parameters:**

Name | Type |
------ | ------ |
`input` | `T` |
`field` | `P` |

**Returns:** *`T[P]`*

▸ **getField**<**T**, **P**>(`input`: *`T` | undefined*, `field`: *`P`*): *`T[P]`*

*Defined in [utils.ts:134](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/utils.ts#L134)*

**Type parameters:**

▪ **T**: *`__type`*

▪ **P**: *keyof T*

**Parameters:**

Name | Type |
------ | ------ |
`input` | `T` \| undefined |
`field` | `P` |

**Returns:** *`T[P]`*

▸ **getField**<**T**, **P**, **V**>(`input`: *`T` | undefined*, `field`: *`P`*, `defaultVal`: *`V`*): *`T[P]` | `V`*

*Defined in [utils.ts:135](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/utils.ts#L135)*

**Type parameters:**

▪ **T**: *`__type`*

▪ **P**: *keyof T*

▪ **V**

**Parameters:**

Name | Type |
------ | ------ |
`input` | `T` \| undefined |
`field` | `P` |
`defaultVal` | `V` |

**Returns:** *`T[P]` | `V`*

▸ **getField**<**T**, **P**, **V**>(`input`: *`T` | undefined*, `field`: *`P`*, `defaultVal`: *`V`*): *`T[P]`*

*Defined in [utils.ts:136](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/utils.ts#L136)*

**Type parameters:**

▪ **T**: *`__type`*

▪ **P**: *keyof T*

▪ **V**: *`T[P]`*

**Parameters:**

Name | Type |
------ | ------ |
`input` | `T` \| undefined |
`field` | `P` |
`defaultVal` | `V` |

**Returns:** *`T[P]`*

___

###  getFirst

▸ **getFirst**<**T**>(`input`: *`T` | `T`[]*): *`T`*

*Defined in [utils.ts:71](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/utils.ts#L71)*

If the input is an array it will return the first item
else if it will return the input

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`input` | `T` \| `T`[] |

**Returns:** *`T`*

___

###  getTypeOf

▸ **getTypeOf**(`val`: *any*): *string*

*Defined in [utils.ts:44](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/utils.ts#L44)*

Determine the type of an input

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *string*

a human friendly string that describes the input

___

###  isBooleanLike

▸ **isBooleanLike**(`input`: *any*): *boolean*

*Defined in [utils.ts:95](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/utils.ts#L95)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isEmpty

▸ **isEmpty**(`val?`: *any*): *boolean*

*Defined in [utils.ts:9](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/utils.ts#L9)*

Check if an input is empty, similar to lodash.isEmpty

**Parameters:**

Name | Type |
------ | ------ |
`val?` | any |

**Returns:** *boolean*

___

###  isFunction

▸ **isFunction**(`input`: *any*): *boolean*

*Defined in [utils.ts:63](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/utils.ts#L63)*

Verify an input is a function

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  noop

▸ **noop**(...`args`: *any[]*): *any*

*Defined in [utils.ts:123](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/utils.ts#L123)*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *any*

___

###  parseJSON

▸ **parseJSON**<**T**>(`buf`: *`Buffer` | string*): *`T`*

*Defined in [utils.ts:27](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/utils.ts#L27)*

JSON encoded buffer into a json object

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`buf` | `Buffer` \| string |

**Returns:** *`T`*

___

###  parseList

▸ **parseList**(`input`: *any*): *string[]*

*Defined in [utils.ts:106](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/utils.ts#L106)*

Maps an array of strings and and trims the result, or
parses a comma separated list and trims the result

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *string[]*

___

###  toBoolean

▸ **toBoolean**(`input`: *any*): *boolean*

*Defined in [utils.ts:89](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/utils.ts#L89)*

Convert any input into a boolean, this will work with stringified boolean

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  tryParseJSON

▸ **tryParseJSON**(`input`: *any*): *any*

*Defined in [utils.ts:18](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/utils.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *any*

---
title: Utils Arrays
sidebar_label: Arrays
---

> Arrays for @terascope/utils

[Globals](../overview.md) / ["arrays"](_arrays_.md) /

# External module: "arrays"

### Index

#### Functions

* [castArray](_arrays_.md#castarray)
* [concat](_arrays_.md#concat)
* [fastMap](_arrays_.md#fastmap)
* [flatten](_arrays_.md#flatten)
* [times](_arrays_.md#times)
* [uniq](_arrays_.md#uniq)
* [withoutNil](_arrays_.md#withoutnil)

## Functions

###  castArray

▸ **castArray**<**T**>(`input`: *`T` | `T`[]*): *`T`[]*

*Defined in [arrays.ts:9](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/arrays.ts#L9)*

A simplified implemation of lodash castArray

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`input` | `T` \| `T`[] |

**Returns:** *`T`[]*

___

###  concat

▸ **concat**<**T**>(`arr`: *`T` | `T`[]*, `arr1?`: *`T` | `T`[]*): *`T`[]*

*Defined in [arrays.ts:18](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/arrays.ts#L18)*

Concat and unique the items in the array
Any non-array value will be converted to an array

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`arr` | `T` \| `T`[] |
`arr1?` | `T` \| `T`[] |

**Returns:** *`T`[]*

___

###  fastMap

▸ **fastMap**<**T**, **U**>(`arr`: *`T`[]*, `fn`: *function*): *`U`[]*

*Defined in [arrays.ts:59](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/arrays.ts#L59)*

Map an array faster without sparse array handling

**Type parameters:**

▪ **T**

▪ **U**

**Parameters:**

▪ **arr**: *`T`[]*

▪ **fn**: *function*

▸ (`val`: *`T`*, `index`: *number*): *`U`*

**Parameters:**

Name | Type |
------ | ------ |
`val` | `T` |
`index` | number |

**Returns:** *`U`[]*

___

###  flatten

▸ **flatten**<**T**>(`val`: *[Many](../interfaces/_interfaces_.many.md)‹*`T`[]*›*): *`T`[]*

*Defined in [arrays.ts:4](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/arrays.ts#L4)*

A native implemation of lodash flatten

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`val` | [Many](../interfaces/_interfaces_.many.md)‹*`T`[]*› |

**Returns:** *`T`[]*

___

###  times

▸ **times**(`n`: *number*): *number[]*

*Defined in [arrays.ts:45](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/arrays.ts#L45)*

A native implemation of lodash times

**Parameters:**

Name | Type |
------ | ------ |
`n` | number |

**Returns:** *number[]*

▸ **times**<**T**>(`n`: *number*, `fn`: *function*): *`T`[]*

*Defined in [arrays.ts:46](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/arrays.ts#L46)*

**Type parameters:**

▪ **T**

**Parameters:**

▪ **n**: *number*

▪ **fn**: *function*

▸ (`index`: *number*): *`T`*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |

**Returns:** *`T`[]*

___

###  uniq

▸ **uniq**<**T**>(`arr`: *`T`[]*): *`T`[]*

*Defined in [arrays.ts:40](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/arrays.ts#L40)*

A native implemation of lodash uniq

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`arr` | `T`[] |

**Returns:** *`T`[]*

___

###  withoutNil

▸ **withoutNil**<**T**>(`input`: *`T`*): *[WithoutNil](_interfaces_.md#withoutnil)‹*`T`*›*

*Defined in [arrays.ts:26](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/arrays.ts#L26)*

Build a new object without null or undefined values (shallow)

**Type parameters:**

▪ **T**: *object*

**Parameters:**

Name | Type |
------ | ------ |
`input` | `T` |

**Returns:** *[WithoutNil](_interfaces_.md#withoutnil)‹*`T`*›*

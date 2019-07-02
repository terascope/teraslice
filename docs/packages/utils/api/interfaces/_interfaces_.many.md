---
title: Utils Interfaces Many
sidebar_label: Interfaces Many
---

> Interfaces Many for @terascope/utils

[Globals](../overview.md) / ["interfaces"](../modules/_interfaces_.md) / [Many](_interfaces_.many.md) /

# Interface: Many <**T**>

A simple definitions of array

## Type parameters

▪ **T**

## Hierarchy

* `Array<T>`

  * **Many**

## Indexable

● \[▪ **n**: *number*\]: `T`

A simple definitions of array

### Index

#### Properties

* [Array](_interfaces_.many.md#array)
* [length](_interfaces_.many.md#length)

#### Methods

* [__@iterator](_interfaces_.many.md#__@iterator)
* [__@unscopables](_interfaces_.many.md#__@unscopables)
* [concat](_interfaces_.many.md#concat)
* [copyWithin](_interfaces_.many.md#copywithin)
* [entries](_interfaces_.many.md#entries)
* [every](_interfaces_.many.md#every)
* [fill](_interfaces_.many.md#fill)
* [filter](_interfaces_.many.md#filter)
* [find](_interfaces_.many.md#find)
* [findIndex](_interfaces_.many.md#findindex)
* [forEach](_interfaces_.many.md#foreach)
* [includes](_interfaces_.many.md#includes)
* [indexOf](_interfaces_.many.md#indexof)
* [join](_interfaces_.many.md#join)
* [keys](_interfaces_.many.md#keys)
* [lastIndexOf](_interfaces_.many.md#lastindexof)
* [map](_interfaces_.many.md#map)
* [pop](_interfaces_.many.md#pop)
* [push](_interfaces_.many.md#push)
* [reduce](_interfaces_.many.md#reduce)
* [reduceRight](_interfaces_.many.md#reduceright)
* [reverse](_interfaces_.many.md#reverse)
* [shift](_interfaces_.many.md#shift)
* [slice](_interfaces_.many.md#slice)
* [some](_interfaces_.many.md#some)
* [sort](_interfaces_.many.md#sort)
* [splice](_interfaces_.many.md#splice)
* [toLocaleString](_interfaces_.many.md#tolocalestring)
* [toString](_interfaces_.many.md#tostring)
* [unshift](_interfaces_.many.md#unshift)
* [values](_interfaces_.many.md#values)

## Properties

###  Array

• **Array**: *`ArrayConstructor`*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1368](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1368)*

___

###  length

• **length**: *number*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1209](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1209)*

Gets or sets the length of the array. This is a number one higher than the highest element defined in an array.

## Methods

###  __@iterator

▸ **__@iterator**(): *`IterableIterator<T>`*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es2015.iterable.d.ts:52](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es2015.iterable.d.ts#L52)*

Iterator

**Returns:** *`IterableIterator<T>`*

___

###  __@unscopables

▸ **__@unscopables**(): *object*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts:94](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts#L94)*

Returns an object whose properties have the value 'true'
when they will be absent when used in a 'with' statement.

**Returns:** *object*

___

###  concat

▸ **concat**(...`items`: *`ConcatArray<T>`[]*): *`T`[]*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1231](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1231)*

Combines two or more arrays.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`...items` | `ConcatArray<T>`[] | Additional items to add to the end of array1.  |

**Returns:** *`T`[]*

▸ **concat**(...`items`: *`T` | `ConcatArray<T>`[]*): *`T`[]*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1236](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1236)*

Combines two or more arrays.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`...items` | `T` \| `ConcatArray<T>`[] | Additional items to add to the end of array1.  |

**Returns:** *`T`[]*

___

###  copyWithin

▸ **copyWithin**(`target`: *number*, `start`: *number*, `end?`: *undefined | number*): *this*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es2015.core.d.ts:64](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es2015.core.d.ts#L64)*

Returns the this object after copying a section of the array identified by start and end
to the same array starting at position target

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`target` | number | If target is negative, it is treated as length+target where length is the length of the array. |
`start` | number | If start is negative, it is treated as length+start. If end is negative, it is treated as length+end. |
`end?` | undefined \| number | If not specified, length of the this object is used as its default value.  |

**Returns:** *this*

___

###  entries

▸ **entries**(): *`IterableIterator<[number, T]>`*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es2015.iterable.d.ts:57](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es2015.iterable.d.ts#L57)*

Returns an iterable of key, value pairs for every entry in the array

**Returns:** *`IterableIterator<[number, T]>`*

___

###  every

▸ **every**(`callbackfn`: *function*, `thisArg?`: *any*): *boolean*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1296](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1296)*

Determines whether all the members of an array satisfy the specified test.

**Parameters:**

▪ **callbackfn**: *function*

A function that accepts up to three arguments. The every method calls the callbackfn function for each element in array1 until the callbackfn returns false, or until the end of the array.

▸ (`value`: *`T`*, `index`: *number*, `array`: *`T`[]*): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`value` | `T` |
`index` | number |
`array` | `T`[] |

▪`Optional`  **thisArg**: *any*

An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.

**Returns:** *boolean*

___

###  fill

▸ **fill**(`value`: *`T`*, `start?`: *undefined | number*, `end?`: *undefined | number*): *this*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es2015.core.d.ts:53](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es2015.core.d.ts#L53)*

Returns the this object after filling the section identified by start and end with value

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`value` | `T` | value to fill array section with |
`start?` | undefined \| number | index to start filling the array at. If start is negative, it is treated as length+start where length is the length of the array. |
`end?` | undefined \| number | index to stop filling the array at. If end is negative, it is treated as length+end.  |

**Returns:** *this*

___

###  filter

▸ **filter**<**S**>(`callbackfn`: *function*, `thisArg?`: *any*): *`S`[]*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1320](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1320)*

Returns the elements of an array that meet the condition specified in a callback function.

**Type parameters:**

▪ **S**: *`T`*

**Parameters:**

▪ **callbackfn**: *function*

A function that accepts up to three arguments. The filter method calls the callbackfn function one time for each element in the array.

▸ (`value`: *`T`*, `index`: *number*, `array`: *`T`[]*): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`value` | `T` |
`index` | number |
`array` | `T`[] |

▪`Optional`  **thisArg**: *any*

An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.

**Returns:** *`S`[]*

▸ **filter**(`callbackfn`: *function*, `thisArg?`: *any*): *`T`[]*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1326](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1326)*

Returns the elements of an array that meet the condition specified in a callback function.

**Parameters:**

▪ **callbackfn**: *function*

A function that accepts up to three arguments. The filter method calls the callbackfn function one time for each element in the array.

▸ (`value`: *`T`*, `index`: *number*, `array`: *`T`[]*): *any*

**Parameters:**

Name | Type |
------ | ------ |
`value` | `T` |
`index` | number |
`array` | `T`[] |

▪`Optional`  **thisArg**: *any*

An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.

**Returns:** *`T`[]*

___

###  find

▸ **find**<**S**>(`predicate`: *function*, `thisArg?`: *any*): *`S` | undefined*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es2015.core.d.ts:31](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es2015.core.d.ts#L31)*

Returns the value of the first element in the array where predicate is true, and undefined
otherwise.

**Type parameters:**

▪ **S**: *`T`*

**Parameters:**

▪ **predicate**: *function*

find calls predicate once for each element of the array, in ascending
order, until it finds one where predicate returns true. If such an element is found, find
immediately returns that element value. Otherwise, find returns undefined.

▸ (`this`: *void*, `value`: *`T`*, `index`: *number*, `obj`: *`T`[]*): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`this` | void |
`value` | `T` |
`index` | number |
`obj` | `T`[] |

▪`Optional`  **thisArg**: *any*

If provided, it will be used as the this value for each invocation of
predicate. If it is not provided, undefined is used instead.

**Returns:** *`S` | undefined*

▸ **find**(`predicate`: *function*, `thisArg?`: *any*): *`T` | undefined*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es2015.core.d.ts:32](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es2015.core.d.ts#L32)*

**Parameters:**

▪ **predicate**: *function*

▸ (`value`: *`T`*, `index`: *number*, `obj`: *`T`[]*): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`value` | `T` |
`index` | number |
`obj` | `T`[] |

▪`Optional`  **thisArg**: *any*

**Returns:** *`T` | undefined*

___

###  findIndex

▸ **findIndex**(`predicate`: *function*, `thisArg?`: *any*): *number*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es2015.core.d.ts:43](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es2015.core.d.ts#L43)*

Returns the index of the first element in the array where predicate is true, and -1
otherwise.

**Parameters:**

▪ **predicate**: *function*

find calls predicate once for each element of the array, in ascending
order, until it finds one where predicate returns true. If such an element is found,
findIndex immediately returns that element index. Otherwise, findIndex returns -1.

▸ (`value`: *`T`*, `index`: *number*, `obj`: *`T`[]*): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`value` | `T` |
`index` | number |
`obj` | `T`[] |

▪`Optional`  **thisArg**: *any*

If provided, it will be used as the this value for each invocation of
predicate. If it is not provided, undefined is used instead.

**Returns:** *number*

___

###  forEach

▸ **forEach**(`callbackfn`: *function*, `thisArg?`: *any*): *void*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1308](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1308)*

Performs the specified action for each element in an array.

**Parameters:**

▪ **callbackfn**: *function*

A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array.

▸ (`value`: *`T`*, `index`: *number*, `array`: *`T`[]*): *void*

**Parameters:**

Name | Type |
------ | ------ |
`value` | `T` |
`index` | number |
`array` | `T`[] |

▪`Optional`  **thisArg**: *any*

An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.

**Returns:** *void*

___

###  includes

▸ **includes**(`searchElement`: *`T`*, `fromIndex?`: *undefined | number*): *boolean*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es2016.array.include.d.ts:27](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es2016.array.include.d.ts#L27)*

Determines whether an array includes a certain element, returning true or false as appropriate.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`searchElement` | `T` | The element to search for. |
`fromIndex?` | undefined \| number | The position in this array at which to begin searching for searchElement.  |

**Returns:** *boolean*

___

###  indexOf

▸ **indexOf**(`searchElement`: *`T`*, `fromIndex?`: *undefined | number*): *number*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1284](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1284)*

Returns the index of the first occurrence of a value in an array.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`searchElement` | `T` | The value to locate in the array. |
`fromIndex?` | undefined \| number | The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.  |

**Returns:** *number*

___

###  join

▸ **join**(`separator?`: *undefined | string*): *string*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1241](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1241)*

Adds all the elements of an array separated by the specified separator string.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`separator?` | undefined \| string | A string used to separate one element of an array from the next in the resulting String. If omitted, the array elements are separated with a comma.  |

**Returns:** *string*

___

###  keys

▸ **keys**(): *`IterableIterator<number>`*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es2015.iterable.d.ts:62](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es2015.iterable.d.ts#L62)*

Returns an iterable of keys in the array

**Returns:** *`IterableIterator<number>`*

___

###  lastIndexOf

▸ **lastIndexOf**(`searchElement`: *`T`*, `fromIndex?`: *undefined | number*): *number*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1290](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1290)*

Returns the index of the last occurrence of a specified value in an array.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`searchElement` | `T` | The value to locate in the array. |
`fromIndex?` | undefined \| number | The array index at which to begin the search. If fromIndex is omitted, the search starts at the last index in the array.  |

**Returns:** *number*

___

###  map

▸ **map**<**U**>(`callbackfn`: *function*, `thisArg?`: *any*): *`U`[]*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1314](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1314)*

Calls a defined callback function on each element of an array, and returns an array that contains the results.

**Type parameters:**

▪ **U**

**Parameters:**

▪ **callbackfn**: *function*

A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.

▸ (`value`: *`T`*, `index`: *number*, `array`: *`T`[]*): *`U`*

**Parameters:**

Name | Type |
------ | ------ |
`value` | `T` |
`index` | number |
`array` | `T`[] |

▪`Optional`  **thisArg**: *any*

An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.

**Returns:** *`U`[]*

___

###  pop

▸ **pop**(): *`T` | undefined*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1221](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1221)*

Removes the last element from an array and returns it.

**Returns:** *`T` | undefined*

___

###  push

▸ **push**(...`items`: *`T`[]*): *number*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1226](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1226)*

Appends new elements to an array, and returns the new length of the array.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`...items` | `T`[] | New elements of the Array.  |

**Returns:** *number*

___

###  reduce

▸ **reduce**(`callbackfn`: *function*): *`T`*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1332](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1332)*

Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.

**Parameters:**

▪ **callbackfn**: *function*

A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.

▸ (`previousValue`: *`T`*, `currentValue`: *`T`*, `currentIndex`: *number*, `array`: *`T`[]*): *`T`*

**Parameters:**

Name | Type |
------ | ------ |
`previousValue` | `T` |
`currentValue` | `T` |
`currentIndex` | number |
`array` | `T`[] |

**Returns:** *`T`*

▸ **reduce**(`callbackfn`: *function*, `initialValue`: *`T`*): *`T`*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1333](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1333)*

**Parameters:**

▪ **callbackfn**: *function*

▸ (`previousValue`: *`T`*, `currentValue`: *`T`*, `currentIndex`: *number*, `array`: *`T`[]*): *`T`*

**Parameters:**

Name | Type |
------ | ------ |
`previousValue` | `T` |
`currentValue` | `T` |
`currentIndex` | number |
`array` | `T`[] |

▪ **initialValue**: *`T`*

**Returns:** *`T`*

▸ **reduce**<**U**>(`callbackfn`: *function*, `initialValue`: *`U`*): *`U`*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1339](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1339)*

Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.

**Type parameters:**

▪ **U**

**Parameters:**

▪ **callbackfn**: *function*

A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.

▸ (`previousValue`: *`U`*, `currentValue`: *`T`*, `currentIndex`: *number*, `array`: *`T`[]*): *`U`*

**Parameters:**

Name | Type |
------ | ------ |
`previousValue` | `U` |
`currentValue` | `T` |
`currentIndex` | number |
`array` | `T`[] |

▪ **initialValue**: *`U`*

If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.

**Returns:** *`U`*

___

###  reduceRight

▸ **reduceRight**(`callbackfn`: *function*): *`T`*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1345](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1345)*

Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.

**Parameters:**

▪ **callbackfn**: *function*

A function that accepts up to four arguments. The reduceRight method calls the callbackfn function one time for each element in the array.

▸ (`previousValue`: *`T`*, `currentValue`: *`T`*, `currentIndex`: *number*, `array`: *`T`[]*): *`T`*

**Parameters:**

Name | Type |
------ | ------ |
`previousValue` | `T` |
`currentValue` | `T` |
`currentIndex` | number |
`array` | `T`[] |

**Returns:** *`T`*

▸ **reduceRight**(`callbackfn`: *function*, `initialValue`: *`T`*): *`T`*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1346](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1346)*

**Parameters:**

▪ **callbackfn**: *function*

▸ (`previousValue`: *`T`*, `currentValue`: *`T`*, `currentIndex`: *number*, `array`: *`T`[]*): *`T`*

**Parameters:**

Name | Type |
------ | ------ |
`previousValue` | `T` |
`currentValue` | `T` |
`currentIndex` | number |
`array` | `T`[] |

▪ **initialValue**: *`T`*

**Returns:** *`T`*

▸ **reduceRight**<**U**>(`callbackfn`: *function*, `initialValue`: *`U`*): *`U`*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1352](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1352)*

Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.

**Type parameters:**

▪ **U**

**Parameters:**

▪ **callbackfn**: *function*

A function that accepts up to four arguments. The reduceRight method calls the callbackfn function one time for each element in the array.

▸ (`previousValue`: *`U`*, `currentValue`: *`T`*, `currentIndex`: *number*, `array`: *`T`[]*): *`U`*

**Parameters:**

Name | Type |
------ | ------ |
`previousValue` | `U` |
`currentValue` | `T` |
`currentIndex` | number |
`array` | `T`[] |

▪ **initialValue**: *`U`*

If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.

**Returns:** *`U`*

___

###  reverse

▸ **reverse**(): *`T`[]*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1245](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1245)*

Reverses the elements in an Array.

**Returns:** *`T`[]*

___

###  shift

▸ **shift**(): *`T` | undefined*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1249](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1249)*

Removes the first element from an array and returns it.

**Returns:** *`T` | undefined*

___

###  slice

▸ **slice**(`start?`: *undefined | number*, `end?`: *undefined | number*): *`T`[]*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1255](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1255)*

Returns a section of an array.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`start?` | undefined \| number | The beginning of the specified portion of the array. |
`end?` | undefined \| number | The end of the specified portion of the array.  |

**Returns:** *`T`[]*

___

###  some

▸ **some**(`callbackfn`: *function*, `thisArg?`: *any*): *boolean*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1302](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1302)*

Determines whether the specified callback function returns true for any element of an array.

**Parameters:**

▪ **callbackfn**: *function*

A function that accepts up to three arguments. The some method calls the callbackfn function for each element in array1 until the callbackfn returns true, or until the end of the array.

▸ (`value`: *`T`*, `index`: *number*, `array`: *`T`[]*): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`value` | `T` |
`index` | number |
`array` | `T`[] |

▪`Optional`  **thisArg**: *any*

An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.

**Returns:** *boolean*

___

###  sort

▸ **sort**(`compareFn?`: *undefined | function*): *this*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1260](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1260)*

Sorts an array.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`compareFn?` | undefined \| function | The name of the function used to determine the order of the elements. If omitted, the elements are sorted in ascending, ASCII character order.  |

**Returns:** *this*

___

###  splice

▸ **splice**(`start`: *number*, `deleteCount?`: *undefined | number*): *`T`[]*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1266](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1266)*

Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`start` | number | The zero-based location in the array from which to start removing elements. |
`deleteCount?` | undefined \| number | The number of elements to remove.  |

**Returns:** *`T`[]*

▸ **splice**(`start`: *number*, `deleteCount`: *number*, ...`items`: *`T`[]*): *`T`[]*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1273](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1273)*

Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`start` | number | The zero-based location in the array from which to start removing elements. |
`deleteCount` | number | The number of elements to remove. |
`...items` | `T`[] | Elements to insert into the array in place of the deleted elements.  |

**Returns:** *`T`[]*

___

###  toLocaleString

▸ **toLocaleString**(): *string*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1217](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1217)*

Returns a string representation of an array. The elements are converted to string using their toLocalString methods.

**Returns:** *string*

___

###  toString

▸ **toString**(): *string*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1213](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1213)*

Returns a string representation of an array.

**Returns:** *string*

___

###  unshift

▸ **unshift**(...`items`: *`T`[]*): *number*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:1278](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L1278)*

Inserts new elements at the start of an array.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`...items` | `T`[] | Elements to insert at the start of the Array.  |

**Returns:** *number*

___

###  values

▸ **values**(): *`IterableIterator<T>`*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es2015.iterable.d.ts:67](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es2015.iterable.d.ts#L67)*

Returns an iterable of values in the array

**Returns:** *`IterableIterator<T>`*

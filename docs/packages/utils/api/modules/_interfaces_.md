---
title: Utils Interfaces
sidebar_label: Interfaces
---

> Interfaces for @terascope/utils

[Globals](../overview.md) / ["interfaces"](_interfaces_.md) /

# External module: "interfaces"

### Index

#### Interfaces

* [AnyObject](../interfaces/_interfaces_.anyobject.md)
* [Many](../interfaces/_interfaces_.many.md)

#### Type aliases

* [Omit](_interfaces_.md#omit)
* [Optional](_interfaces_.md#optional)
* [Override](_interfaces_.md#override)
* [Overwrite](_interfaces_.md#overwrite)
* [Required](_interfaces_.md#required)
* [WithoutNil](_interfaces_.md#withoutnil)

## Type aliases

###  Omit

Ƭ **Omit**: *`Pick<T, Exclude<keyof T, K>>`*

*Defined in [interfaces.ts:7](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/interfaces.ts#L7)*

Omit the properties available to type.
Useful for excluding properties from a type

**`example`** `Omit<{ a: number, b: number, c: number }, 'b'|'c'> // => { a: 1 }`

___

###  Optional

Ƭ **Optional**: *object*

*Defined in [interfaces.ts:39](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/interfaces.ts#L39)*

Like Partial but makes certain properties optional

**`example`** `Optional<{ a: number, b: number }, 'b'>`

#### Type declaration:

___

###  Override

Ƭ **Override**: *object*

*Defined in [interfaces.ts:23](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/interfaces.ts#L23)*

Override specific properties on a type

**`example`** `Override<{ a: number, b: number }, { b: string }>`

#### Type declaration:

___

###  Overwrite

Ƭ **Overwrite**: *object & `T2`*

*Defined in [interfaces.ts:15](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/interfaces.ts#L15)*

Overwrite a simple type with different properties.
Useful changing and adding additional properties

**`example`** `Overwrite<{ a: number, b: number }, { b?: number }>`

___

###  Required

Ƭ **Required**: *object*

*Defined in [interfaces.ts:32](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/interfaces.ts#L32)*

Like Partial but makes certain properties required

**`example`** `Required<{ a: number, b: number }, 'b'>`

#### Type declaration:

___

###  WithoutNil

Ƭ **WithoutNil**: *object*

*Defined in [interfaces.ts:44](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/interfaces.ts#L44)*

Without null or undefined properties

#### Type declaration:

---
title: Data Types: `ESMappingOptions`
sidebar_label: ESMappingOptions
---

# Interface: ESMappingOptions

## Hierarchy

* **ESMappingOptions**

## Index

### Properties

* [overrides](esmappingoptions.md#optional-overrides)
* [typeName](esmappingoptions.md#optional-typename)
* [version](esmappingoptions.md#optional-version)

## Properties

### `Optional` overrides

• **overrides**? : *Partial‹[ESMapping](esmapping.md)›*

*Defined in [data-types/src/interfaces.ts:201](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/interfaces.ts#L201)*

Any elasitcsearch mapping overrides,
uses a deep assignment so nested fields can be overwritten.

___

### `Optional` typeName

• **typeName**? : *undefined | string*

*Defined in [data-types/src/interfaces.ts:196](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/interfaces.ts#L196)*

The elasticsearch index type

___

### `Optional` version

• **version**? : *undefined | number*

*Defined in [data-types/src/interfaces.ts:207](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/interfaces.ts#L207)*

The version of the elasticsearch cluster

**`default`** 6

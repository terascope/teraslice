---
title: Ts Transforms: `PostProcessConfig`
sidebar_label: PostProcessConfig
---

# Interface: PostProcessConfig

## Hierarchy

* **PostProcessConfig**

### Index

#### Properties

* [__id](postprocessconfig.md#__id)
* [__pipeline](postprocessconfig.md#optional-__pipeline)
* [case](postprocessconfig.md#optional-case)
* [decoder](postprocessconfig.md#optional-decoder)
* [delimiter](postprocessconfig.md#optional-delimiter)
* [end](postprocessconfig.md#optional-end)
* [fields](postprocessconfig.md#optional-fields)
* [follow](postprocessconfig.md#follow)
* [length](postprocessconfig.md#optional-length)
* [max](postprocessconfig.md#optional-max)
* [min](postprocessconfig.md#optional-min)
* [mutate](postprocessconfig.md#optional-mutate)
* [other_match_required](postprocessconfig.md#optional-other_match_required)
* [output](postprocessconfig.md#optional-output)
* [post_process](postprocessconfig.md#optional-post_process)
* [preserve_colons](postprocessconfig.md#optional-preserve_colons)
* [regex](postprocessconfig.md#optional-regex)
* [selector](postprocessconfig.md#optional-selector)
* [source_field](postprocessconfig.md#optional-source_field)
* [source_fields](postprocessconfig.md#optional-source_fields)
* [start](postprocessconfig.md#optional-start)
* [tags](postprocessconfig.md#optional-tags)
* [target_field](postprocessconfig.md#optional-target_field)
* [validation](postprocessconfig.md#optional-validation)
* [value](postprocessconfig.md#optional-value)

## Properties

###  __id

• **__id**: *string*

*Defined in [interfaces.ts:14](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/ts-transforms/src/interfaces.ts#L14)*

___

### `Optional` __pipeline

• **__pipeline**? : *undefined | string*

*Defined in [interfaces.ts:44](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/ts-transforms/src/interfaces.ts#L44)*

___

### `Optional` case

• **case**? : *[Case](../overview.md#case)*

*Defined in [interfaces.ts:40](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/ts-transforms/src/interfaces.ts#L40)*

___

### `Optional` decoder

• **decoder**? : *undefined | string*

*Defined in [interfaces.ts:29](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/ts-transforms/src/interfaces.ts#L29)*

___

### `Optional` delimiter

• **delimiter**? : *undefined | string*

*Defined in [interfaces.ts:36](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/ts-transforms/src/interfaces.ts#L36)*

___

### `Optional` end

• **end**? : *undefined | string*

*Defined in [interfaces.ts:25](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/ts-transforms/src/interfaces.ts#L25)*

___

### `Optional` fields

• **fields**? : *string[]*

*Defined in [interfaces.ts:35](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/ts-transforms/src/interfaces.ts#L35)*

___

###  follow

• **follow**: *string*

*Defined in [interfaces.ts:21](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/ts-transforms/src/interfaces.ts#L21)*

___

### `Optional` length

• **length**? : *undefined | number*

*Defined in [interfaces.ts:34](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/ts-transforms/src/interfaces.ts#L34)*

___

### `Optional` max

• **max**? : *undefined | number*

*Defined in [interfaces.ts:38](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/ts-transforms/src/interfaces.ts#L38)*

___

### `Optional` min

• **min**? : *undefined | number*

*Defined in [interfaces.ts:37](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/ts-transforms/src/interfaces.ts#L37)*

___

### `Optional` mutate

• **mutate**? : *undefined | false | true*

*Defined in [interfaces.ts:31](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/ts-transforms/src/interfaces.ts#L31)*

___

### `Optional` other_match_required

• **other_match_required**? : *undefined | false | true*

*Defined in [interfaces.ts:32](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/ts-transforms/src/interfaces.ts#L32)*

___

### `Optional` output

• **output**? : *undefined | false | true*

*Defined in [interfaces.ts:42](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/ts-transforms/src/interfaces.ts#L42)*

___

### `Optional` post_process

• **post_process**? : *undefined | string*

*Defined in [interfaces.ts:30](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/ts-transforms/src/interfaces.ts#L30)*

___

### `Optional` preserve_colons

• **preserve_colons**? : *undefined | false | true*

*Defined in [interfaces.ts:39](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/ts-transforms/src/interfaces.ts#L39)*

___

### `Optional` regex

• **regex**? : *undefined | string*

*Defined in [interfaces.ts:26](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/ts-transforms/src/interfaces.ts#L26)*

___

### `Optional` selector

• **selector**? : *undefined | string*

*Defined in [interfaces.ts:16](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/ts-transforms/src/interfaces.ts#L16)*

___

### `Optional` source_field

• **source_field**? : *undefined | string*

*Defined in [interfaces.ts:17](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/ts-transforms/src/interfaces.ts#L17)*

___

### `Optional` source_fields

• **source_fields**? : *string[]*

*Defined in [interfaces.ts:18](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/ts-transforms/src/interfaces.ts#L18)*

___

### `Optional` start

• **start**? : *undefined | string*

*Defined in [interfaces.ts:24](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/ts-transforms/src/interfaces.ts#L24)*

___

### `Optional` tags

• **tags**? : *string[]*

*Defined in [interfaces.ts:22](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/ts-transforms/src/interfaces.ts#L22)*

___

### `Optional` target_field

• **target_field**? : *undefined | string*

*Defined in [interfaces.ts:19](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/ts-transforms/src/interfaces.ts#L19)*

___

### `Optional` validation

• **validation**? : *undefined | string*

*Defined in [interfaces.ts:28](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/ts-transforms/src/interfaces.ts#L28)*

___

### `Optional` value

• **value**? : *any*

*Defined in [interfaces.ts:41](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/ts-transforms/src/interfaces.ts#L41)*

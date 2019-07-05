---
title: Job Components: `Slice`
sidebar_label: Slice
---

# Interface: Slice

A trackable set of work to be preformed by a "Worker"

## Hierarchy

* **Slice**

### Index

#### Properties

* [_created](slice.md#_created)
* [request](slice.md#request)
* [slice_id](slice.md#slice_id)
* [slicer_id](slice.md#slicer_id)
* [slicer_order](slice.md#slicer_order)

## Properties

###  _created

• **_created**: *string*

*Defined in [interfaces/operations.ts:61](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/operations.ts#L61)*

___

###  request

• **request**: *[SliceRequest](slicerequest.md)*

*Defined in [interfaces/operations.ts:60](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/operations.ts#L60)*

___

###  slice_id

• **slice_id**: *string*

*Defined in [interfaces/operations.ts:51](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/operations.ts#L51)*

A unique identifier for the slice

___

###  slicer_id

• **slicer_id**: *number*

*Defined in [interfaces/operations.ts:55](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/operations.ts#L55)*

A reference to the slicer that created the slice.

___

###  slicer_order

• **slicer_order**: *number*

*Defined in [interfaces/operations.ts:59](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/operations.ts#L59)*

A reference to the slicer


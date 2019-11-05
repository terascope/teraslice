---
title: Job Components: `SliceRequest`
sidebar_label: SliceRequest
---

# Interface: SliceRequest

The metadata created by the Slicer and ran through a job pipeline

See [Slice](slice.md)

## Hierarchy

* **SliceRequest**

## Indexable

* \[ **prop**: *string*\]: any

The slice request can contain any metdata

See [Slice](slice.md)

## Index

### Properties

* [request_worker](slicerequest.md#optional-request_worker)

## Properties

### `Optional` request_worker

• **request_worker**? : *undefined | string*

*Defined in [interfaces/operations.ts:58](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/operations.ts#L58)*

A reserved key for sending work to a particular worker

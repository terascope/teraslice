---
title: Operations Overview
sidebar_label: Overview
---

> Operations within [Teraslice Job](../overview.md) are designed to read, transform, write, or monitor data within a Teraslice job.

## Types

There are a few different operation types:

## Reader

A `Reader` is a required components of a Job and is in-charge of distributing and reading partitions of data across many nodes. A `Reader` has two main components, a [Slicer](#slicer) and a [Fetcher](#fetcher).

To develop a reader, see the [docs](./development.md#reader).

### Slicer

A `Slicer` runs on the [Execution Controller](../../nodes/execution-controller.md) and its primary function to create [Slice Requests](../../packages/job-components/api/interfaces/slicerequest.md) which will wrapped into [Slices](../../packages/job-components/api/interfaces/slice.md) and dispatched to [Workers](../../nodes/worker.md).

### Fetcher

A `Fetcher` runs on a [Worker](../../nodes/worker.md) and its primary process slices[Slices](../../packages/job-components/api/interfaces/slice.md). When processing a `Slice` the worker will use [Slice Request](../../packages/job-components/api/interfaces/slicerequest.md) to read a set of data from its data source. The fetcher will then return the data through the pipeline.

## Processor

A Job is required to contain a least one Processor. The duty of a processor is it transform or write data to external service.

To develop a processor, see the [docs](./development.md#processor).

## API

A Job can specify an Operation API which can expose an utility API, a [Dead Letter Queue](./lifecycle.md#dead-letter-queue) or can be used to monitor/track data going through the pipeline. APIs are [configured](./configuration.md#operation-apis-configuration) separately and are attached to the [Operation Lifecycle](./lifecycle.md#worker) on startup. APIs are only available to the [Worker](../../nodes/worker.md).

To develop a processor, see the [docs](./development.md#api).

### Operation API

This type of API that exposes to functionality to other processors within a job. A [Dead Letter Queue](./lifecycle.md#dead-letter-queue) is a type of `Operation API`.

### Observer

This type of API only monitors/tracks data and processors.

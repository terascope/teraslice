---
title: Types of Operations
---

> Operations within [Teraslice Job](./overview.md) are designed to read, transform, write, or monitor data within a Teraslice job.

## Readers

A `Reader` is the first operation specificed on the job and has two main components, a a [Slicer](#slicers) and a [Fetcher](#fetchers). The purpose of a Reader to distribute and read partitions of data across one or more [Workers](../nodes/worker.md).

To develop a reader, see the [docs](./development.md#reader).

## Slicers

A `Slicer` runs on the [Execution Controller](../nodes/execution-controller.md) and its primary function to create [Slice Requests](../packages/job-components/api/interfaces/slicerequest.md) which will wrapped into [Slices](../packages/job-components/api/interfaces/slice.md) and dispatched to [Workers](../nodes/worker.md).

### Slicer

The simpiliest varient of a "Slicer" that only handles on running "Slicer".

Check out the [API docs](../packages/job-components/api/classes/slicer.md) for more details.

### Parallel Slicer

A varient of a "Slicer" for running a parallel stream of slicers. The number of slicers can be configured via the "slicers" configuration on the [Job Configuration](./configuration.md#job-configuration).

Check out the [API docs](../packages/job-components/api/classes/parallelslicer.md) for more details.

## Fetchers

A `Fetcher` runs on a [Worker](../nodes/worker.md) and its primary process [Slices](../packages/job-components/api/interfaces/slice.md). When processing a `Slice` the worker will use [Slice Request](../packages/job-components/api/interfaces/slicerequest.md) to read a set of data from its data source. The fetcher will then return the data through the pipeline.

## Processors

A Job is required to contain a least one Processor. The duty of a processor is it transform or write data to external service.

To develop a processor, see the [docs](./development.md#processor).

### BatchProcessor

A variation of "Processor" that deals with a batch of data at a time.

Check out the [API docs](../packages/job-components/api/classes/batchprocessor.md) for more details.

### EachProcessor

A variation of Processor that can process a single DataEntity at a time. This processor should have zero side-effects on the data.

Check out the [API docs](../packages/job-components/api/classes/batchprocessor.md) for more details.

## APIs

A Job can specify an Operation API which can expose an utility API, a [Dead Letter Queue](./dead-letter-queue.md) or can be used to monitor/track data going through the pipeline. APIs are [configured](./configuration.md#apis) separately and are attached to the [Operation Lifecycle](./worker-lifecycle.md) on startup. APIs are only available to the [Worker](../nodes/worker.md).

To develop a processor, see the [docs](./development.md#api).

### Operation API

This type of API that exposes to functionality to other processors within a job. A [Dead Letter Queue](./dead-letter-queue.md) is a type of `Operation API`.

### Observer

This type of API only monitors/tracks data and processors.

---
title: Teraslice Terminology
sidebar_label: Terminology
---

## Asset Bundle
Asset Bundles are the mechanism used to deploy processors and other components into a Teraslice cluster. Each asset bundle may contain multiple processors, all code dependencies and things like small lookup tables or other smaller sets of data. The commponents from the asset bundle can then be included in a job by adding a reference to the asset bundle in the `assets` array on the job.

## Cluster Master
The Cluster Master coordinates the deployment and management of jobs into a Teraslice cluster. It also provides APIs to access information about currently running jobs, the assets deployed on the cluster and historical information about jobs and executions.

In native clustering it is an active participant in the cluster and holds active connections to all Node Masters in the cluster. For the cluster to be operational the Cluster Master must be available.

In Kubernetes clustering the Cluster Master manages the jobs but has a more advisory role and jobs will continue to execute even if the Cluster Master is offline. You simply lose access to the APIs that the Cluster Master provides.

## CLI

The Teraslice CLI is a command line tool `teraslice-cli` that can be used to manage Teraslice clusters. The tool uses cluster aliases to enable management of many separate Teraslice clusters using consistent commands. 

Using this tool you can retrieve information on jobs, executions, assets, nodes, workers and running jobs. You can also schedule and control job executions.

## Data Entity

A Data Entity represents a single piece of data to be processed by the system. It allows tracking metadata about the data such as keys and various timestamps as well as allowing the end user to define their own metadata that's carried with the record.

## Earl - Teraslice CLI

Earl is just a friendly name for the `teraslice-cli` command line tool. When the CLI is deployed you can run commands using either `teraslice-cli` or the command `earl`.

## Execution Context

An Execution Context represents an instance of a running job on a cluster. Each execution of a job will result in a new Execution Context being created for the job. The context will be active for the entire duration of the job's execution with the metadata and analytics preserved after the job completes.

## Execution Controller

An Execution Contoller is the process that manages the distribution of work to workers for a running a job. It runs the Slicer for the job which generates work slices that are then handed out to workers. Each job execution will have a new Execution Controller. 

The Cluster Master provides APIs to retrieve information about all running Execution Controllers on a cluster.

## Execution State

As a Job executes each Slice has a state record created and stored in Opensearch. This state record provides information for the worker to retrieve the data, serves as a record of whether or not the slice was successfully processed and will contain any errors related to Slice failures. This information is stored even after an Execution has ended so you can look at a historical record of Slice states.

## Fetcher

The Fetcher is the component of a Reader that runs in a worker to retrieve data from a data source.

## Job

A Job in Teraslice defines the work to be done on a set of data. It pulls together assets, a processing pipeline and the execution configuration as a single JSON file that represents the work to preform.

The Job itself is not the unit of execution but serves as a template for the creation of the Execution Contexts that get scheduled on the cluster. This allows the same Job definition to be run many times or to stop and start throughout time.

## Job - Once - Batch Processing

A Once Job is a job that runs through to completion and then stops. This would be used for something like copying an Opensearch index from one cluster to another. 

Not every Reader will support Once Jobs.

## Job - Persistent - Stream Processing

A Persistent Job is a job the runs continuously without ending. It can be explicitly stopped but otherwise will just continue to run. This provides a Stream Processing model that can be used to continuously process something like a Kafka topic.

## Job Component

A Job Component is a JavaScript object that is used by a job to perform some operation. These come in various forms including Slicers, Processors, Fetchers and APIs.

## Job Execution Analytics

As a Job runs the system tracks analytics about the Processors that the jobs uses. This includes the number of records processed, the time consumed and memory usage. These analytics records are stored in Opensearch and can be monitored in real time. They will also exist after a Job has been stopped so that it's performance can be evaluated at any time.

## Kubernetes Clustering

Kubernetes is the recommended production clustering environment for running Teraslice. It provides worker management and scheduling, resource contraints, as well as

## Native Clustering

Native Clustering is the built in clustering mechanism in Teraslice. It's suitable for single node or small, less critical, multi-node deployments. In general though for production deployment it is strongly recommended to use Kubernetes.

## Node

In Native Clustering a Node is a computer that provides Worker resources to the cluster.

## Node Master

In Native Clustering the Node Master runs on each Node and communicates with the Cluster Master to schedule and manage Workers. It is not needed in Kubernetes.

## Operations Pipeline

In Job the Operations Pipeline defines the set of Processors that will be applied to the data and their order of execution. It is in the job as the `operations` attribute.

## Processor

A Processor is a Job Component that takes in data, performs some operation and returns data. There are different types of Processors and in general they're just JavaScript code so anything that can be done in JavaScript can be done inside a processor.

## Processor - Batch

A Batch Processor takes in an array of data and returns an array of data. This allows the processor to work on the entire slice of data at once.

## Processor - Per Record

There are several variations on Per Record Processors: Each, Map, Filter with the one common attribute that they all take a single Data Entity as input.

## Reader

A Reader bundles together a Slicer with a Fetcher to provide a Job Component that can be used to process data from a data source. It's configured as a single component on the Job.

The details of how a Reader works will vary widely depending on the data source and the data processing approach the reader wants to provide. This means it's possible to have multiple readers for the same data source using different algorithms. For example there is an Opensearch reader that uses a date slicing algorithm as well as one that uses a string key slicing algorithm.

Custom Reader's can implement whatever approach makes sense for a particular need.

## Slicer

A Slicer is the component of a Reader that is responsible for dividing the work into chunks or Slices as they're called in Teraslice. Exactly how it does this is up to the particular Slicer implementation. Once the Slicer has determined a Slice then the Slice can be handed to a Worker for processing. 

For a Slicer to be effective and drive parallelism in processing the data it needs to be able to determine slices without looking at the actual data. This is generally accomplished using operations that provide record counts via search or byte offsets that become the unit of slicing. 

## Slice

A Slice is the unit of work in Teraslice. The Slicer determines the slices that are processed by the Workers. The exact content of each slice will be dependent on the algorithm used by the Slicer. 

## State Cluster

The Teraslice State Cluster is the underlying Opensearch cluster that is used by the system to store all metadata for Jobs, Executions, Assets and Analytics used by the cluster. 

## Test Harness

The Teraslice Test Harness is used by Asset Bundles to simplify creating automated test suites for Job Components.

## TJM - Teraslice Job Manager

TJM is a set of commands included in the Teraslice CLI that is designed to help Data Engineers manage the jobs they create. 

It uses the Job's JSON file to store metadata about the deployment of the job. This allows the Job file to be committed to Git with information about what is running and where it is running. The TJM commands then allow management of the job by using the Job file without having to pay attention to details like which cluster it's running on and the specific Execution ID. This originated for complex environments where there are multiple Teraslice clusters but has proven to be generally useful even if just running jobs on a laptop.

## Worker

A Teraslice Worker is the process that retrieves data and sends it through the Operations pipeline. A job can have hundreds or thousands of workers all working away at a dataset in parallel. 

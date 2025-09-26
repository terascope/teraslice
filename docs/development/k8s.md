---
title: Kubernetes
---

> Teraslice Kubernetes End-to-End Test Suite and Development Environment

## Dependencies

- Docker
- [Kubectl](https://kubernetes.io/docs/reference/kubectl/)
    - `brew install kubectl`
- [Kind](https://kind.sigs.k8s.io/) - Kubernetes in Docker
    - `brew install kind`
- `teraslice-cli` (aka `earl`)
    - `npm i -g teraslice-cli`

## General Notes

The `ts-scripts` package provides a set of tools for working with Teraslice in
Kubernetes.  These tools are available via `yarn run` or by using the
`ts-scripts` script directly.  It supports the following functionality:

- Running End-to-End Testing
- Launching a Development Kubernetes Environment
- Manages required and optional services.  (e.g. Elasticsearch, Kafka)

## Kubernetes End-to-End Tests

The Kubernetes End-to-End tests can be run with the commands shown below.  The
following things will happen:

- Launch a Kubernetes cluster in your local Docker instance using Kind
- Launch the services required for tests in Kind
- Build a Teraslice Docker image from the current working directory
- Copy image into Kind and run Teraslice master

NOTE: These `yarn` commands must be run from the `e2e` subdirectory:

```bash
# change into the e2e subdirectory
cd e2e
# use the default version of nodejs
yarn test:k8sV2
# test against a specific version of nodejs
NODE_VERSION=18.18.2 yarn test:k8sV2
# run the tests using an existing dev Teraslice image (handy for working on
# ts-scripts)
yarn test:k8sV2NoBuild
```

Some of the Kubernetes End-to-End tests are shared with the standard End-to-End
tests.

## Kubernetes Development Environment

You can launch Teraslice using Kind in Docker locally and start a Teraslice
job with the following commands (NOTE: `earl` is an alternative name for the
`teraslice-cli`).

```bash
# build teraslice from local repository and launch teraslice and elasticsearch
# from the teraslice root directory:
yarn k8s

# from any other directory:
TEST_ELASTICSEARCH='true' ELASTICSEARCH_PORT='9200' yarn run ts-scripts k8s-env
```

```bash
# launch with a specific OPENSEARCH_VERSION or ELASTICSEARCH_VERSION; defaults to Opensearch 2.15.0
# from the teraslice root directory:
OPENSEARCH_VERSION='3.0.0' yarn k8s

# from any other directory:
ELASTICSEARCH_VERSION=7.9.3 TEST_ELASTICSEARCH=true ELASTICSEARCH_PORT=9200 yarn run ts-scripts k8s-env
```

If you want to run a specific teraslice docker image, instead of building from your local repository:

```bash
# from the teraslice root directory:
yarn k8s --teraslice-image=terascope/teraslice:v0.91.0-nodev18.18.2

# from any other directory:
TEST_ELASTICSEARCH=\'true\' ELASTICSEARCH_PORT=\'9200\' $0 k8s-env --teraslice-image=terascope/teraslice:v0.91.0-nodev18.18.2
```

If you want to run additional services you must set the appropriate environmental variables. Currently only minio, elasticsearch and kafka are supported (see issue [#3530](https://github.com/terascope/teraslice/issues/3530)).

```bash
# from the teraslice root directory:
yarn k8s:kafka

# from any other directory:
TEST_ELASTICSEARCH=true ELASTICSEARCH_PORT=9200 TEST_KAFKA=true KAFKA_PORT=9092 ts-scripts k8s-env
```

After about 5 minutes, Teraslice will be running and listening on port `5678`
and elasticsearch will be running on `9200`.  You can configure an `alias`
called `local` as follows.

```bash
earl aliases add local http://localhost:5678
```

### Launching a Teraslice Job

After setting up a `local` alias, you can prepare and launch an example
Teraslice job.  First you must upload the assets your job will use, for the
sample job we plan to run we will use the `elasticsearch-assets` and
`standard-assets`:

```bash
# deploy assets needed by job
earl assets deploy local --bundle terascope/elasticsearch-assets
earl assets deploy local --bundle terascope/standard-assets
```

Now you can register the Teraslice job

```bash
earl tjm register local examples/jobs/data_generator.json
```

Now check to see if the Teraslice job is registered:

```bash
curl localhost:5678/txt/jobs

job_id                                name            active  lifecycle   slicers  workers  _created                  _updated
------------------------------------  --------------  ------  ----------  -------  -------  ------------------------  ------------------------
e4e2169d-6d66-4cfc-b4c3-f9cb8511cd8d  Data Generator  N/A     persistent  N/A      1        2023-12-05T23:31:58.417Z  2023-12-05T23:31:58.417Z
```

Now we can start the Teraslice job:

```bash
# start test job
earl tjm start examples/jobs/data_generator.json
```

And check to see if there's a new Execution:

```bash
curl localhost:5678/txt/ex

name            lifecycle   slicers  workers  _status  ex_id                                 job_id                                _created                  _updated
--------------  ----------  -------  -------  -------  ------------------------------------  ------------------------------------  ------------------------  ------------------------
Data Generator  persistent  1        1        running  3c04f3b6-8430-478b-835e-b085110eec94  e4e2169d-6d66-4cfc-b4c3-f9cb8511cd8d  2023-12-05T23:36:12.852Z  2023-12-05T23:36:35.242Z
```

### Inspecting the Kubernetes Resources

First off, there are two primary tools for interacting with Kubernetes and Kind:

- `kubectl` - interacting with Kubernetes on the command line
- `kind` - manages the KIND Kubernetes cluster

Both of these need to be installed for anything to work.

When we launched the cluster, we create two Kubernetes Namespaces, which you can
see below:

```bash
kubectl get namespaces | grep dev1
services-dev1        Active   12m
ts-dev1              Active   5m12s
```

these namespaces have the following roles:

- `services-dev1` - supporting services like Elasticsearch or Kafka run here
- `ts-dev1` - The teraslice Master and job components will run in here

You can see the Elasticsearch Kubernetes Pod and associated resources like this,
other supporting services would appear here too if they were running.  In the
example below we see there is only an Elasticsearch Pod:

```text
kubectl -n services-dev1 get all

NAME                                 READY   STATUS    RESTARTS   AGE
pod/elasticsearch-56b7b58bc8-rttf9   1/1     Running   0          23h

NAME                    TYPE       CLUSTER-IP     EXTERNAL-IP   PORT(S)          AGE
service/elasticsearch   NodePort   10.96.85.233   <none>        9200:30200/TCP   23h

NAME                            READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/elasticsearch   1/1     1            1           23h

NAME                                       DESIRED   CURRENT   READY   AGE
replicaset.apps/elasticsearch-56b7b58bc8   1         1         1       23h
```

You can see the Teraslice master and any running job related resources like
this:

```text
kubectl -n ts-dev1 get all

NAME                                                       READY   STATUS    RESTARTS   AGE
pod/teraslice-master-84d4c87c7b-rz85x                      1/1     Running   0          23h
pod/ts-exc-data-generator-e4e2169d-6d66-cpk5c              1/1     Running   0          9m54s
pod/ts-wkr-data-generator-e4e2169d-6d66-775544794b-vlq65   1/1     Running   0          9m52s

NAME                       TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
service/teraslice-master   NodePort   10.96.191.171   <none>        5678:30678/TCP   23h

NAME                                                  READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/teraslice-master                      1/1     1            1           23h
deployment.apps/ts-wkr-data-generator-e4e2169d-6d66   1/1     1            1           9m52s

NAME                                                             DESIRED   CURRENT   READY   AGE
replicaset.apps/teraslice-master-84d4c87c7b                      1         1         1       23h
replicaset.apps/ts-wkr-data-generator-e4e2169d-6d66-775544794b   1         1         1       9m52s

NAME                                            COMPLETIONS   DURATION   AGE
job.batch/ts-exc-data-generator-e4e2169d-6d66   0/1           9m54s      9m54s
```

One important fact about Teraslice jobs running in Kubernetes is that the
Kubernetes resources that are part of a job all have a set of Kubernetes Labels
attached to them.  For instance all of the resources for the Teraslice Job with
`jobId`: `e4e2169d-6d66-4cfc-b4c3-f9cb8511cd8d` can be viewed with `kubectl` by
adding the label selector `-l` and supplying the right key value pair for the
label as shown below using the `jobId` above

```bash
kubectl -n ts-dev1 get all -l teraslice.terascope.io/jobId=e4e2169d-6d66-4cfc-b4c3-f9cb8511cd8d
```

However, in most instances, we use the `exId`: `3c04f3b6-8430-478b-835e-b085110eec94`
to interact with a Teraslice job, since it is more specific.  For example,
showing all of the resources related to the `exId` above with the following
command:

```bash
kubectl -n ts-dev1 get all -l teraslice.terascope.io/exId=3c04f3b6-8430-478b-835e-b085110eec94
```

results in the following output:

```text
NAME                                                       READY   STATUS    RESTARTS   AGE
pod/ts-exc-data-generator-e4e2169d-6d66-cpk5c              1/1     Running   0          23m
pod/ts-wkr-data-generator-e4e2169d-6d66-775544794b-vlq65   1/1     Running   0          23m

NAME                                                  READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/ts-wkr-data-generator-e4e2169d-6d66   1/1     1            1           23m

NAME                                                             DESIRED   CURRENT   READY   AGE
replicaset.apps/ts-wkr-data-generator-e4e2169d-6d66-775544794b   1         1         1       23m

NAME                                            COMPLETIONS   DURATION   AGE
job.batch/ts-exc-data-generator-e4e2169d-6d66   0/1           23m        23m
```

In Kubernetes, the resource that actually references the running containers is
called a Pod, you can view the log output from that container with the following
command, you just have to specify the name of the pod you're interested in.  For
example to get and follow the logs for the Teraslice worker listed above you
would run the following command:

```bash
kubectl -n ts-dev1 logs -f ts-wkr-data-generator-e4e2169d-6d66-775544794b-vlq65  | bunyan
```

You can look at the master pod logs with this command:

```bash
kubectl -n ts-dev1 logs -f teraslice-master-84d4c87c7b-rz85x | bunyan
```

You could delete the Teraslice worker pod with the following command:

```bash
kubectl -n ts-dev1 delete pod  ts-wkr-data-generator-e4e2169d-6d66-775544794b-vlq65
pod "ts-wkr-data-generator-e4e2169d-6d66-775544794b-vlq65" deleted
```

Note that in this particular case, that pod will automatically be recreated by
it's parent ReplicaSet.  In most cases, you should use the Teraslice API to
interact with the Teraslice job and only fall back to directly using `kubectl`
when problems arise.

When you're done, don't forget to stop the Teraslice job:

```bash
# stop the test job
earl tjm stop examples/jobs/data_generator.json
```

### Cleanup or Rebuild

When you're done and want to clean everything up, you can delete it all with a
single Kind command and reset the modified job file as follows:

```bash
kind delete cluster -n k8s-env
git checkout examples/jobs/data_generator.json
```

If you are iterating on development changes to Teraslice itself and need to
rebuild and redeploy the Teraslice master, you can use the following command:

NOTE: this does not reset state in the elasticsearch store

```bash
# from the teraslice root directory:
yarn k8s:rebuild

# from any other directory:
yarn run ts-scripts k8s-env --rebuild
```

If you would like to reset the elasticsearch store at the same time:

```bash
# from the teraslice root directory:
yarn k8s:rebuild --reset-store

# from any other directory:
yarn run ts-scripts k8s-env --rebuild --reset-store
```

If you need to restart Teraslice without rebuilding you can use the following command:

NOTE: this does not reset state in the elasticsearch store

```bash
# from the teraslice root directory:
yarn k8s:restart

# from any other directory:
yarn run ts-scripts k8s-env --rebuild --skip-build
```

If you would like to reset the elasticsearch store at the same time:

```bash
# from the teraslice root directory:
yarn k8s:restart --reset-store

# from any other directory:
yarn run ts-scripts k8s-env --rebuild --skip-build --reset-store
```

## Prometheus Metrics API

The `PromMetrics` class lives within `packages/terafoundation/src/api/prom-metrics` package. Use of its API can be enabled using `prom_metrics_enabled` in the terafoundation config and overwritten in the job config. The `init` function can be found at `context.apis.foundation.promMetrics.init`. It is called on startup of the Teraslice master, execution_controller, and worker, but only creates the API if `prom_metrics_enabled` is true.

### Functions


| Name             | Description                                                                                                                             | Type                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| init | initialize the API and create exporter server | `(config: PromMetricsInitConfig) => Promise<boolean>` |
| set | set the value of a gauge | `(name: string, labels: Record<string, string>, value: number) => void` |
| inc | increment the value of a counter or gauge | `(name: string, labelValues: Record<string, string>, value: number) => void` |
| dec | decrement the value of a gauge | `(name: string, labelValues: Record<string, string>, value: number) => void` |
| observe | observe a histogram or summary | `(name: string, labelValues: Record<string, string>, value: number) => void` |
| addGauge | add a gauge metric | `(name: string, help: string, labelNames: Array<string>, collectFn?: CollectFunction<Gauge>) => Promise<void>` |
| addCounter | add a counter metric | `(name: string, help: string, labelNames: Array<string>, collectFn?: CollectFunction<Counter>) => Promise<void>` |
| addHistogram | add a histogram metric | `(name: string, help: string, labelNames: Array<string>, collectFn?: CollectFunction<Histogram>, buckets?: Array<number>) => Promise<void>` |
| addSummary | add a summary metric | `(name: string, help: string, labelNames: Array<string>,       collectFn?: CollectFunction<Summary>, maxAgeSeconds?: number, ageBuckets?: number, percentiles?: Array<number>) => Promise<void>` |
| hasMetric | check if a metric exists | `(name: string) => boolean` |
| deleteMetric | delete a metric from the metric list | `(name: string) => Promise<boolean>` |
| verifyAPI | verfiy that the API is running | `() => boolean` |
| resetMetrics | reset the values of all metrics | `() => void` |
| shutdown | disable API and shutdown exporter server | `() => Promise<void>` |
| getDefaultLabels | retrieve the default labels set at init | `() => Record<string, string>` |

Example init:
```typescript
await config.context.apis.foundation.promMetrics.init({
    terasliceName: context.sysconfig.teraslice.name,
    assignment: 'execution_controller',
    logger: this.logger,
    tf_prom_metrics_add_default: terafoundation.prom_metrics_add_default,
    tf_prom_metrics_enabled: terafoundation.prom_metrics_enabled,
    tf_prom_metrics_port: terafoundation.prom_metrics_port,
    job_prom_metrics_add_default: config.executionConfig.prom_metrics_add_default, // optional job override
    job_prom_metrics_enabled: config.executionConfig.prom_metrics_enabled, // optional job override
    job_prom_metrics_port: config.executionConfig.prom_metrics_port, // optional job override
    labels: { // optional default labels on all metrics for this teraslice process
        ex_id: this.exId,
        job_id: this.jobId,
        job_name: this.config.name,
        assignment: 'execution_controller',
    }
});
```

Once initialized all of the other functions under `context.apis.foundation.promMetrics` will be enabled. Any calls to promMetricsAPI functions should be wrapped in a check using the `job-components` utility function `isPromAvailable()`.

Example Counter:
```typescript
if (isPromAvailable(this.context)) {
    await this.context.apis.foundation.promMetrics.addCounter(
        'slices_dispatched', // name
        'number of slices a slicer has dispatched', // help or description
        ['class'], // label names specific to this metric
    );
    // now we can increment the counter anywhere else in the code
    this.context.apis.foundation.promMetrics.inc(
        'slices_dispatched', // name
        { class: 'ExecutionController' }, // label names and values
        1 // amount to increment by
    );
}
```

Example Gauge using collect() callback:
```typescript
const self = this;
if (isPromAvailable(this.context)) {
    await this.context.apis.foundation.promMetrics.addGauge(
        'slices_dispatched', // name
        'number of slices a slicer has dispatched', // help or description
        ['class'], // label names specific to this metric
        function collect() { // callback fn updates value only when '/metrics' endpoint is hit
            const slicesFinished = self.getSlicesDispatched(); // get current value from local momory
            const labels = { // 'set()' needs both default labels and labels specific to metric to match the correct gauge
                ...self.context.apis.foundation.promMetrics.getDefaultLabels(),
                class: 'SlicerExecutionContext'
            };
            this.set(labels, slicesFinished); // 'this' refers to the Gauge
        }
    );
}
```

The label names as well as the metric name must match when using `inc`, `dec`, `set`, or `observe` to modify a metric.

## Extras

### Teraslice Kubernetes Job Structure

A Teraslice job in Kubernetes is comprised of the following Kubernetes
resources:

![Teraslice Kubernetes Job Structure](/assets/Teraslice-K8s-Job.png)

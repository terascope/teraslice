# Kubernetes Clustering

Teraslice supports the use of Kubernetes as a cluster manager.  The supported
versions of Kubernetes is:

* `1.10.*`

## Setup

You need Elasticsearch running and listening on a port accessible by the
Teraslice master and worker nodes.  In the case of minikube based deployments
(dev/test only) you'll need to make ES listen on your VirtualBox interface.  The
IP address of that interface is what you need to set as:

    `terafoundation.connectors.elasticsearch.default.host`

in both the `teraslice-master` and `teraslice-worker` ConfigMaps.

### ConfigMaps

For the ConfigMaps below, substitute your values for:

* `<ELASTICSEARCH_HOST>`
* `<ELASTICSEARCH_PORT>`

then add `teraslice-master` configmap:

```yaml
apiVersion: v1
data:
  processor-master-k8s.yaml: |
    terafoundation:
        environment: 'development'
        connectors:
            elasticsearch:
                default:
                    host:
                        - "<ELASTICSEARCH_HOST>:<ELASTICSEARCH_PORT>"

    teraslice:
        ops_directory: '/app/source/examples/ops/'
        cluster_manager_type: 'kubernetes'
        master: true
        master_hostname: "127.0.0.1"
        name: "teracluster"
kind: ConfigMap
```

and then add `teraslice-worker` ConfigMap:

```yaml
apiVersion: v1
data:
  teraslice-worker.yml: |+
    terafoundation:
        environment: 'development'
        connectors:
            elasticsearch:
                default:
                    host:
                        - "<ELASTICSEARCH_HOST>:<ELASTICSEARCH_PORT>"
    teraslice:
        ops_directory: '/app/source/examples/ops/'
        cluster_manager_type: kubernetes
        master: false
        master_hostname: "teraslice-master"
        name: "teracluster"
kind: ConfigMap
```

FIXME: The secret name is hardcoded somewhere as `docker-tera1-secret`, this
should probably be a more sensible default that could be overridden in the
config files.  I will leave this as a TODO

```bash
kubectl create secret docker-registry docker-tera1-secret \
    --docker-server=<DOCKER_HOST> \
    --docker-username=<DOCKER_USER> \
    --docker-password=<DOCKER_PASS> \
    --docker-email=<DOCKER_EMAIL>
```
# Makefile

There is a Makefile I use to help bootstrap Teraslice and do repetitive tasks,
it has the following targets:

```
help:  show target summary
show:  show k8s deployments and services
destroy:  delete k8s deployments and services
logs:  show logs for k8s deployments and services
logsm:  show logs for k8s teraslice master
logss:  show logs for k8s teraslice slicers
logsw:  show logs for k8s teraslice workers
submit:  submit test job
k8s-master:  start teraslice master in k8s
build:  build the teraslice:k8sdev container
```

The standard workflow is:

```
cd examples/k8s
make k8s-master
make submit
make show
make destroy
```
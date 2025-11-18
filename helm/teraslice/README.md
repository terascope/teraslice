
# Teraslice Helm Chart

This Helm chart installs Teraslice with configurable prometheus rules, RBAC and other configurations. This chart caters a number of different use cases and setups.

- [Teraslice Helm Chart](#teraslice-helm-chart)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)

## Requirements

- Kubernetes >= 1.27
- Helm >= 3.15

## Installation

```bash
helm repo add terascope https://terascope.github.io/helm-charts
```

The easiest way to install teraslice with opensearch is to use the `helmfile` cli to bundle both of them with a simple configuration. Follow the "[Teraslice Chart Quickstart](https://terascope.github.io/teraslice/docs/getting-started.html) guide for further instructions.

## Configuration

View the `values.yaml` for charts configuration settings.

| Parameter                         | Description                                            | Default                   |
|-----------------------------------|--------------------------------------------------------|---------------------------|
| `replicaCount`                    | Number of replicas to run                             | `1`                       |
| `image.repository`                | Image repository for Teraslice                        | `ghcr.io/terascope/teraslice` |
| `image.pullPolicy`                | Image pull policy                                    | `IfNotPresent`            |
| `image.nodeVersion`               | Node version used in the image tag                   | `v22.13.0`                |
| `imagePullSecrets`                | Image pull secrets                                  | `[]`                      |
| `nameOverride`                    | Override for the chart name                          | `""`                      |
| `fullnameOverride`                | Override for the full chart name                     | `""`                      |
| `extraContainers`                 | Additional sidecar containers                        | `[]`                      |
| `env`                             | Environment variables for Teraslice master           | `{}`                      |
| `stateConnection`                 | Teraslice Elasticsearch/Opensearch state connection                          | `default`                 |
| `priorityClass.create`            | Whether to create a priority class                  | `false`                   |
| `priorityClass.preemptionPolicy`  | Preemption policy for the priority class            | `Never`                   |
| `priorityClass.value`             | Priority class value                                | `9999`                    |
| `master.teraslice.assets_directory` | Directory for assets in the master pod              | `/app/assets`             |
| `master.teraslice.workers`        | Number of worker processes in master pod            | `0`                       |
| `worker.teraslice.assets_directory` | Directory for assets in the worker pod              | `/app/assets`             |
| `terafoundation.log_level`        | Logging level                                       | `info`                    |
| `terafoundation.prom_metrics_enabled` | Enable internal Prometheus metrics                  | `false`                   |
| `terafoundation.prom_metrics_port` | Prometheus metrics port                            | `3333`                    |
| `terafoundation.prom_metrics_add_default` | Add default Prometheus metrics                    | `true`                    |
| `terafoundation.connectors`       | Connector configurations for teraslice. Read docs [here](https://terascope.github.io/teraslice/docs/configuration/overview) for more information  | `{}`                      |
| `terafoundation.stats`            | Statistics configuration                           | `{}`                      |
| `serviceAccount.create`           | Whether to create a service account                | `true`                    |
| `serviceAccount.annotations`      | Annotations for the service account                | `{}`                      |
| `serviceAccount.name`             | Name of the service account                        | `""`                      |
| `podSecurityContext`              | Security context for pods                          | `{}`                      |
| `securityContext`                 | Security context for containers                    | `{}`                      |
| `strategyType`                    | Deployment strategy type                           | `Recreate`                |
| `service.type`                    | Service type                                      | `ClusterIP`               |
| `service.port`                    | Service port                                      | `5678`                    |
| `service.annotations`             | Annotations for the service                       | `{}`                      |
| `service.labels`                  | Labels for the service                            | `{}`                      |
| `service.nodePort`                | Node port (if applicable). Must set `service.type` to `NodePort`       | `null`                    |
| `ingress.enabled`                 | Enable ingress                                    | `false`                   |
| `ingress.className`               | Ingress class name                                | `""`                      |
| `ingress.annotations`             | Ingress annotations                              | `{}`                      |
| `ingress.hosts[0].host`           | Ingress hostname                                 | `teraslice.local`         |
| `ingress.hosts[0].paths[0].path`  | Ingress path                                     | `/`                       |
| `ingress.hosts[0].paths[0].pathType` | Path type                                      | `ImplementationSpecific`  |
| `ingress.tls`                     | TLS configuration for ingress                    | `[]`                      |
| `resources`                       | Resource limits and requests                     | `{}`                      |
| `nodeSelector`                    | Node selector configuration                      | `{}`                      |
| `tolerations`                     | Tolerations for scheduling                       | `[]`                      |
| `affinity`                        | Affinity rules for scheduling                    | `{}`                      |
| `persistence.enabled`             | Enable persistent storage                        | `false`                   |
| `persistence.size`                | Storage size                                     | `20Gi`                    |
| `persistence.accessModes`         | Storage access modes                            | `["ReadWriteMany"]`       |
| `extraVolumes`                    | Additional volumes                              | `[]`                      |
| `extraVolumeMounts`               | Additional volume mounts                        | `[]`                      |
| `serviceMonitor.enabled`          | Enable Prometheus service monitor               | `false`                   |
| `serviceMonitor.interval`         | Scrape interval                                | `60s`                     |
| `serviceMonitor.metricRelabelings` | Metric relabeling rules                        | `[]`                      |
| `serviceMonitor.relabelings`      | Relabeling rules                               | `[]`                      |
| `serviceMonitor.rules`            | Prometheus alerting rules                      | `null`                    |
| `podMonitor.enabled`              | Enable Prometheus PodMonitor                    | `false`                   |
| `podMonitor.labels`               | Labels for PodMonitor                          | `{}`                      |
| `podMonitor.annotations`          | Annotations for PodMonitor                     | `{}`                      |
| `podMonitor.jobLabel`             | Job label for PodMonitor                       | `app.kubernetes.io/instance` |
| `podMonitor.interval`             | Scrape interval for PodMonitor                 | `60s`                     |
| `podMonitor.podTargetLabels`      | Target labels for PodMonitor                   | Look in [values.yaml](https://github.com/terascope/teraslice/blob/master/helm/teraslice/values.yaml)                   |
| `podMonitor.matchLabels`          | Match labels for PodMonitor                    | `{}`                      |
| `podMonitor.metricRelabelings`    | Metric relabeling rules for PodMonitor         | `[]`                      |
| `podMonitor.relabelings`          | Relabeling rules for PodMonitor                | `[]`                      |
| `prometheusRule.enabled`          | Enable Prometheus alerts                       | `false`                   |
| `prometheusRule.rules`            | Prometheus alerting rules                      | `[]`                      |
| `busybox.repository`              | Busybox image repository                       | `busybox`                 |
| `busybox.tag`                     | Busybox image tag                              | `latest`                  |
| `busybox.pullPolicy`              | Busybox image pull policy                      | `IfNotPresent`            |

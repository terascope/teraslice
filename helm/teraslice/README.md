
# Teraslice Helm Chart

This Helm chart installs Teraslice with configurable prometheus rules, RBAC and other configurations. This chart caters a number of different use cases and setups.

- [Teraslice Helm Chart](#teraslice-helm-chart)
- [Requirements](#requirements)
- [Installing with Opensearch](#installing-with-opensearch)
- [Configuration](#configuration)

## Requirements

- Kubernetes >= 1.27
- Helm >= 3.15

## Installing with Opensearch

```bash
helm repo add terascope https://terascope.github.io/teraslice/charts
```

The easiest way to install teraslice with opensearch is to use the `helmfile` cli to bundle both of them with a simple configuration. Follow the "[Teraslice Chart Quickstart](https://terascope.github.io/teraslice/charts) guide for further instructions. It's ideal to go there because updates to the `helmfile.yaml` are automated, ensuring the most up-to-date information.

## Configuration

View the `values.yaml` for charts configuration settings.

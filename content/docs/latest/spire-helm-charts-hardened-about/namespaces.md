---
title: Namespaces
short: Namespaces
description: Which namespaces to install the SPIRE Helm charts to
kind: spire-helm-charts-hardened-about
weight: 210
aliases:
    - /docs/latest/helm-charts-hardened/namespaces
---


## Namespace Creation Options

| Value                                 | Default Value | Description                                                                                  |
| ------------------------------------- | ------------- | -------------------------------------------------------------------------------------------- |
| global.spire.namespaces.create        | false         | Create both recommeded namespaces                                                            |
| global.spire.namespaces.server.create | false         | Create the namespace specified by global.spire.namespaces.server.name (default spire-server) |
| global.spire.namespaces.system.create | false         | Create the namespace specified by global.spire.namespaces.spire.name (default spire-server)  |

## Three Namespace Configuration

This is the recommended configuration, it automatically creates and deploys SPIRE across 3 namespaces.

your-values.yaml snippet:
```yaml
global:
  spire:
    recommendations:
      enabled: true
    namespaces:
      create: true
```

This will create `spire-server` and `spire-system` namespaces, label them
for proper Kubernetes Pod Security Standards operations, and deploy the various
services appropriately.

A third namespace is needed to house the Kubernetes Custom Resource Definitions
as provided by the [spire-crds](https://artifacthub.io/packages/helm/spiffe/spire-crds) chart, as well as any Release information helm
needs to store to manage the installation. This management namespace is specified
directly to helm when installing/upgrading the release. We used `spire-mgmt` as the namespace in the installation section.

## Two Namespace Configuration

In some cases, it's necessary to create the `spire-server` and/or `spire-system` namespaces outside the chart. For example if a different team is responsible for creating one of the namespaces. This section will cover deployments where some or all of the namespaces can't be managed by the SPIRE helm chart.

### Manual spire-server, Automatic spire-system

This is the next most recommended configuration.

Create the spire-server namespace as needed on your cluster. For example:
```shell
kubectl create namespace spire-server
kubectl label namespace spire-server pod-security.kubernetes.io/enforce=restricted
```

your-values.yaml snippet:
```yaml
global:
  spire:
    recommendations:
      enabled: true
    namespaces:
      system:
        create: true
```

Then run:
```shell
helm upgrade --install -n spire-server spire-crds spire-crds \
  --repo https://spiffe.github.io/helm-charts-hardened/

helm upgrade --install -n spire-server spire spire \
 --repo https://spiffe.github.io/helm-charts-hardened/ \
 -f your-values.yaml
```

## Single Namespace Configuration

This is only recommended for non production deployments as described in the [quick start.](/docs/latest/spire-helm-charts-hardened-about/installation/#quick-start)

{{< scarf/pixels/high-interest >}}

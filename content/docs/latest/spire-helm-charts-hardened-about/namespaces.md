---
title: Namespaces
short: Namespaces
description: Which namespaces to use to install the SPIRE Helm charts
kind: spire-helm-charts-hardened-about
weight: 210
aliases:
    - /docs/latest/helm-charts-hardened/namespaces
---

## 3 Namespace Configuration

This is the recommended configuration.

your-values.yaml snippet:
```yaml
global:
  spire:
    recommendations:
      enabled: true
    namespaces:
      create: true
```

This will create both the spire-server and spire system namespaces, label them
for proper Kubernetes Pod Security Standards operations and deploy the various
services appropriately.

A third namespace is needed to house the Kubernetes Custom Resource Definitions
as provided by the spire-crds chart, as well as any Release information helm
needs to store to manage the installation. This management namespace is specified
directly to helm when installing/upgrading the release.

## 2 Namespace Configuration

It is not possible to have the spire helm chart create and manage the labels of
the namespace in which it is directly installed into. On some clusters, its necessary
for the spire-server and/or spire-system namespaces to be created outside the chart
though.

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

## 1 Namespace Configuration

This is only recommended for non production deployments.

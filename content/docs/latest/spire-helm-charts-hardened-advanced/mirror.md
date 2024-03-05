---
title: Local Mirrors
short: Local Mirrors
description: How to setup a local mirror for SPIRE instances
kind: spire-helm-charts-hardened-advanced
weight: 200
aliases:
    - /docs/latest/helm-charts-hardened-architecture/mirror
---

## Identify Containers needing mirroring

Run:
```
helm template spire --repo https://spiffe.github.io/helm-charts-hardened/ -f your-values.yaml | yq e -rN \
 '[.spec, .spec.template.spec] | flatten(1) | .[]| [.containers, .initContainers] | flatten(1) | .[].image' - \
 | sort -u
```

## Mirror Containers

Copy each container to your local repository, replacing the server name but keeping the paths.

This is easiest to do with skopeo or crane, but can be done with docker as well.

## Mirror the Charts to the Registry

Pull down spire charts
```shell
helm pull spire-crds --repo https://spiffe.github.io/helm-charts-hardened/
helm pull spire --repo https://spiffe.github.io/helm-charts-hardened/
```

Push up charts to registry
```shell
helm push spire-crds*.tgz oci://<your registry url>/helm-charts
helm push spire-0*.tgz oci://<your registry url>/helm-charts
```

## Configuration

Update the repo values to point at your local mirror:

your-values.yaml snippet:
```yaml
global:
  spire:
    image:
      registry: "<your registry url here>"
```

## Installation

Install using the mirrored charts:
```
helm upgrade --install --create-namespace -n spire-mgmt spire-crds \
  oci://<your registry url>/helm-charts/spire-crds

helm upgrade --install -n spire-mgmt spire spire \
 --repo https://spiffe.github.io/helm-charts-hardened/ \
 -f your-values.yaml
```

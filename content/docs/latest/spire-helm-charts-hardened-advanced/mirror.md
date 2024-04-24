---
title: Local Mirrors
short: Local Mirrors
description: How to setup a local mirror for SPIRE images
kind: spire-helm-charts-hardened-advanced
weight: 200
aliases:
    - /docs/latest/helm-charts-hardened-architecture/mirror
---

## Identify Containers needing mirroring

Run:
```bash
helm template spire --repo https://spiffe.github.io/helm-charts-hardened/ -f your-values.yaml | yq e -rN \
 '[.spec, .spec.template.spec] | flatten(1) | .[]| [.containers, .initContainers] | flatten(1) | .[].image' - \
 | sort -u
```

Example output:
```
cgr.dev/chainguard/bash:latest
cgr.dev/chainguard/kubectl:latest
cgr.dev/chainguard/wait-for-it:latest-20230113
ghcr.io/spiffe/spiffe-csi-driver:0.2.3
ghcr.io/spiffe/spire-agent:1.6.3
ghcr.io/spiffe/spire-controller-manager:0.2.2
ghcr.io/spiffe/spire-server:1.6.3
registry.k8s.io/sig-storage/csi-node-driver-registrar:v2.6.2
```

## Mirror Containers

Copy each container to your local repository, replacing the server name but keeping the paths.

This is easiest to do with [skopeo](https://github.com/containers/skopeo) or [crane](https://michaelsauter.github.io/crane/index.html), but can be done with docker as well.

## Mirror the Charts to the Registry

Pull down SPIRE charts
```shell
helm pull spire-crds --repo https://spiffe.github.io/helm-charts-hardened/
helm pull spire --repo https://spiffe.github.io/helm-charts-hardened/
```

Push up charts to registry
```shell
helm push spire-crds*.tgz oci://<your registry url>/helm-charts-hardened/spire-crds
helm push spire-0*.tgz oci://<your registry url>/helm-charts-hardened/spire
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

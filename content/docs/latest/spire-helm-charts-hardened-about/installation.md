---
title: Installation
short: Installation
description: How to install the SPIRE stack using the SPIRE Helm charts
kind: spire-helm-charts-hardened-about
weight: 100
aliases:
    - /docs/latest/helm-charts-hardened/installation
---

## Quick start

To do a quick install suitable for non production environments such as [minikube](https://minikube.sigs.k8s.io/docs/):

```
helm upgrade --install --create-namespace -n spire spire-crds spire-crds \
 --repo https://spiffe.github.io/helm-charts-hardened/

helm upgrade --install -n spire spire spire \
 --repo https://spiffe.github.io/helm-charts-hardened/
```

## Production Deployment

Preparing a production deployment requires a few extra steps.

1. Save the following to your-values.yaml, ideally in your git repo.
```yaml
global:
  openshift: false # If running on openshift, set to true
  spire:
    recommendations:
      enabled: true
    namespaces:
      create: true
    ingressControllerType: "" # If not openshift, and want to expose services, set to a supported option [ingress-nginx]
    # Update these
    clusterName: example-cluster
    trustDomain: example.org
    caSubject:
      country: ARPA
      organization: Example
      commonName: example.org
```

2. If you need a non default storageClass, append the following to the spire-server section and update:
```
  persistence:
    storageClass: your-storage-class
```

3. If your Kubernetes cluster is OpenShift based, use the output of the following command to update the trustDomain setting:
```shell
oc get cm -n openshift-config-managed  console-public -o go-template="{{ .data.consoleURL }}" | \
  sed 's@https://@@; s/^[^.]*\.//'
```

4. Find any additional values you might want to set based on the documentation on this site or the [examples](https://github.com/spiffe/helm-charts-hardened/tree/main/examples). In particular, consider using an external database.

5. Deploy

```shell
helm upgrade --install --create-namespace -n spire-mgmt spire-crds spire-crds \
  --repo https://spiffe.github.io/helm-charts-hardened/

helm upgrade --install -n spire-mgmt spire spire \
 --repo https://spiffe.github.io/helm-charts-hardened/ \
 -f your-values.yaml
```

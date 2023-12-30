---
title: Installation
short: Installation
description: How to install the SPIRE Helm chart
kind: spire-helm-charts-hardened-about
weight: 100
aliases:
    - /docs/latest/helm-charts-hardened/installation
---

# Non Production Deployment

To do a quick non production install suitable for quick testing in something like minikube:

```
helm upgrade --install --create-namespace -n spire-server spire-crds spire-crds \
 --repo https://spiffe.github.io/helm-charts-hardened/

helm upgrade --install -n spire-server spire spire \
 --repo https://spiffe.github.io/helm-charts-hardened/
```

# Production Deployment

Preparing a production deployment requires a few steps.

Step 1: Save the following to your-values.yaml, ideally your git repo.
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
spire-server:
  ca_subject:
    # Update these
    country: ARPA
    organization: Example
    common_name: example.org
```

Step 2:  If your Kubernetes cluster is OpenShift based, use the output of the following command for your trustDomain:
```shell
oc get cm -n openshift-config-managed  console-public -o go-template="{{ .data.consoleURL }}" | \
  sed 's@https://@@; s/^[^.]*\.//'
```

Step 3: Find any additional values you might want to set based on the documentation on this site or the examples at: 
https://github.com/spiffe/helm-charts-hardened/tree/main/examples

In particular, consider using an external database.

Step 4: Edit your-values.yaml with the appropriate values.

Step 5: Deployment

```shell
helm upgrade --install --create-namespace -n spire-mgmt spire-crds spire-crds \
  --repo https://spiffe.github.io/helm-charts-hardened/

helm upgrade --install -n spire-mgmt spire spire \
 --repo https://spiffe.github.io/helm-charts-hardened/ \
 -f your-values.yaml
```

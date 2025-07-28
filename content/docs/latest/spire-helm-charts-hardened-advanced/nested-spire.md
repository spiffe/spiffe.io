---
title: Nested SPIRE
short: Nested SPIRE
description: Nested SPIRE Architectures
kind: spire-helm-charts-hardened-advanced
weight: 100
aliases:
    - /docs/latest/helm-charts-hardened-advanced/nested-spire
---

## Nested Considerations

### Architectures

The charts can be used to deploy many different styles of Nested SPIRE. A few possibilities are explained below.

### SPIRE Controller Manager

When multiple charts are installed at the same time with it enabled, they must use different classes. This is setup by default. Do not override without understanding the situation.

### TTLs


*fixme* note here about tradeoffs between longer ca's more stable less risky for networking. longer ca time more risk of security issues.


The TTL of the workload certificates is limited by the root instances `spire-server.caTTL` and the TTL of the intermediate CA's it produces, default `spire-server.controllerManager.identity.default.ttl`

The root CA will generate a new root at about 1/2 the `spire-server.caTTL`.

# Kubernetes Integrated Root

If your thinking about using nesting in the future, its easiest to start with a nested root deployment rather then a standalone instance.

We start with deploying the SPIRE instance that includes a root server.

## Setup Root Instance

![Image](/img/spire-helm-charts-hardened/root-k8s.png)


### Install the CRDs.
```shell
helm upgrade --install --create-namespace -n spire-mgmt spire-crds spire-crds \
 --repo https://spiffe.github.io/helm-charts-hardened/
```

Write out your-values.yaml as described in the [Install](../../spire-helm-charts-hardened-about/installation/#production-deployment) instructions steps 1 through 3.

Create a file named root-values.yaml

### No child clusters/VMs
If you do not have a need for any child clusters or VMs, you can turn off the external SPIRE server instance by adding the following to root-values.yaml:
```
tags:
  nestedRoot: true

external-spire-server:
  enabled: false
```

Install the root server:

```shell
helm upgrade --install -n spire-mgmt spire spire-nested --repo https://spiffe.github.io/helm-charts-hardened/ \
  -f your-values.yaml -f root-values.yaml
```

### Child clusters/VMs
If you do want to have child clusters or VMs, it should be exposed outside the cluster. Ingress is the most common/easy way to do so. Add the following to root-values.yaml:
```
tags:
  nestedRoot: true

spiffe-oidc-discovery-provider:
  ingress:
    enabled: true

external-spire-server:
  ingress:
    enabled: true
```

Also, ensure spire-server.$trustdomain is setup in your dns environment to point at your ingress controller, or update the ingress related [settings](../../spire-helm-charts-hardened-about/exposing) 

For each child cluster, run the following on a control plane node and copy the generated content to a file named `<child cluster name>.kubeconfig` where you are installing the root server:
```
kubeadm kubeconfig user --client-name=spire-root | tr '\n' ' ' | sed 's/ //g'; echo
```

Install the root server:

```shell
helm upgrade --install -n spire-mgmt spire spire-nested --repo https://spiffe.github.io/helm-charts-hardened/ \
  # Use as many of these lines as you have child clusters. Substitute <child cluster name> for its short name:
  --set "external-spire-server.kubeConfigs.<child cluster name>.kubeConfigBase64=$(cat <child cluster name>.kubeconfig)" \
  -f your-values.yaml -f root-values.yaml
```

## Multi-Cluster

![Image](/img/spire-helm-charts-hardened/multicluster-alternate3.png)

Deploy the root server as described above.

Write out a configuration file named child-values.yaml
```
tags:
  nestedChildFull: true

global:
  spire:
    #Update these two values
    clusterName: changeme
    upstreamSpireAddress: spire-server.changeme
```

Make sure you update the two values mentioned in the file. Each cluster should have a unique clusterName, and the upstreamSpireAddress should match the dns entry you set up for the root server.

Install the child server onto the child cluster:

```shell
helm upgrade --install --create-namespace -n spire-mgmt spire-crds spire-crds \
 --repo https://spiffe.github.io/helm-charts-hardened/
helm upgrade --install -n spire-mgmt spire spire-nested --repo https://spiffe.github.io/helm-charts-hardened/ \
  -f your-values.yaml -f child-values.yaml
```

> **Note**
> The child cluster will fail to start some services at this point, as the root server doesn't have have a trust established yet. This is expected.

Next, we will establish the trust between instances.

Example: TODO

## Security Cluster

![Image](/img/spire-helm-charts-hardened/securitycluster.png)

In some cases, you may have a separate Kubernetes Cluster just for security-related services that sits alongside one or more workload Kubernetes Clusters. The clusters share the same Data Center, Availability Zone, Region, or whatever other term is used to denote the same locality.

Deploy the root server as described above

Write out a configuration file named child-values.yaml

```
global:
  spire:
    # Update this value
    clusterName: changeme

tags:
  nestedChildSecurity: true

downstream-spire-agent-security:
  serviceAccount:
    server:
      # Update this value
      address: spire-server.changeme
```

Install the child server onto the child cluster:

```shell
helm upgrade --install --create-namespace -n spire-mgmt spire-crds spire-crds \
 --repo https://spiffe.github.io/helm-charts-hardened/
helm upgrade --install -n spire-mgmt spire spire-nested --repo https://spiffe.github.io/helm-charts-hardened/ \
  -f your-values.yaml -f child-values.yaml
```

> **Note**
> The child cluster will fail to start some services at this point, as the root server doesn't have a trust established yet. This is expected.

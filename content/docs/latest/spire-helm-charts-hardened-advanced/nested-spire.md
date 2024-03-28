---
title: Nested SPIRE
short: Nested SPIRE
description: Nested SPIRE Architectures
kind: spire-helm-charts-hardened-advanced
weight: 100
aliases:
    - /docs/latest/helm-charts-hardened-advanced/nested-spire
---

The charts can be used to deploy mutiple styles of Nested SPIRE. A few possibilities are explained below.

## Nested Considerations

### SPIRE Controller Manager

Node registration management can be done either manually or by the SPIRE Controller Manager but not both.

If you need join tokens, see the usage [here](../../spire-helm-charts-hardened-about/identifiers/#join-tokens)

When multiple charts are installed at the same time with it enabled, they must use different classes. This is setup by default. Do not override without understanding the situation.

### TTLs


*fixme* note here about tradeoffs between longer ca's more stable less risky for networking. longer ca time more risk of security issues.


The TTL of the workload certificates is limited by the root instances `spire-server.caTTL` and the TTL of the intermediate CA's it produces, default `spire-server.controllerManager.identity.default.ttl`

The root CA will generate a new root at about 1/2 the `spire-server.caTTL`.

# Kubernetes Integrated Root

If your thinking about using nesting in the future, its easiest to start with a nested root deployment rather then a standalone instance.

We start with deploying the spire instance that includes a root server.

## Setup Root Instance

![Image](/img/spire-helm-charts-hardened/root-k8s.png)


### Install the CRDs.
```shell
helm upgrade --install --create-namespace -n spire-mgmt spire-crds spire-crds \
 --repo https://spiffe.github.io/helm-charts-hardened/
```

Write out your-values.yaml as described in the [Install](../../spire-helm-charts-hardened-about/installation/#production-deployment) instructions steps 1 through 3.

Create a file named root-values.yaml

### No child clusters/vms
If you do not have a need for any child clusters or vms, you can turn off the external spire server instance by adding the following to root-values.yaml:
```
external-spire-server:
  enabled: false
```

### Child clusters/vms
If you do want to have child clusters or vms, it should be exposed outside the cluster. Ingress is the most common/easy way to do so. Add the following to root-values.yaml:
```
external-spire-server:
  ingress:
    enabled: true
```

Also, ensure spire-server.$trustdomain is setup in your dns environment to point at your ingress controller, or update the ingress related [settings](../../spire-helm-charts-hardened-about/exposing) 

### Install

Install the root server:

```shell
helm upgrade --install -n spire-mgmt spire spire-nested --repo https://spiffe.github.io/helm-charts-hardened/ \
  -f root-values.yaml -f your-values.yaml
```

## Multi-Cluster

![Image](/img/spire-helm-charts-hardened/multicluster-alternate3.png)

Configure the root server as described above.

Write out a configuration file named child-values.yaml
```
global:
  spire:
    #Update these two values
    clusterName: changeme
    upstreamSpireAddress: spire-server.changeme

root-spire-server:
  kind: none
  controllerManager:
    className: spire-mgmt-external-server

external-spire-server:
  enabled: false
```

Make sure you update the two values mentioned in the file. Each cluster should have a unique clusterName, and the upstreamSpireAddress should match the dns entry you set up for the root server.

Install the child server onto the child cluster:

```shell
helm upgrade --install --create-namespace -n spire-mgmt spire-crds spire-crds \
 --repo https://spiffe.github.io/helm-charts-hardened/
helm upgrade --install -n spire-mgmt spire spire-nested --repo https://spiffe.github.io/helm-charts-hardened/ \
  -f child-values.yaml -f your-values.yaml
```

It will fail to start some services at this point, as the root server doesn't have have a trust established yet. This is expected.

Next, establish we will establish the trust between instances.

Example: TODO

## Security Cluster

![Image](/img/spire-helm-charts-hardened/securitycluster.png)

In some cases, you may have a seperate Kubernetes Cluster just for security related services that sits along side one or more workload Kubernetes Clusters. The clusters share the same Datacenter, Availability Zone, Region or wthever other term that is used to denote the same locality.

Configure the root server as described above, adding the following additional configuration to root-values.yaml:
```
external-spire-server:
  nodeAttestor:
    externalK8sPsat:
      defaults:
        serviceAccountAllowList:
          - spire-system:spire-agent
```

Example: TODO


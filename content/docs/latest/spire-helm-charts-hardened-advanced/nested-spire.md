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

## Multi-Cluster

![Image](/img/spire-helm-charts-hardened/multicluster.png)

Example: TODO

## Security Cluster

![Image](/img/spire-helm-charts-hardened/securitycluster.png)

In some cases, you may have a seperate Kubernetes Cluster just for security related services that sits along side one or more workload Kubernetes Clusters. The clusters share the same Datacenter, Availability Zone, Region or wthever other term that is used to denote the same locality.

Example: TODO

## Single Cluster Hardened

![Image](/img/spire-helm-charts-hardened/singlehardened.png)

Sometimes you have a mix of workloads in Kubernetes and on bare metal or in virtual machines. You can use the Kubernetes cluster to host spire instances for both the Kubernetes clusters workload and the external workloads within the same Kubernetes cluster.

### Example K8s Root Instance

Install the CRDs.
```shell
helm upgrade --install --create-namespace -n spire-mgmt spire-crds spire-crds \
 --repo https://spiffe.github.io/helm-charts-hardened/
```

### Setup your-values.yaml

Write out your-values.yaml as described in the [Install](http://localhost:1313/docs/latest/spire-helm-charts-hardened-about/installation/#production-deployment) instructions steps 1 & 2.

spire-root-values.yaml:
```yaml
global:
  spire:
    namespaces:
      create: true

spire-server:
  controllerManager:
    identities:
      clusterSPIFFEIDs:
        default:
          type: raw
          spiffeIDTemplate: spiffe://{{ .TrustDomain }}/k8s/{{ .ClusterName }}/ns/{{ .PodMeta.Namespace }}/sa/{{ .PodSpec.ServiceAccountName }}
          namespaceSelector:
            matchExpressions:
            - key: "kubernetes.io/metadata.name"
              operator: In
              values: [spire-server]
          podSelector:
            matchLabels:
              release: spire
              release-namespace: spire-mgmt
              component: server
          downstream: true
        external:
          type: raw
          namespaceSelector:
            matchExpressions:
            - key: "kubernetes.io/metadata.name"
              operator: In
              values: [spire-server]
          podSelector:
            matchLabels:
              release: spire-external
              release-namespace: spire-mgmt
              component: server
          downstream: true
        oidc-discovery-provider:
          enabled: false
        test-keys:
          enabled: false
  nodeAttestor:
    k8sPsat:
      serviceAccountAllowList:
        - spire-system:spire-agent-upstream
  bundleConfigMap: spire-bundle-upstream
  notifier:
    k8sbundle:
      namespace: spire-system

spiffe-oidc-discovery-provider:
  enabled: false

spire-agent:
  server:
    address: spire-root-server.spire-server
  nameOverride: agent-upstream
  bundleConfigMap: spire-bundle-upstream
  socketPath: /run/spire/agent-sockets-upstream/spire-agent.sock
  serviceAccount:
    name: spire-agent-upstream
  healthChecks:
    port: 9981
  telemetry:
    prometheus:
      port: 9989

spiffe-csi-driver:
  pluginName: upstream.csi.spiffe.io
  agentSocketPath: /run/spire/agent-sockets-upstream/spire-agent.sock
  healthChecks:
    port: 9810

```

Install spire-root:

```shell
helm upgrade --install -n spire-mgmt spire-root spire --repo https://spiffe.github.io/helm-charts-hardened/ \
  -f spire-root-values.yaml -f your-values.yaml
```

### Example K8s Workload Instance

```yaml
spire-server:
  upstreamAuthority:
    spire:
      enabled: true
      upstreamDriver: upstream.csi.spiffe.io
      server:
        address: spire-root-server.spire-server
  ingress:
    enabled: true
  controllerManager:
    identities:
      clusterSPIFFEIDs:
        default:
          spiffeIDTemplate: spiffe://{{ .TrustDomain }}/k8s/{{ .ClusterName }}/ns/{{ .PodMeta.Namespace }}/sa/{{ .PodSpec.ServiceAccountName }}

spiffe-oidc-discovery-provider:
  ingress:
    enabled: true
```

Install spire:

```shell
helm upgrade --install -n spire-mgmt spire spire --repo https://spiffe.github.io/helm-charts-hardened/ \
  -f spire-values.yaml -f your-values.yaml
```

### Example External Workload Instance

spire-external-values.yaml:
```yaml
spire-server:
  federation:
    enabled: true
    ingress:
      enabled: true
    tls:
      spire:
        enabled: false
      # Pick one of certManager or externalSecret
      #certManager:
      #  enabled: true
      #externalSecret:
      #  enabled: true
      #  secretName: "your secret here"
  upstreamAuthority:
    spire:
      enabled: true
      upstreamDriver: upstream.csi.spiffe.io
      server:
        address: spire-root-server.spire-server
  controllerManager:
    enabled: false
  unsupportedBuiltInPlugins:
    nodeAttestor:
      join_token:
        plugin_data: {}

  nodeAttestor:
    k8sPsat:
      enabled: false
  bundleConfigMap: spire-bundle-external
  notifier:
    k8sbundle:
      namespace: spire-system

spire-agent:
  enabled: false

spiffe-csi-driver:
  enabled: false

spiffe-oidc-discovery-provider:
  enabled: false
```

Install spire-external:

```shell
helm upgrade --install -n spire-mgmt spire-external spire --repo https://spiffe.github.io/helm-charts-hardened/
  -f spire-external-values.yaml -f your-values.yaml
```

External agents:

You can configure the agent to use `trust_bundle_url` set to the federation ingress url from the external instance along with setting `trust_bundle_format` to `spiffe` to bootstrap using the hosts built in trust bundle to simplify bootstrapping.
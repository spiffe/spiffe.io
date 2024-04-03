---
title: Federation
short: Federation
description: How to setup a SPIRE Federation using the SPIRE Helm charts
kind: spire-helm-charts-hardened-advanced
weight: 200
aliases:
    - /docs/latest/helm-charts-hardened-architecture/federation
---

The typical architecture for Federated SPIRE using the Helm charts uses a 1:1 relationship between SPIRE instances and Kubernetes Clusters, as well as multiple Kubernetes clusters.

# Federation Configuration

There are 4 pieces of configuration related to Federation.

## Enabling Federation

Set `spire-server.federation.enabled=true`.

your-values.yaml snippet:
```yaml
spire-server:
  federation:
    enabled: true
```

## Exposing Federation Bundle Endpoint outside the Kubernetes Cluster

Set `spire-server.federation.ingress.enabled=true`. Futher customization can be made as described in 
[Exposing Services](/docs/latest/spire-helm-charts-hardened-about/exposing/#generic-ingress-config)

your-values.yaml snippet:
```yaml
spire-server:
  federation:
    ingress:
      enabled: true
```

## Configure local SPIRE to talk to and trust other SPIRE Instances

your-values.yaml snippet:
```yaml
spire-server:
  controllerManager:
    identities:
      clusterFederatedTrustDomains:
        b:
          bundleEndpointProfile:
            endpointSPIFFEID: spiffe://b-org.local/spire/server
            type: https_spiffe
          bundleEndpointURL: https://spire-server-federation.b-org.local
          trustDomain: b-org.local
```

## Configure local workloads to trust the other SPIRE

your-values.yaml snippet:
```yaml
spire-server:
  controllerManager:
    identities:
      clusterSPIFFEIDs:
        default:
          federatesWith:
          - b-org.local
```

# Example Federated Installation

## Kubernetes Cluster A

your-values.yaml
```yaml
global:
  openshift: false
  spire:
    recommendations:
      enabled: true
    namespaces:
      create: true
    ingressControllerType: ingress-nginx
    clusterName: a
    trustDomain: a-org.local

spire-server:
  ca_subject:
    country: US
    organization: A
    common_name: a.local
  federation:
    enabled: true
    ingress:
      enabled: true
  controllerManager:
    identities:
      clusterSPIFFEIDs:
        default:
          federatesWith:
          - b-org.local
      clusterFederatedTrustDomains:
        b:
          bundleEndpointProfile:
            endpointSPIFFEID: spiffe://b-org.local/spire/server
            type: https_spiffe
          bundleEndpointURL: https://spire-server-federation.b-org.local
          trustDomain: b-org.local

spiffe-oidc-discovery-provider:
  ingress:
    enabled: true
```

Install on Cluster A

```shell
helm upgrade --install --create-namespace -n spire-server spire-crds spire-crds \
 --repo https://spiffe.github.io/helm-charts-hardened/

helm upgrade --install -n spire-server spire spire \
 --repo https://spiffe.github.io/helm-charts-hardened/
```

## Kubernetes Cluster B

your-values.yaml
```yaml
global:
  openshift: false
  spire:
    recommendations:
      enabled: true
    namespaces:
      create: true
    ingressControllerType: ingress-nginx
    clusterName: b
    trustDomain: b-org.local

spire-server:
  ca_subject:
    country: US
    organization: B
    common_name: b.local
  federation:
    enabled: true
    ingress:
      enabled: true
  controllerManager:
    identities:
      clusterSPIFFEIDs:
        default:
          federatesWith:
          - a-org.local
      clusterFederatedTrustDomains:
        a:
          bundleEndpointProfile:
            endpointSPIFFEID: spiffe://a-org.local/spire/server
            type: https_spiffe
          bundleEndpointURL: https://spire-server-federation.a-org.local
          trustDomain: a-org.local

spiffe-oidc-discovery-provider:
  ingress:
    enabled: true
```

Install on Cluster B

```shell
helm upgrade --install --create-namespace -n spire-server spire-crds spire-crds \
 --repo https://spiffe.github.io/helm-charts-hardened/

helm upgrade --install -n spire-server spire spire \
 --repo https://spiffe.github.io/helm-charts-hardened/
```

## DNS
Ensure that the bundleEndpointURL's specified are valid and in DNS. Use the External IP Address of the Ingress Controller service.

The hostnames can be adjusted if desired, as described in
[Exposing Services](/docs/latest/spire-helm-charts-hardened-about/exposing/#generic-ingress-config)

## Bootstrapping the Federation

When using bundleEndpointProfile's of type `https_spiffe`, both instances will need to have trust bundles from the other instance loaded in manually.
Once they are loaded. The instances can automatically renew them once trust is established.

### On Cluster A, retrieve the trust bundle

```shell
kubectl exec -it -n spire-server spire-server-0 -c spire-server -- spire-server bundle show -format spiffe > cluster-a.bundle
```

Then send cluster-a.bundle to the admin of Cluster B via a secure means. (Signed email, scp, etc)

### On Cluster B, retrieve the trust bundle

```shell
kubectl exec -it -n spire-server spire-server-0 -c spire-server -- spire-server bundle show -format spiffe > cluster-b.bundle
```

Then, send cluster-b.bundle to the admin of Cluster A via a secure means. (Signed email, scp, etc)

### On Cluster A, load in Cluster Bs trust bundle

```shell
cat cluster-b.bundle | kubectl exec -i -n spire-server spire-server-0 -c spire-server -- spire-server bundle set -format spiffe -id spiffe://b-org.local
```

### On Cluster B, load in Cluster As trust bundle

```shell
cat cluster-a.bundle | kubectl exec -i -n spire-server spire-server-0 -c spire-server -- spire-server bundle set -format spiffe -id spiffe://a-org.local
```


---
title: Identifiers
short: Identifiers
description: How to configure SPIFFE IDs
kind: spire-helm-charts-hardened-about
weight: 200
aliases:
    - /docs/latest/helm-charts-hardened/identifiers
---

## Defaults

By default the chart deploys the SPIRE Controller Manager that enables management of SPIFFE Identifiers by Kubernetes Custom Resources.

The chart itself by default deploys a ClusterSPIFFEID Custom Resource that gives an identifier to all pods.

Out of the box, in a lot of use cases you do not need to add additional identifiers.

## Custom / Additional Identifiers

But, in some cases you may want to customize your identifiers or add additional ones.

While you can manage identities using the Kubernetes Custom Resources via https://github.com/spiffe/spire-controller-manager?tab=readme-ov-file#custom-resources directly
we do not recommend doing that as it takes care to not misconfigure.

The chart supports managing the Custom Resources from the charts values file for even easier management. We recommend using that mechanism.

## Restricting the default SVIDs.

Some workloads only reliably support one SVID at a time. To support customization you can do either two things:

1. You can disable the default ClusterSVID entirely and load in individual ClusterSVIDs for each workload/namespace.
2. Restrict the namespaces the default ClusterSVID applies to, so new ClusterSVIDs can uniquely match the workload in the excluded namespaces.

### Disabling the default ClusterSVID

your-values.yaml snippet:
```yaml
spire-server:
  controllerManager:
    identities:
      clusterSPIFFEIDs:
        default:
          enabled: false
```

### Restricting the default ClusterSVID

Example: Exclude the default ClusterSPIFFEID from getting applied to the `dev` and `test` namespaces

your-values.yaml snippet:
```yaml
spire-server:
  controllerManager:
    identities:
      clusterSPIFFEIDs:
        default:
          namespaceSelector:
            matchExpressions:
            - key: "kubernetes.io/metadata.name"
              operator: NotIn
              values: [dev, test]
```

# Dynamic SVIDs

Additional ClusterSVIDs can be added to the cluster by adding additional keys / values under the `spire-server.controllerManager.identities.clusterSPIFFEIDs` dictionary.

Example: Add a SVID that matches the workload labeled `app: frontend` in namespace `test` and add a dns entry to it named `frontend.example.com`:

your-values.yaml snippet:
```yaml
spire-server:
  controllerManager:
    identities:
      clusterSPIFFEIDs:
        test-frontend:
          namespaceSelector:
            matchExpressions:
            - key: "kubernetes.io/metadata.name"
              operator: In
              values: [test]
          podSelector:
            matchLabels:
              app: frontend
          dnsNameTemplates:
          - frontend.example.com
```

# Static SVIDs

## Regular SVIDs

Generally, loading Static SVIDS is only useful when using a workload attestor that is not the Kubernetes attestor. (non default settings)

Example: Add a SVID that matches processes running under gid `1000` on node `x` and give it a spiffeID of `spiffe://example.com/frontend` with dns name `frontend.example.com`

your-values.yaml snippet:
```yaml
spire-server:
  controllerManager:
    identities:
      clusterStaticEntries:
        frontend:
          parentID: spiffe://example.com/node/x
          spiffeID: spiffe://example.com/frontend
          selectors:
          - unix:gid:1000
          dnsNameTemplates:
          - frontend.example.com
```

## Node SVIDs

When using a node attestor other then k8sPsat, you may need to add some node entries to the database. You can make static entries for them by using the spire server's identity
as the parent. To link up to the k8sPsat

Example:

your-values.yaml snippet:
```yaml
spire-server:
  controllerManager:
    identities:
      clusterStaticEntries:
        node1:
          parentID: spiffe://example.org/spire/server
          spiffeID: spiffe://example.org/spire/agent/k8s_psat/example-cluster/e860cb09-8533-4f2e-80dc-8286d768c992
          selectors:
          - tpm:pub_hash:646789aab7a9028713b8fa5197cf6be0e935d7da048866f86224ec64c50d590c
        node2:
          parentID: spiffe://example.org/spire/server
          spiffeID: spiffe://example.org/spire/agent/k8s_psat/example-cluster/8494d54e-6ad5-4c8e-87d1-2e6b7c2315cc
          selectors:
          - tpm:pub_hash:d2f0ac3a4ad72e0f14f3cd7d6b5cab16c06dc05a6b847a03c8771d640709eadd
        node3:
          parentID: spiffe://example.org/spire/server
          spiffeID: spiffe://example.org/spire/agent/k8s_psat/example-cluster/5afebd69-7c67-4998-a953-f491c156ee35
          selectors:
          - tpm:pub_hash:ac951f972127d8176c367bba4684e57da3589d1f0e072a608d53977255503c7f
```

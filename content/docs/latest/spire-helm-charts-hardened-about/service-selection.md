---
title: Service Selection
short: Service Selection
description: How to enable/disable individual services
kind: spire-helm-charts-hardened-about
weight: 110
aliases:
    - /docs/latest/helm-charts-hardened/service-selection
---

# Services provided by the chart

There are multiple services provided by the chart. They can be enabled/disabled as needed using helm
values.

## Production Services

| Service Name                   | Value                                       | Enabled by Default |
| ------------------------------ | ------------------------------------------- | ------------------ |
| SPIRE Server                   | spire-server.enabled                        | true               |
| SPIRE Agent                    | spire-agent.enabled                         | true               |
| SPIRE Controller Manager       | spire-server.spireControllerManager.enabled | true               |
| SPIFFE OIDC Discovery Provider | spiffe-oidc-discovery-provider.enabled      | true               |
| SPIFFE CSI Driver              | spiffe-csi-driver.enabled                   | true               |

## Experimental Services

| Service Name                   | Value                                       | Enabled by Default |
| ------------------------------ | ------------------------------------------- | ------------------ |
| Tornjak Frontend               | tornjak-frontend.enabled                    | false              |
| Tornjak Backend                | spire-server.tornjak.enabled                | false              |

## Customization Examples

Example: Running the SPIRE Server Standalone:

your-values.yaml snippet:
```yaml
spire-agent:
  enabled: false
spiffe-oidc-discovery-provider:
  enabled: false
spiffe-csi-driver:
  enabled: false
```


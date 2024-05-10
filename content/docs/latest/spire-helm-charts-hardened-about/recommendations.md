---
title: Recommendations
short: Recommendations
description: Recommended Configuration
kind: spire-helm-charts-hardened-about
weight: 120
aliases:
    - /docs/latest/helm-charts-hardened/recommendations
---

# Enable Recommendations

In a production deployment there are a series of recommendations we
have. By enabling the recommendations, you can easily get all of
them applied to your deployment. If there are particular recommmendations
you do not wish to use, you can still set those recommendations to `false`
to disable them.

your-values.yaml snippet:
```yaml
global:
  spire:
    recommendations:
      enabled: true
```

# Individual Recommentations

| Name                                                                                                                                | Value                                          |
| ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| [Namespace Layout](/docs/latest/spire-helm-charts-hardened-about/recommendations/#namespace-layout)                                 | global.spire.recommendations.namespaceLayout   |
| [Namespace Pod Security Standards](/docs/latest/spire-helm-charts-hardened-about/recommendations/#namespace-pod-security-standards) | global.spire.recommendations.namespacePSS      |
| [PriorityClassName](/docs/latest/spire-helm-charts-hardened-about/recommendations/#priority-class-name)                             | global.spire.recommendations.priorityClassName |
| [Prometheus](/docs/latest/spire-helm-charts-hardened-about/recommendations/#prometheus)                                             | global.spire.recommendations.prometheus        |
| [Strict Mode](/docs/latest/spire-helm-charts-hardened-about/recommendations/#namespace-layout)                                      | global.spire.recommendations.strictMode        |
| [Security Contexts](/docs/latest/spire-helm-charts-hardened-about/recommendations/#security-contexts)                               | global.spire.recommendations.securityContexts  |

## Namespace Layout

Option `global.spire.recommendations.namespaceLayout` causes the services to be deployed
across the two recommended namespaces for the services:

| Namespace Type | Namespace Value                     | Default Value | Purpose                                                    |
| -------------- | ----------------------------------- | ------------- | ---------------------------------------------------------- |
| Server         | global.spire.namespaces.server.name | spire-server  | Services that should have restricted Kubernetes privileges |
| System         | global.spire.namespaces.system.name | spire-system  | Services needing Kubernetes privileges                     |

| Service Name                   | Namespace Type |
| ------------------------------ | -------------- |
| SPIRE Server                   | Server         |
| SPIFFE OIDC Discovery Provider | Server         |
| SPIFFE CSI Driver              | System         |
| SPIRE Agent                    | System         |

## Namespace Pod Security Standards

Option `global.spire.recommendations.namespacePSS` sets the chart to set the recommended
[Kubernetes Pod Security Standard](https://kubernetes.io/docs/concepts/security/pod-security-standards/) labels when namespaces
are created with the chart via any of the namespace flags as described in the [namespace documentation](../namespaces/#namespace-creation-options.)


On creation, the following Namespaces are assigned their Pod Security Standard:

| Namespace Type | Pod Security Standard |
| -------------- | --------------------- |
| Server         | Restricted            |
| System         | Privileged            |


## Priority Class Name

Option `global.spire.recommendations.priorityClassName` sets the Kubernetes Priority Class Names so that if there is resource contention on the cluster
the SPIRE Services will have a very high priority. SPIRE malfunctioning can cuase other important workloads to malfunction too so we prevent that from
happening.

## Prometheus

Option `global.spire.recommendations.prometheus` enables prometheus style exporters to be exposed out of the relevant pods. This enables Prometheus or
other compatable services to gather metrics from the various services.

## Strict Mode

Option `global.spire.recommendations.strictMode` adds additional checks on the configuration to help ensure your configuration is production ready. These are
settings that are recommended as part of the [install instructions.](..//installation/#production-deployment)

## Security Contexts

Option `global.spire.recommendations.securityContexts` sets the Kubernetes pod securityContext and container securityContext to settings that
meet the required [Kubernetes Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/) as well as addition
settings that tighten security as much as the maintainers know how.

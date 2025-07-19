---
title: Exposing Services
short: Exposing Services
description: How to expose SPIFFE/SPIRE services outside of Kubernetes
kind: spire-helm-charts-hardened-about
weight: 150
aliases:
    - /docs/latest/helm-charts-hardened/exposing
---

# Default

By default no SPIRE services are exposed outside the Kubernetes cluster. The below sections cover how to expose them.


# Exposable Services

## Production Services

| Service Name                     | Section Value                          | Default DNS Name                     |
| -------------------------------- | -------------------------------------- | ------------------------------------ |
| SPIRE Server                     | spire-server.ingress                   | spire-server.$trustDomain            |
| SPIRE Federation Bundle Endpoint | spire-server.federation.ingress        | spire-server-federation.$trustDomain |
| SPIFFE OIDC Discovery Provider   | spiffe-oidc-discovery-provider.ingress | oidc-discovery.$trustDomain          |

## Experimental Services

| Service Name                     | Value                                  | Default DNS Name                     |
| -------------------------------- | -------------------------------------- | ------------------------------------ |
| Tornjak Frontend                 | tornjak-frontend.ingress               | tornjak-backend.$trustDomain         |
| Tornjak Backend                  | spire-server.tornjak.ingress           | tornjak-frontend.$trustDomain        |

# Ingress Controller Support

We have tests for ingress-nginx based Ingress Controllers and the Ingress Controller built into OpenShift.

For ingress-nginx, set `global.spire.ingressControllerType=ingress-nginx`

For OpenShift, set `global.openshift=true`

Other Ingress Controllers may work but are untested and unsupported. Set the
`ingress.annotations` values as appropriate for your Ingress Controller. Please consider [submitting a PR](https://github.com/spiffe/helm-charts-hardened/pulls) if you're able to get another Ingress to work.

# Generic Ingress Config

Each Ingress that is enabled by setting `ingress.enabled=true` will by default create a virtual host with a DNS name like
`$serviceName.$trustDomain`. You can override the host under the services ingress section with key host. If the host
value doesn't have a `.` in it, $trustDomain will automatically be added.

Example: Overriding the spire-server-federation host to be `example-fed.$trustDomain`

your-values.yaml snippet:
```yaml
spire-server:
 federation:
   ingress:
     enabled: true
     host: example-fed
```

Example: Overriding the spire-server-federation host to be `example-fed.my-domain.com`

your-values.yaml snippet:
```yaml
spire-server:
 federation:
   ingress:
     enabled: true
     host: example-fed.my-domain.com
```

# SPIFFE OIDC Discovery Provider

The most likely service you will want to expose outside the Kubernetes Cluster is the the SPIFFE OIDC Discovery Provider.

In order to check the integrity of a JWT, an external service needs information about the server used to sign the
JWT. This info can be retrieved from the SPIFFE OIDC Discovery Provider. It will need to be exposed to any other
service needing to validate JWT's.

# SPIRE Server

When setting up a Nested SPIRE installation and you have child SPIRE instances in other clusters, you will need to
expose the Root SPIRE instance outside the Kubernetes cluster. You can do this like:

your-values.yaml snippet:
```yaml
spire-server:
  ingress:
    enabled: true
```

# SPIRE Federation Bundle Endpoint

When setting up Federation, you need to expose the bundle endpoint outside the Kubernetes cluster so other SPIRE
instances can contact it.  It will not work without enabling Federation as well. Please see the
[Federation documentation](/docs/latest/spire-helm-charts-hardened-advanced/federation/) of the Helm Chart for
all the related options to successfully deploy a Federation.

your-values.yaml snippet:
```yaml
spire-server:
  federation:
    enabled: true
    ingress:
      enabled: true
```

{{< scarf/pixels/high-interest >}}

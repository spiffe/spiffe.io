---
title: About SPIRE Helm Charts Hardened
sidebar:
  label: About
  order: 100
---

The [SPIRE Helm chart](https://artifacthub.io/packages/helm/spiffe/spire) provided by the [helm-charts-hardened](https://github.com/spiffe/helm-charts-hardened) project is an easy and supported way to deploy a complete SPIRE stack in Kubernetes.

Out of the box, it deploys the SPIRE Server, SPIRE Agent, SPIRE Controller Manager, SPIFFE CSI Driver, and SPIFFE OIDC Discovery Provider along with configuring them all to integrate with the Kubernetes
cluster it is running on.

Start with the [Helm quickstart](/docs/spire/helm/installation/#quick-start) in a non-production cluster, or follow the [production deployment instructions](/docs/spire/helm/installation/#production-deployment). Configure and upgrade the installation through chart values.

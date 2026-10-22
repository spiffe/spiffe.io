---
title: Authenticate across trust domains
description: Exchange trust bundles while retaining separate issuing authorities.
editUrl: false
---

SPIFFE federation allows independently operated trust domains to exchange public trust bundles. A workload can then verify an SVID issued by another domain.

## What crosses the boundary

A bundle contains public verification material. Issuing private keys stay with the issuing domain. Each domain keeps its own identity namespace and issuing authority.

For example, a service in `spiffe://payments.example` can verify a caller from `spiffe://orders.example` when the relevant bundle is configured and available. The service still decides whether that caller may submit a payment.

## Establish and maintain the relationship

Configure the foreign trust domain, its bundle endpoint, and the authentication profile for that endpoint. Federation clients refresh bundles as issuing keys rotate. Distribute the bundles to workloads through the Workload API.

Federation does not make trust transitive. Accepting one domain's bundle does not automatically mean accepting every other domain it knows.

## Continue

- [Read the federation specification](/docs/spiffe/specs/federation/).
- [Deploy a federated SPIRE architecture](/docs/spire/architecture/federation/).
- [Configure federation with the hardened Helm charts](/docs/spire/helm/advanced/federation/).

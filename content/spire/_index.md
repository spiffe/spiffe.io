---
title: About SPIRE
short: About SPIRE
description: A brief introduction to SPIRE, the SPIFFE Runtime Environment
weight: 1
---

**SPIRE**, the [SPIFFE](/spiffe) Runtime Environment, is a toolchain for establishing trust between software systems across a wide variety of hosting platforms. Concretely, SPIRE exposes the [SPIFFE Workload API](https://github.com/spiffe/spire/blob/master/proto/api/workload/workload.proto), which can attest running software systems and issue [SPIFFE IDs](https://github.com/spiffe/spiffe/blob/master/standards/SPIFFE-ID.md) and [SVID](https://github.com/spiffe/spiffe/blob/master/standards/SPIFFE-ID.md)s to them. This in turn allows two workloads to establish trust between each other, for example by establishing an mTLS connection or by signing and verifying a JWT token.

If you'd like to try out SPIRE on Linux, check out the [Getting Started Guide for Linux](getting-started-linux). For getting SPIRE running in a Kubernetes cluster, see the [Getting Started Guide for Kubernetes](getting-started-k8s). You can also [or head to the Github project](https://github.com/spiffe/spire).

## Use cases

SPIRE can be used in a wide variety of scenarios and to perform a wide variety of identity-related functions. Here are some examples:

* Secure authentication amongst services
* Secure introduction to secret stores such as [Vault](https://hashicorp.com/products/vault) and [Pinterest Knox](https://github.com/pinterest/knox)
* Identity provisioning as the foundation of identify for sidecar proxies in a service mesh, such as [Envoy](https://blog.envoyproxy.io/securing-the-service-mesh-with-spire-0-3-abb45cd79810)
* Provisioning and rotation of the PKI used to authenticate the components of distributed systems

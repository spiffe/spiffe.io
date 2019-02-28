---
title: About SPIRE
short: About SPIRE
description: A brief introduction to SPIRE, the SPIFFE Runtime Environment
weight: 1
---

SPIRE is a production-ready implementation of the [SPIFFE](https://github.com/spiffe/spiffe) APIs that performs node and workload attestation in order to securely issue SVIDs to workloads, and verify the SVIDs of other workloads, based on a predefined set of conditions. 

If you'd like to try out SPIRE on Linux, check out the [Getting Started Guide for Linux](getting-started-linux). For getting SPIRE running in a Kubernetes cluster, see the [Getting Started Guide for Kubernetes](getting-started-k8s). You can also [or head to the Github project](https://github.com/spiffe/spire).

## Use cases

SPIRE can be used in a wide variety of scenarios and to perform a wide variety of identity-related functions. Here are some examples:

* Secure authentication amongst services
* Secure introduction to secret stores such as [Vault](https://hashicorp.com/products/vault) and [Pinterest Knox](https://github.com/pinterest/knox)
* Identity provisioning as the foundation of identify for sidecar proxies in a service mesh, such as [Envoy](https://blog.envoyproxy.io/securing-the-service-mesh-with-spire-0-3-abb45cd79810)
* Provisioning and rotation of the PKI used to authenticate the components of distributed systems

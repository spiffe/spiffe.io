---
title: SPIRE overview
short: Overview
description: A basic introduction to Spire, the SPIFFE Runtime Environment
weight: 1
---

**SPIRE**, the [SPIFFE](/spiffe) Runtime Environment, is a toolchain for establishing trust between software systems across a wide variety of hosting platforms. Concretely, SPIRE exposes the [SPIFFE Workload API](https://github.com/spiffe/spire/blob/master/proto/api/workload/workload.proto), which can attest running software systems and issue [SPIFFE IDs](https://github.com/spiffe/spiffe/blob/master/standards/SPIFFE-ID.md) and [SVID](https://github.com/spiffe/spiffe/blob/master/standards/SPIFFE-ID.md)s to them. This in turn allows two workloads to establish trust between each other, for example by establishing an mTLS connection or by signing and verifying a JWT token.

If you'd like to try out SPIRE on your machine, check out the [Getting started with SPIRE](getting-started) guide.

## Use cases

SPIRE can be used in a wide variety of scenarios and to perform a wide variety of identity-related functions. Here are some examples:

* Secure authentication amongst services
* Secure introduction to secret stores such as [Vault](https://hashicorp.com/products/vault) and [Apache Knox](http://knox.apache.org/)
* Identity provision for service meshes such as [Istio](https://istio.io)
* Secure bootstrap deployment for distributed systems, such as:
  * [Kubernetes](https://kubernetes.io)
  * [Hadoop](http://hadoop.apache.org/)
  * [Chef](https://chef.io)
  * [Puppet](https://puppet.com)

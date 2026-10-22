---
title: SPIFFE overview
description: Names, identity documents, interfaces, and trust domains.
editUrl: false
---

SPIFFE is an open standard for workload identity. It gives software systems a common way to name themselves, obtain cryptographic identity documents, and verify the identities presented by other systems.

A workload might be a process on a virtual machine or a service running in a container. Its identity is a **SPIFFE ID**, such as `spiffe://example.org/payments`. The identity remains meaningful when the workload's address changes.

## What SPIFFE defines

A **SPIFFE Verifiable Identity Document**, or SVID, carries a workload's identity in a form a peer can verify. X.509-SVIDs are used with TLS. JWT-SVIDs are tokens issued for an intended audience.

The **Workload API** gives workloads access to their SVIDs and the trust bundles used to validate peers. Implementations authenticate the caller through their environment and policy. Application code does not need an API key to call the local Workload API.

A **trust domain** is an administrative boundary with its own issuing authority. **Federation** lets independently operated domains exchange the public verification material needed to authenticate each other's workloads.

## What the application decides

Authenticating a peer establishes its identity. The receiving system still decides whether that identity may perform a particular operation. SPIFFE does not define your authorization policy.

## Choose your next step

- [Understand the concepts](/docs/spiffe/concepts/).
- [Use SPIFFE in an application](/docs/spiffe/use-cases/service-authentication/).
- [Design identity for high-assurance systems](/docs/spiffe/use-cases/high-assurance/).
- [Read the specifications](/docs/spiffe/specs/).
- [Try SPIRE](/spire/), the reference implementation.
- [Compare implementations](/ecosystem/matrix/) or [explore the ecosystem](/ecosystem/).

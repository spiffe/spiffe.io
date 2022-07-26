---
title: How does SPIRE compare to other tools?
short: Comparisons
kind: spire-about
description: Understand SPIRE by comparing and contrasting it to related systems
weight: 150
aliases:
    - /spire/comparisons
    - /docs/latest/spire/understand/comparisons
---

# Secret Stores
_e.g. Hashicorp Vault, Square Keywhiz_

Secrets managers typically control, audit and securely store sensitive information (secrets, typically passwords) on behalf of a workload. Some secrets managers can perform additional functions such as encrypting  and decrypting data. A common feature of many secrets managers is a central storage "vault" with data in the vault encrypted at rest. Workloads must individually authenticate to the vault before performing actions such as secret retrieval or data decryption. 

A common architectural challenge in deploying secrets managers is how to securely store the credential that is used by the workload to access the secret store itself. This is sometimes called "credential zero", the "bootstrap credential", or more broadly, the process of "secure introduction".

By contrast, while SPIRE does _generate_ SPIFFE identities that can be used to [authenticate to other systems](/docs/latest/spire-integrations/use-cases/), SPIRE does not aim to store existing keys (such as a database password) on behalf of a workload.

SPIRE's attestation policies provide a flexible and powerful solution for secure introduction to secrets managers. A common use of SPIRE-issued [SVIDs](/docs/latest/spiffe/concepts/#spiffe-verifiable-identity-document-svid) is to authenticate to secret stores to allow an application to retrieve secrets.

# Identity Providers
_e.g. ory.sh, VMWare Lightwave, WSO2 Identity Server_

Identity providers are typically responsible for generating short-lived identity documents in various formats for workloads when they interact with other systems. These may include, for example: SVIDs (for SPIFFE), access or refresh tokens (OAuth) or Service Tickets (Kerberos). If an identity provider implements the SPIFFE specification faithfully then it can be considered a SPIFFE Identity Provider. Since SPIRE implements the SPIFFE specification it may be considered a SPIFFE identity provider. 

Most identity providers rely on a pre-existing identity document or secret to identify a workload, such an API key and secret or keytab. This is similar to the "bootstrap credential" described above. What distinguishes SPIRE from other identity providers is the [attestation process](/docs/latest/spire/understand/concepts/#attestation) by which it identifies the workload in the first place, _before_ issuing it an identity document. This significantly improves security since no long-lived static credential needs to be co-deployed with the workload itself.

As with secret stores, SPIRE may be used to provide secure introduction to existing identity providers to provide backwards compatibility with existing identity infrastructure.

# Authorization Policy Engines
_e.g. Open Policy Agent_

SPIFFE and SPIRE provide a specification and tool-chain respectively for distributed authentication - that is - allowing  workloads distributed across distinct machines, teams and geographies to be able to trust messages sent between each other. To trust a message in broad terms means that a workload receiving the message can verify that the message was sent by the workload that claimed to send it, and that the message was not read or modified while in transit.

Typically when a workload receives a message from another workload, having _authenticated_ that message using SPIFFE, it must then decide how to act on that message (_authorization_). SPIFFE and SPIRE do not provide a means to implement authorization policies, only authentication policies. For example, a workload that manages an internal room booking system may receive a request from a source workload to book a room. The decision to act on this request may depend on the identity of the source workload (not all software systems may be trusted to make room bookings, even if they are authenticated), as well as whether a room is available, and perhaps even the time of day.

Authorization policy engines typically aim to allow some of this decision making to be expressed in a single human readable policy outside of an application's source code, and have those systems consistently execute decisions based on that policy and relevant context.

As a more concrete example, an operations team might choose to deploy (1) SPIRE to identify all workloads and issue to them X.509-SVIDs, (2) the Envoy proxy adjacent to each workload to, using X.509-SVIDs, ensure all messages sent between workloads are authenticated and mTLS-encrypted and (3) an Envoy filter that, before passing an authenticated request through to the destination workload, first ensures the request matches an authorization policy that requires that only certain workloads are allowed to send and receive messages between each other.

# Service Meshes
_e.g. [Istio](https://istio.io/), Open Service Mesh, Consul Connect, or [Grey Matter](https://greymatter.io)_

A service mesh aims to simplify communication between workloads by providing features such as automatic authentication and authorization and enforcing mutual TLS between workloads. To provide these capabilities, a service mesh typically provides integrated tooling that: (1) identifies workloads, (2) mediates communication between workloads, usually through a proxy deployed adjacent to each workload, and (3) ensures each adjacent proxy enforces a consistent authentication and authorization policy (usually through an authorization policy engine).

Many service mesh implementations have adopted partial implementations of the SPIFFE specification (including Istio and Consul) and thus can be considered SPIFFE identity providers, and some (such as Grey Matter or Open Service Mesh) actually incorporate SPIRE as a component of their solution. 

Service mesh solutions that specifically implement the SPIFFE Workload API should be able to support any software that expects this API to be available. Service mesh solutions that can deliver SVIDs to their workloads _and_ support the SPIFFE Federation API can establish trust automatically between mesh-identified workloads and workloads running SPIRE, or running on different mesh implementations.

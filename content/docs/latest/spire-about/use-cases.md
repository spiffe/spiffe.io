---
title: SPIRE Use Cases
short: Use Cases
description: How to use SPIRE to solve common problems
kind: spire-about
weight: 100
aliases:
    - /spire/usecases
    - /docs/latest/spire-integrations/use-cases/use-cases
---

# Authenticating workloads in untrusted networks using mTLS

When sending messages between distributed software systems, it is common to rely on the network to determine the identity of the system that sent a message, to ensure that messages can only be received by systems that are authorized to view them, and to ensure that the message has not been seen or modified in transit by a malicious party.

However, for complex distributed applications - which may span multiple networks that share many services deployed by different teams - it may be undesirable to rely on the network to protect communication. Mutual [Transport Layer Security](https://en.wikipedia.org/wiki/Transport_Layer_Security) (mTLS) is a well established technology that relies on asymmetric cryptography to prove the identity of the sender and recipient of a message, as well as assert that the message has not been viewed or modified in transit by a third party. It is thus useful for establishing communication in potentially untrusted networks.

SPIRE is designed to enable widespread deployment of mTLS between workloads in distributed systems by:

1.   [Attesting](/docs/latest/spire/understand/concepts/#attestation) the identity of workloads in a distributed software system at runtime.
2.   Delivering workload-specific, short lived, automatically rotated keys and certificates ([X.509-SVIDs](/docs/latest/spiffe/concepts/#spiffe-verifiable-identity-document-svid)) suitable for establishing mTLS directly to workloads via the [Workload API](/docs/latest/spiffe/concepts/#spiffe-workload-api).

To use SPIRE to establish mTLS between a number of workloads requires the following:

1.   [Install a SPIRE Server](/docs/latest/spire/installing/install-server/) into target environment.
2.   [Install a SPIRE Agent](/docs/latest/spire/installing/install-agents/) on each physical or virtual machine running their target environment.
3.   [Configure Node Attestation](/docs/latest/spire/using/configuring/#configuring-node-attestation) and [Workload Attestation](/docs/latest/spire/using/configuring/#configuring-workload-attestation).
4.   Create registration entries to identify specific workloads in the target environment.
5.   Configure each workload to use the keys and X.509 certificates delivered via the SPIFFE Workload API exposed by the SPIRE Agent to establish mTLS connections. This may be accomplished by [having the workload retrieve and interact with these keys and certificates directly](/docs/latest/spiffe/concepts/#spiffe-verifiable-identity-document-svid), OR using a proxy ([such as Envoy](/docs/latest/spire-integrations/envoy/envoy/)) to establish inbound or outbound mTLS connections on behalf of the workload.

# Authenticating two workloads using JWT-based authentication

While mTLS is useful for securing communication between workloads across untrusted networks, it is generally used to authenticate a _channel_ between two specific workloads. A complementary means of authenticating a message is to use a [JSON Web Token](https://jwt.io/) (JWT), which is a JSON payload structured in a particular manner and signed by the sender using a private key known only to them. The private key can then be verified by a receiving workload in possession of a corresponding public key. 

Unlike mTLS, using JWTs does not normally provide a means to guarantee the integrity of a message sent and can, if used improperly, be subject to replay attacks if a malicious actor can obtain a valid JWT. But JWTs can be used to authenticate messages between workloads when direct mTLS may not be possible (for instance, if a Layer 7 load balancer is on the network path between them), or when several workloads may send messages over a single encrypted channel.

SPIRE supports a specific form of JWT that is specifically designed to encode SPIFFE IDs, the [JWT-SVID](/docs/latest/spiffe/concepts/#spiffe-verifiable-identity-document-svid). SPIRE can simplify the widespread deployment of JWT-SVIDs between workloads in distributed systems by:

1.   [Attesting](/docs/latest/spire/understand/concepts/#attestation) the identity of a workload in a distributed software system at runtime.
2.   Generating JWT-SVIDs on behalf of a workload via the [Workload API](/docs/latest/spiffe/concepts/#spiffe-workload-api).
3.   Validating JWT-SVIDs on behalf of a workload via the [Workload API](/docs/latest/spiffe/concepts/#spiffe-workload-api).

To use SPIRE to authenticate workloads using JWTs requires the following:

1.   [Install a SPIRE Server](/docs/latest/spire/installing/install-server/) into target environment.
2.   [Install a SPIRE Agent](/docs/latest/spire/installing/install-agents/) on each physical or virtual machine running their target environment.
3.   [Configure Node Attestation](/docs/latest/spire/using/configuring/#configuring-node-attestation) and [Workload Attestation](/docs/latest/spire/using/configuring/#configuring-workload-attestation).
4.   Create registration entries to identify specific workloads in the target environment.
5.   Configure each workload to generate or verify JWTs delivered via the SPIFFE Workload API exposed by the SPIRE Agent. This may be accomplished by [having the workload retrieve and interact with these JWT-SVIDs directly](/docs/latest/spiffe/concepts/#spiffe-verifiable-identity-document-svid), OR using a proxy ([such as Envoy](/docs/latest/spire-integrations/envoy/envoy/)) to attach and verify JWTs to messages on behalf of the workload automatically.

{{< scarf/pixels/medium-interest >}}

---
title: SPIFFE Concepts
sidebar:
  label: Concepts
  order: 200
---

### Workload

A workload is software running with a particular configuration and purpose, such as a web service, database, or queue worker. Several instances can share one identity. The runtime must isolate workloads so that one cannot steal another's credentials.

### SPIFFE ID

A SPIFFE ID names a workload within a trust domain. In `spiffe://example.org/payments`, `example.org` is the trust domain and `/payments` identifies the workload. The [SPIFFE ID specification](/docs/spiffe/specs/spiffe-id/) defines the URI syntax.

### Trust Domain

A trust domain is an identity authority's namespace. It groups workloads governed by a common identity policy. Separate environments can use separate trust domains and establish [federation](/docs/spiffe/specs/federation/) when they need to authenticate each other's workloads.

### SPIFFE Verifiable Identity Document (SVID)

An SVID binds a SPIFFE ID to a cryptographically verifiable document. SPIFFE has two stable SVID profiles:

- An **X.509-SVID** carries the SPIFFE ID in a certificate's URI subject alternative name. A TLS peer presents its certificate chain and proves possession of the corresponding private key. Validation checks the chain against the correct trust domain's authorities, validity periods, and the [X.509-SVID profile](/docs/spiffe/specs/x509-svid/), including its identity and certificate constraints.
- A **JWT-SVID** carries the SPIFFE ID in the `sub` claim. Validation checks the signature with the trust domain's JWT verification keys, the intended audience, expiration, and the other requirements of the [JWT-SVID profile](/docs/spiffe/specs/jwt-svid/). JWT-SVIDs are bearer credentials: a holder can present one until it expires, so keep it confidential and request an audience specific to its recipient.

A valid SVID authenticates an identity. The receiving application's authorization policy decides what that identity may do. Use a SPIFFE library or integration that implements the full validation profile.

### SPIFFE Workload API

The local Workload API identifies the calling workload using its runtime context. A workload does not need to supply a preconfigured identity or bootstrap secret to call it.

For X.509, the API streams the workload's SVID chain, private key, and trust bundles, with updates as credentials and authorities rotate. For JWT, the workload requests a JWT-SVID for a specified audience. It can also retrieve JWT verification bundles or ask the API to validate a JWT-SVID. Applications should follow credential updates and obtain fresh JWT-SVIDs before expiration.

### Trust Bundle

A trust bundle contains the public verification material for a trust domain. X.509 bundles contain CA certificates. JWT bundles contain public JSON Web Keys, represented as a JWK Set, rather than certificate chains. Keep bundles current as the authority rotates keys. Federation provides bundles for other trusted domains; authorization remains an application decision.

<span id="spec"></span>

## Further Reading

Read the [stable profiles and incubating specifications](/docs/spiffe/specs/) for normative requirements and maturity labels.

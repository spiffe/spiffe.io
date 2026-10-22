---
title: Identity in high-assurance systems
description: Establish what an identity proves, protect its issuing authority, and constrain where it is accepted.
editUrl: false
---

High-assurance systems need an explicit basis for trusting a workload. SPIFFE supplies a common identity format and verification model. The deployment determines the strength of the evidence behind each identity.

## Make issuance answerable to evidence

Start with the operations an identity may authorize. A service that requests a decryption key needs a different policy from a service that publishes public telemetry.

Choose node attestation for the environment you operate. Hardware-backed methods can establish possession of a device credential. Measurement-based methods can check selected platform state against policy. Inspect the chosen plugin's claims: possession of a TPM key and verification of boot measurements are different checks. SPIRE's [attestation extension documentation](/docs/spire/planning/extending/) identifies available integrations.

Workload attestation then determines which local process can obtain an identity. Protect registration rules and the authority allowed to change them. Host compromise can undermine the evidence supplied about that process.

## Separate administrative authority

Use trust domains where teams need independent issuing authorities. Configure accepted foreign domains explicitly and authorize the particular SPIFFE IDs permitted to perform an operation. A trust-domain name carries no inherent security classification or release authority.

Protect issuing keys and workload keys according to their exposure. Review who can change trust bundles and authorization policy. A single administrator with control over every layer can defeat intended separation.

## Plan for interrupted connectivity

Distinguish existing connections from new authentication and credential renewal. Each can fail at a different point. Set an operating limit for stale bundles and policy, and define what happens when credentials expire. Test restart and recovery within the expected outage.

Post-quantum algorithms are an implementation choice that requires compatible credentials and peers. A SPIFFE ID alone says nothing about the algorithms negotiated on a connection. Evaluate the deployed profile and its trust chain.

## Apply identity to a specific decision

- [Authenticate the principals that sign models and application records](/docs/spiffe/use-cases/models-and-signed-records/).
- [Control access to encrypted data through an authenticated key service](/docs/spiffe/use-cases/encrypted-data/).
- [Compare commercial offerings](/ecosystem/commercial/) against the interfaces and evidence your deployment requires.

These are design considerations, not an assurance level or certification defined by SPIFFE. Validate the complete system against its own threat model and acceptance criteria.

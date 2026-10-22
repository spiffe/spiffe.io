---
title: Models and signed application records
description: Use workload identity to authenticate publishing, verification, and recording services.
editUrl: false
---

A model publishing pipeline is a workload. So are a deployment verifier and a service recording AI interactions. SPIFFE can identify these principals. An artifact's digest identifies its content; the application's signing protocol binds that content to an authorized signer.

The following is an integration pattern. It is not an additional SPIFFE specification or a model-verification feature supplied by every implementation.

## Bind a model release to its publishing principal

1. Give the publishing pipeline its own SPIFFE ID, such as `spiffe://build.example/model-publisher`.
2. Authenticate that pipeline to a signing service or compatible certificate authority. Authorize which model releases it may sign.
3. Sign a manifest covering the exact model artifacts and the metadata required by the release policy. Store the signature and verification material with the release.
4. Before loading the model, have the verifier check the artifact digests, signature, and authorized signer under the deployment's release policy.

Use credentials suitable for the artifact-signing protocol. An X.509-SVID used for connection authentication is not automatically a code-signing certificate. [Fulcio's architecture](https://github.com/sigstore/architecture-docs/blob/main/fulcio-spec.md) describes an example of a signing certificate authority with SPIFFE identity support. Confirm the accepted identity path and issuer configuration for the service you deploy.

The verifier can use its own SPIFFE identity when accessing a protected registry or recording its decision. Its identity establishes which service performed that operation. The signature check still requires its own artifact trust policy.

## Keep model provenance and runtime identity distinct

A signed model manifest establishes what an accepted publisher signed. A serving workload's SVID authenticates that workload. Establishing which model it actually loaded requires additional runtime evidence tied to the artifact digest.

Neither result establishes the model's accuracy or suitability for a particular decision. Retain the evaluation evidence separately.

## Identify an AI notary's statement

A notary service can sign a record of an interaction it observed. Make the notary's identity, captured fields, and referenced workload explicit. A notary's signature attributes the record to the notary; attributing it to the responding application requires that application's own evidence.

Retain the signature and its verification material alongside the record. Define the policy for certificate expiry and signer compromise. Evidence about signing time needs its own trusted basis.

For a documented implementation, the [commercial directory](/ecosystem/commercial/) includes Quantum Helix's optional Notary. Its supported capture path and signature scope are described in the linked product documentation.

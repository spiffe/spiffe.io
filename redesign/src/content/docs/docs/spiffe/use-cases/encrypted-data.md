---
title: Control access to encrypted data
description: Authenticate the principal requesting a key, then apply the data access policy.
editUrl: false
---

A broker can route encrypted objects without receiving their decryption keys. A separate key service authenticates consumers and decides whether to release the material needed to read an object. SPIFFE supplies the workload identity used in that decision.

## Authenticate the key requester

A compatible key service validates the caller's SVID against configured trust material. It then maps that authenticated identity to the claims used by its authorization policy. Receiving ciphertext or holding an accepted identity does not grant every key.

The policy can consider the caller's role and the requested operation alongside the object's attributes. Claims need an authoritative source. A string supplied by the requesting application is not established merely because the connection is authenticated.

## Example: CABE and khaled

[CABE](https://cabespec.org/) defines an encrypted Envelope and a protocol for obtaining keys under an attribute-based access policy. Its reference key server, [khaled](https://khaled.cabespec.org/), supports X.509-SVID client authentication. Claims mapping and policy evaluation are separate plugin responsibilities.

An application authenticates to the Key Service, requests key access, and uses a CABE client to protect or recover the payload. The broker carries the Envelope. SPIFFE authenticates the requesting principal; CABE supplies the object-protection and key-access mechanisms.

This requires an explicit client and server integration. Enabling SPIFFE or a transport proxy does not automatically encrypt application objects with CABE.

## Preserve the boundaries

Once a recipient holds usable keys or plaintext, a later policy change cannot erase those copies. Define the behavior of cached key material and recovery separately from SVID rotation.

SPIFFE federation establishes which foreign identities can be recognized. CABE federation concerns key material shared between CABE Domains. Their trust decisions require separate configuration.

A successful authentication or key-access decision also does not establish permission to release information across a classification boundary. That decision belongs to the applicable information authority and approved transfer process.

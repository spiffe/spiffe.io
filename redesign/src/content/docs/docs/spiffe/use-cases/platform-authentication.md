---
title: Authenticate to platforms
description: Use workload identity with platforms and services that support SVID-based
  authentication.
editUrl: false
---

A compatible platform can validate an SVID directly or exchange it for a platform credential. The platform's policy maps that authenticated workload to the access it receives.

## Select the credential path

| Destination | Authentication path | Implementation guide |
| --- | --- | --- |
| AWS | Exchange an X.509-SVID through IAM Roles Anywhere, or use a JWT-SVID with a configured OIDC identity provider | [AWS SPIFFE Workload Helper](https://github.com/spiffe/aws-spiffe-workload-helper), [SPIRE OIDC tutorial](/docs/spire/integrations/platforms/oidc-federation-aws/) |
| Google Cloud | Use Workload Identity Federation with a configured provider and attribute mapping | [Google Cloud documentation](https://cloud.google.com/iam/docs/workload-identity-federation) |
| Vault | Use its SPIFFE authentication method or a JWT authentication configuration | [Vault SPIFFE method](https://developer.hashicorp.com/vault/docs/auth/spiffe), [SPIRE JWT tutorial](/docs/spire/integrations/platforms/vault/) |

## Keep identity and access policy separate

Configure the expected trust domain and workload identities. For JWT-SVIDs, use the audience expected by the relying party. Scope the platform role to the operations the workload needs.

An OIDC discovery endpoint publishes verification metadata for compatible systems. It does not make SPIFFE federation and OIDC federation the same protocol.

## Existing applications

Some applications need credentials delivered as files, or a proxy in front of them. The [SPIFFE Helper](https://github.com/spiffe/spiffe-helper) can write SVID material to disk. Configure the application to reload rotated credentials and validate the peer identity according to its capabilities.

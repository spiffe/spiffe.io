# Application patterns, assurance, and API authentication review

Checked 22 October 2026. These pages propose application patterns for community review. They do not add requirements to SPIFFE or declare a certification program.

| Page | Evidence and editorial boundary |
| --- | --- |
| `high-assurance` | Uses SPIFFE identity, federation, and SPIRE attestation mechanisms already described in the migrated documentation. Hardware credential possession and platform measurement are explicitly distinct. Algorithm profiles remain implementation-specific. |
| `models-and-signed-records` | Separates model content digests, publishing principals, serving workload identity, and a notary's signed observation. [Fulcio architecture](https://github.com/sigstore/architecture-docs/blob/main/fulcio-spec.md) establishes an existing SPIFFE-aware signing authority example. The model workflow is a proposed integration pattern, not a tested tutorial or a Quantum Helix model-signing feature. |
| `encrypted-data` | [CABE](https://cabespec.org/) describes object protection and key access. [khaled](https://khaled.cabespec.org/) explicitly documents X.509-SVID authentication and separate claims mapping. No automatic CABE integration, immediate revocation of released keys, or classification-transfer approval is claimed. |

The Messier 42 entry uses the same alphabetical order, source links, and capability format as other commercial records. Its high-assurance positioning is supported by named controls; it does not claim government adoption or a military certification. Its [Notary documentation](https://messier42.com/engineering/evidence/) states the supported capture paths and identifies the Notary as signer. Its [security model](https://messier42.com/security/) states the remaining host, policy, and authority dependencies.

The four new pages use the existing documentation layout and search pipeline. They require subject-matter review before publication on the official site. None of the new text is presented as normative specification content.

## AI API authentication

`ai-api-authentication` separates JWT-SVID acquisition, provider token exchange, and API authorization. OpenAI and Anthropic were checked independently on 22 October 2026 against their linked SPIFFE guides and exchange references. OpenAI uses the token-exchange grant and a configurable dedicated audience; Anthropic uses the JWT-bearer grant and `https://api.anthropic.com`. Both require issuer, issued-at, expiry, subject, audience, and a JWKS key selected by `kid`. Provider configuration and delegated user authorization remain distinct.

The OpenAI reference requires a supported `alg` but does not enumerate algorithms on the pages reviewed; the guide therefore links that requirement without inventing a list. Anthropic documents RSA/ECDSA algorithms, lifetime and replay checks, and scope/role intersection. [OpenAI's general configuration guide](https://developers.openai.com/api/docs/guides/workload-identity-federation) additionally documents uploaded JWKS and issuer matching. SPIRE issuer and discovery settings were cross-checked with the upstream server and OIDC Discovery Provider references linked in the guide. The provider pages own SDK/configuration examples. Live token exchanges require configured provider accounts and were not executed.

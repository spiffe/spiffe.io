---
title: Authenticate to AI APIs
description: Exchange a JWT-SVID for an OpenAI or Claude API access token.
editUrl: false
---

A workload with a SPIFFE identity can authenticate to OpenAI or the Claude API through workload identity federation. Configure the service to trust your issuer and map selected SPIFFE IDs to a service account.

## Obtain, exchange, call

1. **Obtain a JWT-SVID.** Request the provider's audience from the [Workload API](/docs/spiffe/specs/workload-api/), in the application's workload context. Use a SPIFFE client library or a helper that supplies a refreshed token file.
2. **Exchange it for an access token.** The provider verifies the JWT signature and claims, then applies its configured mapping or federation rule.
3. **Call the API.** Send the returned access token as `Authorization: Bearer <token>`. A federation-capable provider SDK can manage exchange and renewal. Fetch fresh JWT-SVIDs as needed and renew access tokens before expiry.

The [JWT-SVID profile](/docs/spiffe/specs/jwt-svid/) requires `sub` (the SPIFFE ID), `aud`, and `exp`. Both providers additionally require `iss`, `iat`, and a `kid` header identifying a public signing key. Configure these explicitly when selecting an issuer. A JWT-SVID remains a workload credential; OIDC discovery supplies its verification metadata.

## OpenAI configuration

Follow [OpenAI's SPIFFE guide](https://developers.openai.com/api/docs/guides/workload-identity-federation/spiffe) for current setup and SDK examples.

- **Issuer and audience:** configure the JWT's `iss` as the provider issuer. Request a single dedicated audience matching OpenAI's configuration, for example `https://api.openai.com/v1` or your chosen service-specific identifier.
- **Signing keys:** publish public JWKS through OIDC discovery, or upload the full JWKS object with its `keys` array. Use a supported signing algorithm and matching `kid`; keep the configured keys current during rotation.
- **Authorization:** map the workload's `sub` to an OpenAI project service account. Prefer an exact SPIFFE ID. Mapping permissions can further restrict the account's access.

The [exchange endpoint](https://developers.openai.com/api/reference/workload-identity-federation) is `https://auth.openai.com/oauth/token`. Its JSON request uses the `urn:ietf:params:oauth:grant-type:token-exchange` grant, the JWT-SVID as `subject_token`, `subject_token_type` set to `urn:ietf:params:oauth:token-type:jwt`, `identity_provider_id`, and `service_account_id`. The access token expires no later than the subject token.

## Anthropic / Claude configuration

Follow [Anthropic's SPIFFE guide](https://platform.claude.com/docs/en/manage-claude/wif-providers/spiffe) for current setup and SDK examples.

- **Issuer and audience:** `iss` must exactly match the registered `issuer_url`. Request `https://api.anthropic.com` as the audience and match it in the federation rule.
- **Signing keys:** configure discovery, an explicit JWKS URL, or inline public keys. Inline mode takes the `keys` array. The JWT needs a matching `kid` and a supported RSA or ECDSA signature.
- **Claims:** use unexpired tokens with `iat` in the past and honor `nbf` when present. Keep `exp` minus `iat` within the issuer's allowed lifetime, one hour by default. The verifier allows 30 seconds of clock skew. With the default replay check, a JWT containing `jti` can be exchanged only once.
- **Authorization:** match the SPIFFE ID exactly using `subject_prefix` without a wildcard. Select a service account, its workspace, and an OAuth scope such as `workspace:inference`. Every configured claim matcher must pass; permissions are bounded by the rule and the account's role.

The [WIF reference](https://platform.claude.com/docs/en/manage-claude/wif-reference) specifies `https://api.anthropic.com/v1/oauth/token`. Its JSON request uses the `urn:ietf:params:oauth:grant-type:jwt-bearer` grant, the JWT-SVID as `assertion`, and the federation rule, organization, and service account IDs. Include `workspace_id` when the rule enables multiple workspaces.

## Using SPIRE as the issuer

[SPIRE](/docs/spire/about/) is a production-ready SPIFFE implementation with node and workload attestation. Set the server's [`jwt_issuer`](https://spiffe.io/docs/latest/deploying/spire_server/) to the issuer URL registered with the API provider. The [SPIRE OIDC Discovery Provider](https://github.com/spiffe/spire/blob/main/support/oidc-discovery-provider/README.md) publishes discovery metadata and JWT verification keys; align its issuer with the server's. Configure its key source and HTTPS serving mechanism using the upstream instructions.

For uploaded or inline JWKS, arrange updates with signing-key rotation. Protect the Workload API socket and token files, and keep workload clocks synchronized.

## Workload and user authorization

This flow authenticates software and grants it the mapped service account's API access. When an agent acts for a person, use a separate delegated authorization flow to capture that person's consent and permitted actions. Bind that authorization to the operation your application performs; a workload's SPIFFE ID alone does not convey a user's authority.

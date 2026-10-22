---
title: Authenticate between services
description: Use X.509-SVIDs for mutually authenticated TLS.
editUrl: false
---

Use X.509-SVIDs to authenticate the client and server in a TLS connection. The receiving application evaluates the peer's SPIFFE ID against its access policy.

## The connection

1. Each workload obtains an X.509-SVID and trust bundles from its Workload API.
2. Each TLS peer presents its SVID and proves possession of the corresponding private key.
3. The application verifies the certificate chain and authorizes the authenticated SPIFFE ID.

An encrypted connection alone is insufficient. Configure which peer identities may connect. A valid identity in the same trust domain does not automatically grant access.

## Choose an integration

The [go-spiffe X.509 examples](https://github.com/spiffe/go-spiffe/tree/main/v2/examples/spiffe-tls) show direct integration in Go. The [ecosystem directory](/ecosystem/) includes other language libraries and proxies.

For a proxy deployment, start with the [SPIRE and Envoy X.509-SVID tutorial](/docs/spire/integrations/services/envoy-x509/).

## Operational behavior

Use a library or proxy that follows credential updates. A process that loads a certificate once and never reloads it will eventually use an expired SVID.

[Read the X.509-SVID profile](/docs/spiffe/specs/x509-svid/) and the [Workload API specification](/docs/spiffe/specs/workload-api/).

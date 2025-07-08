---
title: Working with SVIDs
short: Working with SVIDs
kind: deploying
description: How to write code to work with SPIFFE SVIDs
weight: 130
aliases:
    - /spiffe/svids
    - /docs/latest/spire/developing/svids
---

A SPIFFE-compatible identity provider such as SPIRE will expose [SPIFFE Verifiable Identity Documents](/docs/latest/spiffe/concepts/#spiffe-verifiable-identity-document-svid) (SVIDs) via the [SPIFFE Workload API](/docs/latest/spiffe/concepts/#spiffe-workload-api). Workloads can use SVIDs retrieved from this API to verify the provenance of a message or to establish mutual TLS secured channels between two workloads. 

# Interacting with the Workload API

Developers coding a new workload that needs to interact with SPIFFE can interact directly with the SPIFFE Workload API to:

* Retrieve the workload's identity, described as a SPIFFE ID such as `spiffe://prod.acme.com/billing/api`

* Generate short-lived keys and certificates on behalf of the workload, specifically:
 * A private key tied to that SPIFFE ID that can be used to sign data on behalf of the workload. 
 * A corresponding short-lived X.509 certificate - an [X509-SVID](https://github.com/spiffe/spiffe/blob/main/standards/X509-SVID.md). This can be used to establish TLS or otherwise authenticate to other workloads.
 * A set of certificates – known as a [trust bundle](/docs/latest/spiffe/concepts/#trust-bundle) – that a workload can use to verify an X.509-SVID presented by another workload in the same trust domain or a federated trust domain.
* Generate or validate JSON Web Tokens ([JWT-SVIDs](https://github.com/spiffe/spiffe/blob/main/standards/JWT-SVID.md)) issued on behalf of the workload or another workload in the same trust domain or a federated trust domain.

The Workload API doesn't require any explicit authentication (such as a secret). Rather, the SPIFFE specification leaves it to implementation of the SPIFFE Workload API to determine how to authenticate the workload. In the case of SPIRE, this is achieved by inspecting the Unix kernel metadata collected by the SPIRE Agent when a workload calls the API.

The API is a gRPC API, derived [from a protobuf](https://github.com/spiffe/go-spiffe/blob/main/v2/proto/spiffe/workload/workload.proto). The [gRPC project](https://grpc.io/) provides tools to generate client libraries from a protobuf in a variety of languages.

## Working with SVIDs in Go 

If you are developing in Go, the SPIFFE project maintains a Go client library that provides:

* A command-line utility to parse and verify SPIFFE identities encoded in X.509 certificates as described in the SPIFFE Standards.
* A client library that provides an interface to the SPIFFE Workload API.

You can find the library as well as links to the GoDoc on [GitHub](https://github.com/spiffe/go-spiffe).

# Using the SPIFFE Helper utility

The [SPIFFE Helper](https://github.com/spiffe/spiffe-helper) utility is a general purpose utility that is useful when building or integrating with applications that cannot write to the Workload API directly. Broadly, the helper is able to:

* Retrieve X.509-SVIDs, keys and trust bundles (certificate chain) needed to validate X.509-SVIDs and write them to a specific location on disk
* Launch a child process that can use those keys and certificates
* Monitor the expiration time of the same, and pro-actively request refreshed certificates and keys from the Workload API as required
* Signal any launched child process once the rotated certificates have been obtained

# Using the SPIRE Agent

The SPIRE Agent binary can be used as an _implementation_ of the SPIFFE Workload API when configured as part of a SPIRE deployment, but it can also be run as a client of the Workload API and provides some simple utilities to interact with it to retrieve SPIFFE credentials. 

For example, running:

```
sudo -u webapp ./spire-agent api fetch x509 -socketPath /run/spire/sockets/agent.sock -write /tmp/ 
```

will:

1.   Connect to the Workload API on the Unix Domain Socket `/run/spire/sockets/agent.sock` (even if SPIRE is not providing the API)
2.   Retrieve any identities associated with the user that the process is running as (in this case, `webapp`) 
3.   Write the X.509-SVID, private key associated with each of those identities to `/tmp/`
4.   Write the trust bundle (certificate chain) needed to validate X.509-SVIDs issued under that trust domain to `/tmp/` as well

A complete list of relevant commands can be found in the [SPIRE Agent Documentation](/docs/latest/deploying/spire_agent/#command-line-options).

{{< scarf/pixels/high-interest >}}

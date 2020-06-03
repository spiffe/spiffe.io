---
title: SPIFFE Library Usage Examples
description: Writing code in your applications to create SPIFFE-enabled connections
weight: 4
toc: true
aliases:
menu:
  spire:
    weight: 50
    parent: 'spire-try'
---

You can use one of the following libraries to fetch SVIDs and trust bundles from within your applications. These libraries handle the work of interfacing with the SPIFFE Workload API to make your coding easier.

The following code samples demonstrate how to use the libraries to establish and maintain SPIFFE-enabled connections transparently between applications.

# Go

See the [go-spiffe library GitHub page](https://github.com/spiffe/go-spiffe) for more information about the SPIFFE Go library. As of May 2020, a [v2 version](https://github.com/spiffe/go-spiffe/tree/master/v2) of this library is in alpha.

* [SPIFFE to SPIFFE authentication using X.509 SVIDs](https://github.com/spiffe/go-spiffe/tree/master/v2/examples/spiffe-tls)

* [SPIFFE to SPIFFE authentication using JWT SVIDs](https://github.com/spiffe/go-spiffe/tree/master/v2/examples/spiffe-jwt-using-proxy)

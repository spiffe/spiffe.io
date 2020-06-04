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

See the [go-spiffe library GitHub page](https://github.com/spiffe/go-spiffe/tree/master/v2) for more information about the SPIFFE Go library. 

* [SPIFFE to SPIFFE authentication using X.509 SVIDs](https://github.com/spiffe/go-spiffe/tree/master/v2/examples/spiffe-tls)

* [SPIFFE to SPIFFE authentication using JWT SVIDs](https://github.com/spiffe/go-spiffe/tree/master/v2/examples/spiffe-jwt-using-proxy)

# Java

See the [java-spiffe library GitHub page](https://github.com/spiffe/java-spiffe/tree/v2-api) for more information about the SPIFFE Go library. 

* [Federation and TCP Support](https://github.com/spiffe/spiffe-example/tree/master/java-spiffe-federation-jboss)

# C

See the [c-spiffe library GitHub page](https://github.com/spiffe/c-spiffe) for more information about the SPIFFE Go library. 

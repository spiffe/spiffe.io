---
title: SPIFFE Library Usage Examples
short: SPIFFE Library Usage Examples
description: Writing code in your applications to create SPIFFE-enabled connections
kind: deploying
weight: 135
aliases:
    - /spire/try/spiffe-library-usage-examples
    - /docs/latest/spire-integrations/using/libraries
---

You can use one of the following libraries to fetch SVIDs and trust bundles from within your applications. These libraries handle the work of interfacing with the SPIFFE Workload API to make your coding easier.

The following code samples demonstrate how to use the libraries to establish and maintain SPIFFE-enabled connections transparently between applications.

# C, C++

See the [c-spiffe library GitHub page](https://github.com/HewlettPackard/c-spiffe) for more information about the SPIFFE C/C++ library, which is under development in 2021. This library replaces an earlier c-spiffe library that was archived.

# Go

See the [go-spiffe library GitHub page](https://github.com/spiffe/go-spiffe/tree/main/v2) for more information about the SPIFFE Go library. 

* [SPIFFE to SPIFFE authentication using X.509 SVIDs](https://github.com/spiffe/go-spiffe/tree/main/v2/examples/spiffe-tls)

* [SPIFFE to SPIFFE authentication using JWT SVIDs](https://github.com/spiffe/go-spiffe/tree/main/v2/examples/spiffe-jwt-using-proxy)

# Java

See the [java-spiffe library GitHub page](https://github.com/spiffe/java-spiffe) for more information about the SPIFFE Java library.

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

See the [c-spiffe library GitHub page](https://github.com/HewlettPackard/c-spiffe) for more information about a SPIFFE C/C++ library. This library is not yet part of the official SPIFFE repo and is still under development in June 2021. An earlier official c-spiffe library became out-of-date and was archived.


# Go

See the [go-spiffe library GitHub page](https://github.com/spiffe/go-spiffe/tree/main/v2) for more information about the SPIFFE Go library. 

* [SPIFFE to SPIFFE authentication using X.509 SVIDs](https://github.com/spiffe/go-spiffe/tree/main/v2/examples/spiffe-tls)

* [SPIFFE to SPIFFE authentication using JWT SVIDs](https://github.com/spiffe/go-spiffe/tree/main/v2/examples/spiffe-jwt-using-proxy)

# Java

See the [java-spiffe library GitHub page](https://github.com/spiffe/java-spiffe) for more information about the SPIFFE Java library.

# Rust

See the [spiffe crate](https://crates.io/crates/spiffe) for more information about the SPIFFE Rust library.
This library is not yet part of the official SPIFFE repo and is still under development. 

# Python

See the [spiffe](https://pypi.org/project/spiffe/) and [spiffe-tls](https://pypi.org/project/spiffe-tls/) for more information about the SPIFFE Python libraries. This libraries are not yet part of the official SPIFFE repo.
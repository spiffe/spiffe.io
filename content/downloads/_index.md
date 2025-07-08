---
title: Get SPIRE
short: Get SPIRE
description: How to install SPIRE
weight: 10
toc: true
---

# Download SPIRE Source and Linux Binaries

The table [below](#spire-releases) lists the available releases for [SPIRE](/docs/latest/spire/understand/). The following is available for each release:

* A tarball for Linux x86_64 operating systems containing:
  * The `spire-agent` and `spire-server` binaries
  * Configuration files for the SPIRE Agent and Server
  * A [Docker Compose](https://docs.docker.com/compose) configuration that enables you to run an agent and a server simultaneously using [Docker](https://docker.com)
* A `.txt` file containing the SHA-256 checksum for the binary tarball
* The SPIRE source code as a zip file
* The SPIRE source code as a tarball

Starting with SPIRE v0.10.0, a `spire-extras` tarball is available that contains the following binaries for Linux x86_64 operating systems:

* [OIDC Discovery Provider](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/support/oidc-discovery-provider/README.md)
* [Kubernetes Workload Registrar](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/support/k8s/k8s-workload-registrar/README.md)

## SPIRE Releases

{{< releases >}}

# Build from Source

To build SPIRE from source on Linux, you'll need:
* `git` - To clone the source from GitHub. Alternatively, you could use `curl` or `wget`.
* `make` - To run the Makefile
* `gcc` - To build the binaries

The build script installs the required toolchain as needed, except for `gcc`. For example, the build script installs a private version of `go` that has been verified to successfully build SPIRE.

To build SPIRE on macOS, see [Building SPIRE on macOS/Darwin](/docs/latest/spire/installing/getting-started-linux-macos-x/#building-spire-on-macosdarwin).

## Fetching

First, fetch the SPIRE repository:

```bash
$ git clone https://github.com/spiffe/spire && cd spire
```

{{< info >}}
The SPIRE codebase uses [Go modules](https://github.com/golang/go/wiki/Modules), which means that the SPIRE repository does *not* need to be in your [`GOPATH`](https://github.com/golang/go/wiki/GOPATH).
{{< /info >}}

## Building

To build the binaries from source:

```bash
$ make build
```

The built binaries are placed in `bin`.

## Getting Help

If you run `make help`, you'll see a complete list of available `make` commands, along with descriptions of what those commands do.

{{< scarf/pixels/high-interest >}}

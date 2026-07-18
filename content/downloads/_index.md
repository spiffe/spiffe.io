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
* A `.txt` file containing the SHA-256 checksum for the binary tarball
* The SPIRE source code as a zip file
* The SPIRE source code as a tarball

Starting with SPIRE v0.10.0, a `spire-extras` tarball is available that contains the following binaries for Linux x86_64 operating systems:

* [OIDC Discovery Provider](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/support/oidc-discovery-provider/README.md)

## SPIRE Releases

{{< releases >}}

# Container Images

Official SPIRE container images are published to the GitHub Container Registry with each release:

* [`ghcr.io/spiffe/spire-server`](https://github.com/spiffe/spire/pkgs/container/spire-server)
* [`ghcr.io/spiffe/spire-agent`](https://github.com/spiffe/spire/pkgs/container/spire-agent)
* [`ghcr.io/spiffe/oidc-discovery-provider`](https://github.com/spiffe/spire/pkgs/container/oidc-discovery-provider)

Images are tagged with the release version number, without the leading `v`. For example, to pull the SPIRE Server and SPIRE Agent images for the latest release ({{< spire-latest "tag" >}}):

```bash
$ docker pull ghcr.io/spiffe/spire-server:{{< spire-latest "version" >}}
$ docker pull ghcr.io/spiffe/spire-agent:{{< spire-latest "version" >}}
```

# Helm Charts

For Kubernetes, the SPIRE stack is packaged as Helm charts by the [helm-charts-hardened](https://github.com/spiffe/helm-charts-hardened) project and published to the Helm repository at `https://spiffe.github.io/helm-charts-hardened/` (also browsable on [Artifact Hub](https://artifacthub.io/packages/helm/spiffe/spire)). This is the easiest and supported way to deploy a complete SPIRE stack in Kubernetes:

```bash
$ helm repo add spiffe https://spiffe.github.io/helm-charts-hardened/
$ helm repo update
```

See [About SPIRE Helm Charts Hardened](/docs/latest/spire-helm-charts-hardened-about/) for installation and configuration instructions.

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

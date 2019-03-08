---
title: Get SPIRE
toc: true
---

# Download pre-built SPIRE Releases

The table [below](#spire-releases) lists the available releases for [SPIRE](/spire). The following is available for each release:

* A tarball containing:
  * The `spire-agent` and `spire-server` binaries
  * Configuration for the SPIRE agent and server
  * A [Docker Compose](https://docs.docker.com/compose) configuration that enables you to run an agent and a server simultaneously using [Docker](https://docker.com)
* A `.txt` file containing checksums for the binary tarball
* The SPIRE source code as a zip file
* The SPIRE source code as a tarball

## SPIRE releases

{{< releases >}}

This document tells you how to build [SPIRE](/spire) from source, perhaps because you'd like to try out an unreleased version.

# Build from Source

## Fetching

First, fetch the SPIRE repository:

```bash
$ git clone https://github.com/spiffe/spire && cd spire
```

{{< info >}}
The SPIRE codebase uses [Go modules](https://github.com/golang/go/wiki/Modules), which means that the SPIRE repository does *not* need to be in your [`GOPATH`](https://github.com/golang/go/wiki/GOPATH).
{{< /info >}}

## Building

{{< requirement >}}
To build SPIRE from source, you'll need [Go 1.11](https://golang.org/dl) or higher.
{{< /requirement >}}

To build the `spire-agent` and `spire-server` binaries from source:

```bash
$ make all
```

The built binaries are available in `cmd/spire-agent/spire-agent` and `cmd/spire-server/spire-server`, respectively.

## Getting help

If you run `make help`, you'll see a complete list of available `make` commands, along with descriptions of what those commands do.

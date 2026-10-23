---
title: Quickstart for Linux and macOS
description: Quickly get SPIRE up and running on Linux and macOS
sidebar:
  label: Quickstart for Linux and macOS
  order: 40
---

Run a SPIRE Server and Agent, register a local workload, and retrieve an X.509-SVID. Run the commands in one shell so that the process IDs remain available for cleanup.

## Prerequisites

Use Linux on x86-64 or ARM64, or macOS with the Xcode command line tools. Install `curl`, `tar`, and `openssl`. The macOS build also needs Git and Go with [automatic toolchain selection](https://go.dev/doc/toolchain) enabled. The selected release's [go.mod](https://github.com/spiffe/spire/blob/@@SPIRE_TAG@@/go.mod) specifies the required Go version; Go downloads that toolchain when needed.

## Installing SPIRE

### Downloading SPIRE for Linux

Select the archive for your machine's architecture:

```sh
case "$(uname -m)" in
  x86_64) arch=amd64 ;;
  aarch64|arm64) arch=arm64 ;;
  *) echo "Use a supported platform from the downloads page"; exit 1 ;;
esac
curl -fLO "https://github.com/spiffe/spire/releases/download/@@SPIRE_TAG@@/spire-@@SPIRE_VERSION@@-linux-${arch}-musl.tar.gz"
tar xzf "spire-@@SPIRE_VERSION@@-linux-${arch}-musl.tar.gz"
cd spire-@@SPIRE_VERSION@@
```

The [downloads page](/downloads/) links the release checksums.

### Building SPIRE on macOS/Darwin

```sh
git clone --single-branch --branch @@SPIRE_TAG@@ https://github.com/spiffe/spire.git
cd spire
mkdir -p bin
GOTOOLCHAIN=auto go build -o bin/ ./cmd/spire-server ./cmd/spire-agent
```

## Starting the SPIRE Server

The example configuration uses the `example.org` trust domain and a local datastore. From the extracted archive or source checkout:

```sh
bin/spire-server run -config conf/server/server.conf >server.log 2>&1 &
server_pid=$!
bin/spire-server healthcheck
```

Wait for `Server is healthy.` before continuing. If startup fails, inspect `server.log`.

## Creating a join token to attest the agent to the server

A join token is a one-use bootstrap credential. Generate one for this agent:

```sh
bin/spire-server token generate -spiffeID spiffe://example.org/myagent
```

Copy the printed token into the next command. For deployments, select a [node attestation method](/docs/spire/deploying/registering/#1-defining-the-spiffe-id-of-the-agent) suited to your platform.

## Starting the SPIRE Agent

```sh
bin/spire-agent run -config conf/agent/agent.conf -joinToken <token_string> >agent.log 2>&1 &
agent_pid=$!
bin/spire-agent healthcheck
```

Wait for `Agent is healthy.` If attestation fails, inspect `agent.log`. The agent authenticates to the server, caches credentials, and exposes the local Workload API.

## Create a registration policy for your workload

Authorize processes owned by your current user to receive `spiffe://example.org/myservice` from this agent:

```sh
bin/spire-server entry create -parentID spiffe://example.org/myagent \
  -spiffeID spiffe://example.org/myservice -selector unix:uid:$(id -u)
```

The UID selector is useful for this local exercise. Choose [workload selectors](/docs/spire/deploying/registering/#2-defining-the-spiffe-id-of-the-workload) that distinguish applications in your deployment.

## Retrieve and view a x509-SVID

The CLI calls the Workload API as a process owned by your user. Write the credentials into a private temporary directory:

```sh
svid_dir=$(mktemp -d)
bin/spire-agent api fetch x509 -write "$svid_dir"
openssl x509 -in "$svid_dir/svid.0.pem" -text -noout
```

The certificate's URI subject alternative name should be `spiffe://example.org/myservice`. The directory also contains its private key and the trust bundle. A running application should use a [Workload API client](/docs/spire/deploying/libraries/) to follow rotations.

## Next steps

Stop the example processes and remove the exported credentials:

```sh
kill "$agent_pid" "$server_pid"
rm -r "$svid_dir"
```

Continue by [configuring SPIRE](/docs/spire/deploying/configuring/) for your environment.

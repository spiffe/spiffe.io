---
title: SPIRE OIDC Discovery Provider
short: Federation
description: Setting up the OIDC Discovery Provider
---
The SPIRE OIDC Discovery Provider provides a REST API to serve OIDC discovery documents. You install and configure a local OIDC Discovery Provider. Currently, the OIDC Discovery Provider is available as a Docker container and as Go source, but not as a pre-built executable.

## Related Documents

The SPIRE OIDC Discovery Provider is needed to configure OIDC federation, such as [OIDC federation with AWS](/spire/try/oidc_federation_aws/).

If you are new to SPIFFE and SPIRE, see the [SPIFFE overview](/spiffe/) and [SPIRE introductory documents](/spire/).

## Required Accounts and Permissions

To configure the SPIRE OIDC Discovery Provider REST API, you'll need:

* Ability to create an instance to contain the OIDC Discovery Provider REST API
* Root access to the instance that contains the OIDC Discovery Provider REST API
* Ability to create or modify a DNS A record for the SPIRE OIDC Discovery Provider REST API
* Ability to allow TCP/IP access to port 443 for the SPIRE OIDC Discovery Provider REST API

## Configuration Overview

The table below summarizes the steps needed to configure SPIRE workload OIDC authentication to AWS S3 buckets. Follow the links for details.

| Step | Action | Description |
| --- | --- | --- |
| Step 1 | [Configure DNS for the Discovery Provider domain](#configure-dns-for-the-spire-oidc-discovery-provider-rest-api-domain) | The DNS name of the resolver must be publicly resolvable |
| Step 2 | [Install the OIDC Discovery Provider](#install-the-oidc-discovery-provider) | It's available as a Docker container or you can compile it from source |
| Step 3 | [Enable listening on port 443](#enable-the-oidc-discovery-provider-to-listen-on-port-443) | Typically done with `setcap` |
| Step 4 | [Configure the OIDC Discovery Provider](#configure-the-oidc-discovery-provider) | Edit `oidc-discovery-provider.conf` |
| Step 5 | [Run the OIDC Discovery Provider](#run-the-oidc-discovery-provider) | Start the executable or Docker image |
| Step 6 | [Test the OIDC Discovery Provider](#test-the-oidc-discovery-provider) | Make sure it's working properly |

## Configure DNS for the SPIRE OIDC Discovery Provider REST API Domain

Configure DNS to make the domain hosting the OIDC Discovery Provider publicly resolvable, such as by an A record or CNAME. Throughout this document, `spire-oidc.example.org` is used as an example SPIRE OIDC Discovery Provider REST API domain.

## Install the OIDC Discovery Provider

Download and install the SPIRE OIDC Discovery Provider using one of the methods below. You typically install the OIDC Discovery Provider on the same machine as the SPIRE Server.

* Get the [Docker container](http://gcr.io/spiffe-io/oidc-discovery-provider) from the Google Container Registry.\
OR
* Download the 0.9.0 (or later) [SPIRE source](/downloads/) and [build it](/downloads#build-from-source). Along with other executables, this creates the `oidc-discovery-provider` executable. Put the `oidc-discovery-provider` executable in a directory in your path. The recommended installation directory is `/opt/spire/bin`.

## Enable the OIDC Discovery Provider to Listen on Port 443

Enable the `oidc-discovery-provider` executable to listen on port 443 by running the following command:
```console
sudo setcap CAP_NET_BIND_SERVICE+eip /opt/spire-server/bin/oidc-discovery-provider
```
On Debian/Ubuntu systems, you may need to install the `libcap2-bin` package first by running `sudo apt install libcap2-bin`.

## Configure the OIDC Discovery Provider

Customize the SPIRE OIDC Discovery Provider configuration file, `oidc-discovery-provider.conf`. The following is an example `oidc-discovery-provider.conf` file for use in SPIRE OIDC federation:

```hcl
log_level = "DEBUG"
domain = "spire-oidc.example.org"
acme {
    directory_url = "https://acme-staging-v02.api.letsencrypt.org/directory"
    cache_dir = "/opt/spire-server/data/acme"
    tos_accepted = true
    email = "maria@example.org"
}
registration_api {
    socket_path = "/tmp/spire-registration.sock"
}
```

At minimum, edit the following options in `oidc-discovery-provider.conf`:

| Option | Description |
| --- | --- |
| `log_level` | Log level, one of `"error"`, `"warn"`, `"info"`, `"debug"`. |
| `domain` | The domain the provider is being served from. You must specify the same domain for the `jwt_issuer` option in the SPIRE Server `server.conf` file. For SPIRE OIDC federation to AWS, you specify this same domain in the **Provider URL** when configuring the [Identity Provider in AWS](/spire/try/oidc_federation_aws/#set-up-an-oidc-identity-provider-on-aws). |
| `directory_url` | The REST API endpoint for serving ACME certificates. If not specified, a Let's Encrypt endpoint is used. |
| `cache_dir` | The directory used to cache the ACME-obtained credentials. Disabled if explicitly set to the empty string. |
| `tos_accepted` | Indicates explicit acceptance of the ACME service Terms of Service. Must be true. |
| `email` | The email address used to register with the ACME service. |
| `registration_api` or `workload_api` | Designates the configuration for either the Registration API or Workload API. When configuring the OIDC Discovery Provider for SPIRE OIDC federation, choose `registration_api`. |
| `socket_path` | Path on disk to the Registration API or Workload API UNIX Domain socket. |

For a complete list of OIDC Discovery Provider configuration options, see the [README](https://github.com/spiffe/spire/blob/1da4e45d39d2f4e8f68a8ff2407c3a78a15113c7/support/oidc-discovery-provider/README.md) on GitHub.

## Run the OIDC Discovery Provider

Start the OIDC Discovery Provider executable or the Docker image.

## Test the OIDC Discovery Provider

TBD

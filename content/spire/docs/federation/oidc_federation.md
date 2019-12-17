---
title: SPIRE OIDC Federation
short: Federation
description: Setting up SPIRE to federate with services
weight: 50
---

Since version 0.8.1, SPIRE contains experimental support for [Open ID Connect](https://openid.net/connect/) (OIDC) federation and SPIRE Server-to-SPIRE Server federation. This document describes how to configure SPIRE for OIDC federation. A companion document describes how to [configure AWS to accept SPIRE workload authentication requests](/spire/docs/federation/oidc_federation_aws).

As OIDC is based on OAuth, SPIRE workloads use JWT [SVIDs](https://spiffe.io/spiffe/#spiffe-verifiable-identity-document-svid) rather than X.509 SVIDs to transmit workload identity information.

## Related Documents

After completing the steps in this document, continue with [configure AWS to accept SPIRE workload authentication requests](/spire/docs/federation/oidc_federation_aws).

Complete installation and configuration of the SPIRE Server and Agent are not described in this document. See the [SPIRE documentation](/spire/docs/) for installation and configuration information.

If you are new to SPIFFE and SPIRE, see the [SPIFFE overview](/spiffe/) and [SPIRE introductory documents](/spire/).

## Required Accounts and Permissions

To configure OIDC federation, you'll need the following:

* [SPIRE Server and Agent](/downloads/) binaries
* Ability to create instances to contain the SPIRE Server and Agent
* Root access to the instances that contain the SPIRE Server and Agent
* Ability to create or modify a DNS A record for the SPIRE OIDC Discovery Provider REST API
* Ability to allow TCP/IP access to port 443 for the SPIRE OIDC Discovery Provider REST API
* Network access to an ACME-compliant CA such as Let's Encrypt

## Configuration Overview

The table below summarizes the steps needed to configure SPIRE workload OIDC authentication to AWS S3 buckets. Follow the links for details.

| Step | Action | Description | 
| --- | --- | --- |
| Step 1 |  [Configure DNS for the OIDC Discovery Provider domain](#configure-dns-for-the-spire-oidc-discovery-provider-rest-api-domain) | The SPIRE OIDC REST API should be resolvable |
| Step 2 | [Prepare installation environments](#prepare-installation-environments) | Decide where you'll install SPIRE components | 
| Step 3 | [Install, configure, and run the SPIRE Server](#install-configure-and-run-the-spire-server) | Customize `server.conf`, including `ca_key_type` and `jwt_issuer` settings |
| Step 4 | [Install, configure, and run the OIDC Discovery Provider](#install-configure-and-run-the-oidc-discovery-provider) | The SPIRE OIDC Discovery Provider serves OIDC discovery documents via a REST API |
| Step 5 | [Install and configure SPIRE Agent](#install-and-configure-the-spire-agent) | Configure  the SPIRE Agent as needed for your environment |
| Step 6 | [Register (Attest) the Node](#register-attest-the-node) | Verify the identity of the node (machine) that the SPIRE Agent runs on |
| Step 7 | [Register Workloads on the SPIRE Server](#register-workloads-on-the-spire-server) | Verify the identity of workloads | 

# Configure SPIRE for OIDC Federation

Follow the procedures in the sections below to configure SPIRE for OIDC federation.

## Configure DNS for the SPIRE OIDC Discovery Provider REST API Domain

As part of configuring OIDC federation, you install the OIDC Discovery Provider component of SPIRE, which is a REST API. Configure DNS to make the domain hosting the OIDC Discovery Provider publicly resolvable, such as by an A record or CNAME.

Throughout this document, `spire-oidc.example.org` is used as an example SPIRE OIDC Discovery Provider REST API domain.

## Prepare Installation Environments

In a typical deployment, you would configure one machine to run the SPIRE Server and OIDC Discovery Provider and a second machine to run the SPIRE Agent. The machines can be a physical machine, virtual machine, instance, or container. The examples in these instructions do not describe how to use Kubernetes or Docker commands to set up OIDC federation, but they are supported.

Review the [requirements](#required-accounts-and-permissions) described above.

## Install, Configure, and Run the SPIRE Server

The steps below provide an overview of installing and configuring the SPIRE Server. For more detailed information, see [Install SPIRE Server](/spire/docs/install-server/). 

1. Set up an instance or machine on which to run the SPIRE Server and OIDC Discovery Provider.

2. [Download](/downloads/) and [install](/spire/docs/install-server/) SPIRE Server.

3. Modify the following two settings in your `server.conf` SPIRE Server configuration file.

| Setting | Example | Description |
| --- | --- | --- |
| `ca_key_type` |  `rsa-2048` | The key type used for the server certificate authority.<br/> Valid key types depend on the service to which you are configuring federation. For example, to authenticate to AWS services, the only valid key type is `rsa-2048`. AWS does not support elliptical curve keys.|
| `jwt_issuer` | `https://spire-oidc.example.org` | The URL to the OIDC discovery-supporting identity provider. This value is put in the "iss" (issuer) claim in JWT-SVIDs created by SPIRE Server.  This should be the same domain that you configure for the `domain` setting in the  OIDC Discovery Provider `oidc-discovery-provider.conf` file. |

4. When initially configuring OIDC federation, you may want to use the Join Token method of [node attestation](/spire/concepts#node-attestation). If so, add the following lines to your `server.conf` file:

```hcl
NodeAttestor "join_token" {
    plugin_data {
    }
} 
```

5. Make any other necessary changes to your SPIRE Server configuration file such as configuring a trust domain, bind port, and data store as described in [Configuring SPIRE](/spire/docs/configuring/). For more information on `server.conf` options, see the
[SPIRE Server Configuration Reference](https://github.com/spiffe/spire/blob/master/doc/spire_server.md#server-configuration-file) on GitHub.

6. Start the SPIRE server. For example, on Linux, run
```
sudo spire-server run  -config /opt/spire/conf/server/server.conf
```

## Install, Configure, and Run the OIDC Discovery Provider

The SPIRE OIDC Discover Provider provides a REST API to serve OIDC discovery documents. Currently, the OIDC Discover Provider is available as a Docker container and as Go source, but not as a pre-built binary.

1. Download and install the SPIRE OIDC Discover Provider, typically on the same machine as the SPIRE Server:

* Get the [Docker container](http://gcr.io/spiffe-io/oidc-discovery-provider) from the Google Container Registry.\
OR
* Download the 0.9.0 (or later) [SPIRE source](/downloads/) and [build it](/downloads#build-from-source). Along with other binaries, this creates the `oidc-discovery-provider` binary. Put the `oidc-discovery-provider` binary in a directory in your path. The recommended installation directory is `/opt/spire/bin`.

2. Enable the `oidc-discovery-provider` binary to listen on port 443 by running the following command:
```console
sudo setcap CAP_NET_BIND_SERVICE+eip /opt/spire-server/bin/oidc-discovery-provider
```
On Debian/Ubuntu systems, you may need to install the `libcap2-bin` package first by running `sudo apt install libcap2-bin`.

3. Customize the SPIRE OIDC Discovery Provider configuration file, `oidc-discovery-provider.conf`. The following is an example `oidc-discovery-provider.conf` file:

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
| `domain` | The domain the provider is being served from. You must specify the same domain for the `jwt_issuer` option in the SPIRE Server `server.conf` file and typically when configuring the service that you are federating SPIRE to, such as Amazon AWS services. |
| `directory_url` | The REST API endpoint for serving ACME certificates. If not specified, a Let's Encrypt endpoint is used. |
| `cache_dir` | The directory used to cache the ACME-obtained credentials. Disabled if explicitly set to the empty string. |
| `tos_accepted` | Indicates explicit acceptance of the ACME service Terms of Service. Must be true. |
| `email` | The email address used to register with the ACME service. |
| `registration_api` or `workload_api` | Designates the configuration for either the Registration API or Workload API. |
| `socket_path` | Path on disk to the Registration API or Workload API UNIX Domain socket. | 
| `trust_domain` | When specifying a Workload API, this setting indicates the trust domain and is used to pick the bundle out of the Workload API response |

For a complete list of OIDC Discovery Provider configuration options, see the [README](https://github.com/spiffe/spire/blob/1da4e45d39d2f4e8f68a8ff2407c3a78a15113c7/support/oidc-discovery-provider/README.md) on GitHub.

## Install and Configure the SPIRE Agent

The steps below provide an overview of installing and configuring the SPIRE Agent. For more detailed information, see [Install SPIRE Agents](/spire/docs/install-agents/). 

1. Set up an instance or machine on which to run the SPIRE Agent, typically a different machine than the SPIRE Server.

2. [Download](/downloads/) and [install](/spire/docs/install-agents/) SPIRE Agent.

4. Make any necessary changes to your SPIRE Agent configuration file such as configuring a trust domain and bind port as described in [Configuring SPIRE](/spire/docs/configuring/). For more information on `agent.conf` options, see the [SPIRE Agent Configuration Reference](https://github.com/spiffe/spire/blob/master/doc/spire_agent.md#agent-configuration-file) on GitHub.

## Register (Attest) the Node

A SPIRE Server identifies SPIRE Agents through the process of [node attestation](/spire/concepts#node-attestation)). This is accomplished through Node Attestor and Node Resolver plugins, which you configure and enable in the server. 

* The following example of node attestation uses the simple Join Token method and creates the SPIFFE ID of `spiffe://spire-oidc.example.org/clientnode` to identify the node.

```console
sudo /opt/spire-server/bin/spire-server token generate -spiffeID spiffe://spire-oidc.example.org/clientnode
```

## Register Workloads on the SPIRE Server

You register workloads to establish an identity fingerprint for the workload and to attach a SPIFFE ID to the workload. For more information about registering workloads see [Configuring workload attestation](/spire/docs/configuring#configuring-workload-attestation).

* Include the node's SPIFFE ID node in the command that you use to register the workload:

```console
sudo /opt/spire-server/bin/spire-server entry create -spiffeID spiffe://spire-oidc.example.org/oidc-test-workload \
-parentID spiffe://spire-oidc-demo.example.org/clientnode -selector unix:uid:1001
```

Here, the SPIFFE ID for the workload is named `spiffe://spire-oidc.example.org/oidc-test-workload`. You'll use this SPIFFE ID when enabling OIDC federation later, such as in the AWS IAM role.

The selector specified here is UNIX user ID 1001, meaning that workloads must run as uid 1001 to be authenticated by SPIFFE.

# Where next?

A companion document describes how to [configure AWS to accept SPIRE workload authentication requests](/spire/docs/federation/oidc_federation_aws/).

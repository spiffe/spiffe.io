---
title: Configuring SPIRE
description: How to configure SPIRE for your environment
weight: 130
toc: true
---

To customize the behavior of the SPIRE Server and SPIRE Agent to meet your application’s needs you edit configuration files for the server and agent. 

The following decisions influence how you set values in the configuration file: 

# Configuring a trust domain 

TODO: What is a trust domain? How to choose one?

Trust domain names must be identical in the server and the agent. 

To configure the server’s trust domain:

1. Edit the server’s configuration (on linux this is typically in **/opt/spire/conf/server/server.conf**, for Kubernetes it is typically in the X confi
2. Locate the section labeled **trust_domain**  
3. Enter the trust domain name you decided on in the [Plan Your Configuration](#plan-your-configuration) section above. 

# Configuring node attestation

This depends on your where your workload is running. Your choice of node attestation method determines which node-attestor plugins you configure SPIRE to use in Server Plugins and Agent Plugins sections of the SPIRE configuration files. You must configure at least one node attestor on the server and only one node attestor on the agent.

## Attestation for Kubernetes nodes {#customize-server-k8s-attestation}
### SAT plugin
TODO: Complete

### PSAT plugin
TODO: Complete

## Attestation for Linux nodes {#customize-server-linux-attestation}

TODO: Much of the content here can be derived from that in Scytale Enterprise
### Join Token
### X.509

## Attestation for Linux nodes on a Cloud Provider {#customize-server-cloud-attestation}
TODO: Much of the content here can be derived from that in Scytale Enterprise
### AWS
### Azure
### GCP

# Configuring workload attestation

Which workload attestation method your application requires. As with node attestation methods, your choice 
depends on the infrastructure your application’s workloads are deployed in (for example, SPIRE supports identifying workloads that run in Kubernetes).

Choosing an appropriate node attestation method is covered in the [agent installation guide](/spire/docs/install-agent).

# Configuring how to store server data

SPIRE employs a database to persist data related to workload identities and registration entries. By default, SPIRE bundles SQLite and sets it as the default for storage of server data. SPIRE currently also supports PostgreSQL. For production purposes, you should carefully consider which database to use. 

# Configuring which key management backend your application requires

The key manager generates and persists the public-private key pair used for the agent SVID.  You must choose whether to store the private key on disk or in memory. For production purposes, you also might consider integrating a custom backend for storage purposes, such as a secret store.

TODO: Complete this.

When you customize these instructions for your architecture, you will substitute the appropriate path values to point to your application’s key and certs.

For a complete server configuration reference, see the [SPIRE Server Configuration Reference](https://github.com/spiffe/spire/blob/master/doc/spire_server.md).

# Configuring which trust root / "upstream CA" your application will use

Configuring which trust root (“upstream certificate authority (CA)”) your application will use

The SPIRE server provides a CA. If you’re, for example, using an external PKI system that provides an upstream CA, you can configure SPIRE to use that instead.

Every SVID issued by a SPIRE installation is issued from a common trust root. SPIRE provides a pluggable mechanism for retrieving this trust root. By default, it uses a key stored on disk. 

TODO: What are the choices here? How to make them?

You configure the plugin by editing the `UpstreamCA “disk”` entry in the server configuration file:

1. Edit the server’s configuration file in  **/opt/spire/conf/server/server.conf**
2. Locate the **UpstreamCA "disk" { .. }** plugin in the **plugins{...}** section
3. Modify the  **key_file_path** and **cert_file_path** appropriately

For simplicity’s sake, here we illustrate CA plugin configuration using a dummy CA key provided in SPIRE, setting the paths as follows:

```shell
key_file_path = "/opt/spire/conf/server/dummy_upstream_ca.key"
cert_file_path = "/opt/spire/conf/server/dummy_upstream_ca.crt"
```

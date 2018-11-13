---
title: Getting started with SPIRE
description: Install and run a SPIRE server and agent locally on your laptop
weight: 2
---

{{< warning >}}
Before getting started running SPIRE locally, we recommend familiarizing yourself with SPIRE's [architecture and design goals](../architecture).
{{< /warning >}}

This document guides you through getting SPIRE up and running in your local environment. We'll set up a SPIRE [server](architecture#server) and [agent](architecture#agent) and use them to issue identities to a workload identified by being run under a specified UNIX user ID.

For the sake of simplicity, we'll install the SPIRE server and agent on the same machine. In an actual deployment, these would typically run on different machines.

{{< info >}}
This guide assumes that you're running **Ubuntu 16.04**.
{{< /info >}}

## Install the SPIRE server and agent

First, fetch the latest tarball for SPIRE (version {{< spire-latest >}}) on GitHub and extract it into `/opt/spire`:

```shell
wget https://github.com/spiffe/spire/releases/download/{{< spire-latest >}}/spire-{{< spire-latest >}}-linux-x86_64-glibc.tar.gz
sudo tar xvf spire-{{< spire-latest >}}-linux-x86_64-glibc.tar.gz
sudo cp -r spire-{{< spire-latest >}}/ /opt/spire
sudo chmod -R 777 /opt/spire/
```

Add the `/opt/spire` directory to your `PATH` for convenience:

```shell
export PATH=/opt/spire:$PATH
```

## Configure the SPIRE server

After extracting the agent and server binaries to the proper location, we need to configure them. The SPIRE server relies on plugins for much of its functionality. Plugin configurations can be found under the `plugins { ... }` section in `/opt/spire/conf/server/server.conf`.

For plugins which are not built in (see the [reference guide](https://github.com/spiffe/spire/blob/master/doc/spire_server.md) for a list of built-ins), ensure that the corresponding configuration includes the path to the appropriate plugin binary:

```shell
plugin_cmd = "/path/to/plugin_binary"
```

Every SVID issued by a SPIRE installation is issued from a common trust root. SPIRE provides a pluggable mechanism for how this trust root can be retrieved. By default, it will use a key distributed on disk. The release includes a dummy CA key that we can use for testing purposes, but the plugin must be configured to find it.

In `server.conf`, identify the `UpstreamCA "disk" { ... }` plugin configuration section, and modify `key_file_path` and `cert_file_path` appropriately:

```conf
key_file_path = "/opt/spire/conf/server/dummy_upstream_ca.key"
cert_file_path = "/opt/spire/conf/server/dummy_upstream_ca.crt"
```

Prebuilt binaries may not have a default `.data` directory. You will need to create it:

```shell
mkdir -p /opt/spire/.data
```

## Configure the SPIRE agent

When connecting to the SPIRE Server for the first time, the agent uses a configured X.509 CA certificate to verify the connection. SPIRE releases come with a "dummy" certificate in the client and server. For a production implementation, a separate key would be generated for the server and certificate to be bundled with the agent.

Edit `/opt/spire/conf/agent/agent.conf` so it looks for the trust bundle at the right path:

```conf
trust_bundle_path = "/opt/spire/conf/agent/dummy_root_ca.crt"
```

As with the server, SPIRE agent relies on plugins which can be configured at `/opt/spire/conf/agent/agent.conf`.

## Joining to the SPIRE server with a join token

We will start a server and join an agent to it using the **join token** attestation method. A join token is a manually generated single-use token that can be used to authenticate a connection. In more sophisticated implementations, SPIRE can be configured to use platform-specific mechanisms to authenticate an agent to a server.

Start your server:

```shell
spire-server run \
    -config /opt/spire/conf/server/server.conf
```

In a different terminal, generate a one-time join token via the `spire-server token generate` subcommand. Use the `-spiffeID` option to associate the Join Token with `spiffe://example.org/host` SPIFFE ID.

```shell
spire-server token generate \
    -spiffeID spiffe://example.org/host
```

The join token will be used for [node attestation](architecture#node-attestation) and the associated SPIFFE ID will be used to generate the SVID of the attested node.

The default time to live (TTL) of the join token is 600 seconds (10 minutes). You can overwrite the default value using the `-ttl` option.

In the same terminal, start the agent using the previously generated token so we can join it with the server.

```shell
spire-agent run \
    -config /opt/spire/conf/agent/agent.conf \
    -joinToken {your previously generated token}
```

## Workload registration

We need to register the workload in the server so we can define under which attestation policy we're going to grant an identity to the workload. Since we're going to register it using a UID UNIX selector that will be mapped to a target SPIFFE ID, we first need to create a new user that we will call workload.

In a new terminal, create the user:

```shell
sudo useradd workload
```

Get the id so we can use it in the next step.

```shell
id -u workload
```

Create a new registration entry using `spire-server entry create`, providing the workload user id.

```shell
spire-server entry create \
    -parentID spiffe://example.org/host \
    -spiffeID spiffe://example.org/host/workload \
    -selector unix:uid:{workload user id from previous step}
```

At this point, the registration API has been called and the target workload has been registered with the SPIRE Server. We can now call the workload API using a command line program to request the workload SVID from the SPIRE Agent.

## Workload SVID retrieval

We will simulate the workload API interaction and retrieve the workload SVID bundle by running the `api` subcommand in the agent. Run the command as the user workload that we created in the previous step.

> If you are running on Vagrant you will need to run `sudo -i` first.

```shell
su -c "spire-agent api fetch x509" workload
# SPIFFE ID:         spiffe://example.org/host/workload
# SVID Valid After:  yyyy-MM-dd hh:mm:ss +0000 UTC
# SVID Valid Until:  yyyy-MM-dd hh:mm:ss +0000 UTC
# CA #1 Valid After: yyyy-MM-dd hh:mm:ss +0000 UTC
# CA #1 Valid Until: yyyy-MM-dd hh:mm:ss +0000 UTC
```

Optionally, you may write the SVID and key to disk with `-write` in order to examine them in detail with OpenSSL.

```shell
su -c "spire-agent api fetch x509 -write /opt/spire/" workload
openssl x509 -in /opt/spire/svid.0.pem -text -noout
# Certificate:
#     Data:
#         Version: 3 (0x2)
#         Serial Number: 4 (0x4)
#     Signature Algorithm: sha256WithRSAEncryption
#         Issuer: C=US, O=SPIFFE
#         Validity
#             Not Before: Dec  1 15:30:54 2017 GMT
#             Not After : Dec  1 16:31:04 2017 GMT
#         Subject: C=US, O=SPIRE
#         Subject Public Key Info:
#             Public Key Algorithm: id-ecPublicKey
#                 Public-Key: (521 bit)
#                 pub:
#                     04:01:fd:33:24:81:65:b9:5d:7e:0b:3c:2d:11:06:
#                     aa:a4:32:89:20:bb:df:33:15:7d:33:55:13:13:cf:
#                     e2:39:c7:fa:ae:2d:ca:5c:d1:45:a1:0b:90:63:16:
#                     6e:b8:aa:e9:21:36:30:af:95:32:35:52:fb:11:a5:
#                     3a:f0:c0:72:8f:fa:63:01:95:ec:d9:99:17:8c:9d:
#                     ca:ff:c4:a7:20:62:8f:88:29:19:32:65:79:1c:b8:
#                     88:5d:63:80:f2:42:65:4b:9e:26:d0:04:5a:58:98:
#                     a3:82:41:b0:ab:92:c9:38:71:00:50:c5:6d:3f:ab:
#                     46:47:53:92:eb:be:42:55:44:1a:22:0b:ef
#                 ASN1 OID: secp521r1
#                 NIST CURVE: P-521
#         X509v3 extensions:
#             X509v3 Key Usage: critical
#                 Digital Signature, Key Encipherment, Key Agreement
#             X509v3 Extended Key Usage:
#                 TLS Web Server Authentication, TLS Web Client Authentication
#             X509v3 Basic Constraints: critical
#                 CA:FALSE
#             X509v3 Subject Alternative Name:
#                 URI:spiffe://example.org/host/workload
#     Signature Algorithm: sha256WithRSAEncryption
#          98:5e:33:14:ff:8e:77:40:1d:da:68:13:34:65:66:29:d0:f3:
#          fa:c7:e5:45:58:4c:13:49:ad:47:4b:8e:ff:ad:e5:72:ca:7d:
#          45:ac:c8:88:3d:66:63:3f:f7:56:0e:34:df:9c:51:9f:7d:b9:
#          99:6f:a2:c8:78:bf:08:8c:02:17:ec:42:b8:5c:a9:e6:58:5a:
#          cb:0f:16:3f:85:8a:08:20:2c:23:61:e3:89:48:f1:f0:bc:73:
#          2a:c0:9c:29:0e:ed:d8:2f:53:2c:82:67:70:6b:14:a1:eb:43:
#          1a:c5:04:0d:82:5b:f4:aa:3b:c5:37:db:22:17:97:ff:dc:d8:
#          01:27:44:29:18:1f:76:a3:9e:6a:50:31:5a:65:09:91:d7:8a:
#          79:03:0c:e9:22:f9:6c:15:02:db:a9:e2:fc:73:15:82:3a:0e:
#          dd:4f:e5:04:b6:84:31:71:0d:ee:c5:b5:5a:21:d0:a9:8d:ec:
#          8c:4d:95:f2:43:b3:e9:ae:81:db:56:37:a2:74:23:69:05:1a:
#          2c:c8:11:09:40:18:67:6f:77:ff:57:ea:73:cd:49:9d:ba:6c:
#          85:70:d7:5c:a5:ba:46:0e:86:a2:c1:1d:27:f2:7a:2d:c1:4b:
#          16:87:b2:97:2f:98:ed:80:2a:5e:62:f4:7f:87:82:ff:67:96:
#          e6:2e:fa:a1
```

## Getting help

If you have any questions about how SPIRE works, or how to get it up and running, the best place to ask questions is the [SPIFFE Slack Organization](https://spiffe.slack.com). Most of the maintainers monitor the #spire channel there, and can help direct you to other channels if need be. Please feel free to drop by any time!

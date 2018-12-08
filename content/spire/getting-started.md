---
title: SPIRE Getting Started Guide
short: Getting started
description: Install and run a SPIRE server and agent locally on your laptop
weight: 2
---

## Before You Begin

Before going further, review some key concepts related to SPIRE and read through the assumptions this guide makes.

### Review These Concepts

This guide requires that you understand a few key terms and concepts:

* workloads and the Workload API
* SPIFFE IDs and SVIDs
* trust domains and trust bundles
* node attestation
* workload attestation

To review these concepts, see the [SPIFFE](/spiffe) and [SPIRE](/spire) overviews. 

### Assumptions

This walkthrough demonstrates how to deploy SPIRE to identify a single workload running on a node running Linux. It sets up the SPIRE Server and SPIRE Agent so that they’re running on the same node. In an actual deployment, these would typically run on different nodes.  

In the walkthrough, the workload to which SPIRE will issue an identity is running under a specific UNIX user id; SPIRE uses will use this user id to generate an SVID for the workload. 

This guide also illustrates node attestation using join tokens -- a pre-shared key between a server and an agent -- the simplest node attestation strategy. 

Finally, this guide assumes the user is running Ubuntu 16.04.

## Step 1: Plan {#step-1}

### Plan Your Configuration

To customize the behavior of the SPIRE Server and SPIRE Agent to meet your application’s needs you edit configuration files for the server and agent. 

Note that the some of the configuration file default settings -- such as those for database choice for server data, key management backend, and upstream -- will work well for most evaluations. 

The following decisions influence how you set values in the configuration file: 

* What you will name your server trust domain and your agent trust domain 

Trust domain names must be identical in the server and the agent. 

* Which node attestation method your application requires 

This depends on your where your workload is running. Your choice of node attestation method determines which node-attestor plugins you configure SPIRE to use in Server Plugins and Agent Plugins sections of the SPIRE configuration files. You must configure at least one node attestor on the server and only one node attestor on the agent. 

For simplicity’s sake, this guide demonstrates using the join token method for node attestation. 

* Which workload attestation method your application requires. As with node attestation methods, your choice depends on the infrastructure your application’s workloads are deployed in (for example, SPIRE supports identifying workloads that run in Kubernetes).

* Which type of database your application will use to store server data

SPIRE employs a database to persist data related to workload identities and registration entries. By default, SPIRE bundles SQLite and sets it as the default for storage of server data. SPIRE currently also supports PostgreSQL. For production purposes, you should carefully consider which database to use. 

* Which key management backend your application requires

The key manager generates and persists the public-private key pair used for the agent SVID.  You must choose whether to store the private key on disk or in memory. For production purposes, you also might consider integrating a custom backend for storage purposes, such as a secret store.

* Which trust root (“upstream certificate authority (CA)”) your application will use

The SPIRE server provides a CA. If you’re, for example, using an external PKI system that provides an upstream CA, you can configure SPIRE to use that instead.

Once you’ve made these decisions, you can [configure the server](#step-4) and [configure the agent](#step-5) accordingly, after [installing them](#step-3-install-the-server-and-agent). 

## Step 2: Obtain the SPIRE Binaries {#step-2}

Pre-built SPIRE releases can be found on the [SPIRE downloads page](/downloads#spire). These releases contain both server and agent binaries.

If you wish, you may also [build SPIRE from source](https://github.com/spiffe/spire/blob/master/CONTRIBUTING.md).

## Step 3: Install the Server and Agent {#step-3}

As stated above, this guide illustrates installs the server and agent on the same node. More typically, your architecture will have the the server installed on one node and one or more agents installed on distinct nodes. 

To install the server and agent:

1. Obtain the latest tarball from [the SPIRE downloads page](/downloads#spire) and then extract it into the **/opt/spire** directory using the following commands:

	```shell
	wget https://github.com/spiffe/spire/releases/download/{{< spire-latest >}}/spire-{{< spire-latest >}}-linux-x86_64-glibc.tar.gz
	sudo tar zvxf spire-{{< spire-latest >}}-linux-x86_64-glibc.tar.gz
	sudo cp -r spire-{{< spire-latest >}}/. /opt/spire/
	```

2. Add `spire-server` and `spire-agent` to your $PATH for convenience:

	```shell
	ln -s /opt/spire/spire-server /usr/bin/spire-server
	ln -s /opt/spire/spire-agent /usr/bin/spire-agent
	```

## Step 4: Configure the Server {#step-4}

To configure the server you:

1. Configure the trust domain
2. Configure the server certificate authority (CA), which might include configuring an UpstreamCA plugin 
3. Configure the node attestation plugin
4. Configure a default **.data** directory for persisting data

However, to get a simple deployment up and running for demonstration purposes, you need only go through steps 1, 2, and 3. 

To configure the items in steps 1, 2, and 3, edit the server’s configuration file, located in **/opt/spire/conf/server/server.conf**.

If you choose to change the default data directory, you do this at the command line.  

### Configure the Server’s Trust Domain

To configure the server’s trust domain:

1. Edit the server’s configuration file in  **/opt/spire/conf/server/server.conf**
2. Locate the section labeled **trust_domain**  
3. Enter the trust domain name you decided on in the [Plan Your Configuration](#plan-your-configuration) section above. 

### Configure the Trusted Root CA Plugin

Every SVID issued by a SPIRE installation is issued from a common trust root. SPIRE provides a pluggable mechanism for retrieving this trust root. By default, it uses a key stored on disk. 

You configure the plugin by editing the `UpstreamCA “disk”` entry in the server configuration file:

1. Edit the server’s configuration file in  **/opt/spire/conf/server/server.conf**
2. Locate the **UpstreamCA "disk" { .. }** plugin in the **plugins{...}** section
3. Modify the  **key_file_path** and **cert_file_path** appropriately

For simplicity’s sake, here we illustrate CA plugin configuration using a dummy CA key provided in SPIRE, setting the paths as follows:

```shell
key_file_path = "/opt/spire/conf/server/dummy_upstream_ca.key"
cert_file_path = "/opt/spire/conf/server/dummy_upstream_ca.crt"
```

When you customize these instructions for your architecture, you will substitute the appropriate path values to point to your application’s key and certs.

### Configure Server Plugins

As described above in the [Plan Your Configuration](#plan-your-configuration) section, before installing and configuring you determine which plugin you configure the server to use for node attestation. You must edit the configuration file to point to the path to the binary of the plugin your application will use. 

1. Edit the server’s configuration file in **/opt/spire/conf/server/server.conf**
2. Locate the **plugin_cmd = { .. }** entry in the **plugins { ... }** section 
3. Set the value to the path to your plugin binary 

For simplicity’s sake, this guide illustrates node attestation using the join token method. Note that SPIRE ships with the default node attestation method set to join token. 

Pre-built binaries must reside in a **.data** directory. Create this directory in the location of your choice. For example: 

```shell
sudo mkdir -p /opt/spire/.data
```

### Server Configuration Reference

For a complete server configuration reference, see the [SPIRE Server documentation](https://github.com/spiffe/spire/blob/master/doc/spire_server.md).

## Step 5: Configure the Agent {#step-5}

When connecting to the SPIRE Server for the first time, the agent uses a configured X.509 CA certificate to verify the initial connection. SPIRE releases include a "dummy" certificate for this purpose. For a production implementation, a separate key should be generated. See the [next section](#generate-a-key).

### Generate a Key

Use the tool of your choice -- such as openssl, cfssl, or an equivalent tool -- to generate a key for the server and certificate, to be bundled with the agent. 

### Configure the Trust Bundle Path

To configure the trust bundle on the agent side, edit the configuration file  so that the agent looks for the trust bundle at the correct path:

1. Edit the agent’s configuration file in  **/opt/spire/conf/agent/agent.conf**
2. Locate the **trust_bundle_path = { .. }** entry 
3. Set the value to  **/opt/spire/conf/agent/dummy_root_ca.crt**

### Configure Agent Plugins

As described above in the [Plan Your Configuration](#plan-your-configuration] section, before installing and configuring you determine which plugin you configure the agent to use for node attestation and workload attestation. 

#### Node Attestor Plugin

{{< warning >}}
The agent node attestor plugin must match the node attestor plugin type you choose when you configured the server.
{{< /warning >}}

For simplicity’s sake, this guide illustrates node attestation using the join token method. As this is SPIRE’s default configuration setting for node attestation, you do not need to make changes to the node attestation plugins section in the agent configuration file. 

#### Workload Attestor Plugin

Choose the workload attestor pertinent to your application, for example, Kubernetes or UNIX.

This guide’s example uses UNIX as a workload attestor plugin. For this reason, the **Workload Attestor** entry in the agent configuration file is set to “unix”.

#### Datastore Plugin

As described above in the [Plan Your Configuration](#plan-your-configuration) section, before installing and configuring you determine whether SPIRE’s default datastore plugin -- SQLite3 -- is sufficient for your application. For high availability, in which you might have multiple SPIRE servers running against your database, you may want to choose the Postgres datastore plugin. 

If your application required that, you would need to edit the DataStore entry in the **plugins** section of the **/opt/spire/conf/server/server.conf** file to specify the Postgres plugin.

#### Keymanager Plugin

During node attestation, the server assigns the agent a SVID; the agent must store a private key for that SVID. The agent receives a signed certificate and must choose between storing it in memory or on disk. 

The advantage of storing it on disk is that the is no need to redo node attestation if the agent is restarted.

The default is to store it in memory. To set it to store its private key on disk, edit the KeyManager entry in the **agent.conf** file:

```conf
KeyManager “disk” {
```

### Agent Configuration Reference

For a complete discussion of agent configuration values, see the section [SPIRE Agent documentation](https://github.com/spiffe/spire/blob/master/doc/spire_agent.md).

## Step 6: Start Up the Server and Agent {#step-6}

In this example, we will start a server and join an agent to it using the join token attestation method. 

Here are the steps:

1. Start up the server, passing in the path to the server configuration file: 

	```shell
	sudo spire-server run  -config /opt/spire/conf/server/server.conf
	```

2. In a different terminal, generate a one time join token using the  **spire-server token generate** sub command. Use the **-spiffeID** option to associate the join token with **spiffe://example.org/host** SPIFFE ID:

	```shell
	sudo spire-server token generate -spiffeID spiffe://example.org/host
	Token: aaaaaaaa-bbbb-cccc-dddd-111111111111
	```

The default Time to Live (ttl) for the join token is 600 seconds. To overwrite the default, pass a different value via the **-ttl** option to the `spire-server token generate` command.

2. Staying in the same terminal, start up the agent, passing in the path to the agent configuration file, as well as the join token you just generated. 

`# sudo spire-agent run  -config /opt/spire/conf/agent/agent.conf -joinToken aaaaaaaa-bbbb-cccc-dddd-111111111111`

You have the option to adding the join token to the **NodeAttestor** entry in the agent configuration file instead of passing it at the command line. 

## Step 7 Register Workloads

In order to enable SPIRE to perform workload attestation -- which allows the agent to identify the workload  workload to attest to its agent --  you must register the workload in the server. This tells SPIRE how to identify the workload and which SPIFFE ID to give it.

On this machine, we have assumed our workload can be most easily identified by its UNIX user ID (UID). Therefore we're going to create this selector using a UID Unix selector that will be mapped to a target SPIFFE ID. We first need to create a new user that we will call "workload":

1. Open a new terminal and create the user:

	```shell
	sudo useradd workload
	```

2. Get the id for use in the next step:

	```shell
	id -u workload
	```

3. Create a new registration entry, providing the workload user id:

	```shell
	sudo spire-server entry create -parentID spiffe://example.org/host \
		-spiffeID spiffe://example.org/host/workload \
		-selector unix:uid:${workload user id from previous step}
	```

You can now [retrieve the SVID via the Workload API](#step-8:-retrieve-workload-svids). 

### More on Registration Entries

The contents of a registration entry vary depending on the platform the workload is running on, but all workload registration entries contain:

the parent ID:  the agent’s SPIFFE ID, which tells SPIRE which agent this workload belongs to  
a ttl for the SVID issued 

Because this guide assumes we’re running on UNIX, we also specify the following selectors:

* UNIX process id
* UNIX user id
* UNIX group id

Not that the minimum requirement for a UNIX kernel selector is just one of these.

## Step 8: Retrieve Workload SVIDs

At this point, the registration API has been called and the target workload has been registered with the SPIRE Server. We can now call the workload API using a command line program to request the workload’s SVID from the agent, as illustrated in the next section.

### Simple Illustration: Retrieve a Workload’s SVID 

If you’re curious to see the contents of a workload SVID, follow the instructions in this section to retrieve the SVID bundle and then write the SVID and key to disk, in order to examine them in detail with openssl.

{{< info >}}
To confirm that OpenSSL is installed, run `sudo dpkg -l openssl`. If it is not installed, install it with `sudo apt -y install openssl`.
{{< /info >}}
 
We simulate the workload API interaction and retrieve the workload SVID bundle by running the `api` subcommand in the agent. Run the command as the user `workload` that we created in the previous section.

{{< info >}}
If you are running on Vagrant you will need to run `sudo -i` first.
{{< /info >}}

```shell
su -c "spire-agent api fetch x509" workload
# SPIFFE ID:         spiffe://example.org/host/workload
# SVID Valid After:  yyyy-MM-dd hh:mm:ss +0000 UTC
# SVID Valid Until:  yyyy-MM-dd hh:mm:ss +0000 UTC
# CA #1 Valid After: yyyy-MM-dd hh:mm:ss +0000 UTC
# CA #1 Valid Until: yyyy-MM-dd hh:mm:ss +0000 UTC
```

Now write the SVID and key to disk:

```shell
su -c "spire-agent api fetch x509 -write /opt/spire/" workload
sudo openssl x509 -in /opt/spire/svid.0.pem -text -noout
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

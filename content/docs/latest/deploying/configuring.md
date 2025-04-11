---
title: Configuring SPIRE
short: Configuring
kind: deploying
description: How to configure SPIRE for your environment
weight: 80
aliases:
    - /spire/docs/configuring
    - /docs/latest/spire/using/configuring
---
To customize the behavior of the SPIRE Server and SPIRE Agent to meet your application’s needs you edit configuration files for the server and agent. 

# How to configure SPIRE

The SPIRE Server and Agent are configured in a file called `server.conf` and `agent.conf` respectively. 

By default the Server expects the configuration file to reside at `conf/server/server.conf`, however the Server can be configured to use a configuration file in a different location with the `--config` flag. See the [SPIRE Server reference](/docs/latest/deploying/spire_server/) for more information.

Similarly, the Agent expects this file to reside at `conf/agent/agent.conf`, however the Server can be configured to use a configuration file in a different location with the `--config` flag. See the [SPIRE Agent reference](/docs/latest/deploying/spire_agent/) for more information.

The configuration file is loaded once when the Server or Agent is started. If the configuration file for either is modified, the Server or Agent must be restarted for the configuration to take effect.

{{< info >}}
When running SPIRE in Kubernetes, it is common to store the configuration file in a [ConfigMap](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/) object that is then mounted as a file into the container running the Agent or Server process.
{{< /info >}}

The SPIRE Agent supports either [HCL](https://github.com/hashicorp/hcl) or [JSON](http://www.json.org/) as the syntax for structuring configuration files. The examples below will assume HCL.

# Configuring a trust domain 
_This configuration applies to the SPIRE Server and SPIRE Agent_

The trust domain corresponds to the trust root of a SPIFFE identity provider. A trust domain could represent an individual, organization, environment or department running their own independent SPIFFE infrastructure. All workloads identified in the same trust domain are issued identity documents that can be verified against the root keys of the trust domain.

Each SPIRE server is associated with a single trust domain that must be unique within that organization. The trust domain takes the same form as a DNS name (for example, `prod.acme.com`), however it does not need to correspond to any DNS infrastructure.

The trust domain is configured in the SPIRE Server before it is first started. It is configured through the `trust_domain` parameter in the `server` stanza in the configuration file. For example, if the trust domain of the server should be configured to `prod.acme.com` then it would be set as:

``` syntaxhighlighter-pre
trust_domain = "prod.acme.com"
```

Similarly, the Agent must be configured to issue identities to the same trust domain by configuring in the `trust_domain` parameter in the `agent` stanza of the Agent configuration file.

A SPIRE Server and Agent can only _issue_ identities to a single trust domain, and the trust domain configured by an agent must match that of the server it is connecting to.

# Configure the Port on which the Server Listens to Agents
_This configuration applies to the SPIRE Server_

By default, the SPIRE Server listens on port 8081 for incoming connections from SPIRE Agents; to choose a different value, edit the `bind_port` parameter in the `server.conf` file. For example, to change the listening port to 9090:

``` syntaxhighlighter-pre
bind_port = "9090"
```

If this configuration is changed from the default on the server, then the configuration of the serving port must also be changed on the agents.

# Configuring node attestation
_This configuration applies to the SPIRE Server and SPIRE Agent_

A SPIFFE Server identifies and attests Agents through the process of *node attestation* (read more about this in [SPIRE Concepts](/docs/latest/spire/understand/concepts/)). This is accomplished through Node Attestor plugins, which you configure and enable in the server. 

Your choice of node attestation method determines which node-attestor plugins you configure SPIRE to use in Server Plugins and Agent Plugins sections of the SPIRE configuration files. You must configure _at least one_ node attestor on the server and _only one_ node attestor on each Agent.

## Attestation of nodes running Kubernetes {#customize-server-k8s-attestation}

To issue identities to workloads running in a Kubernetes cluster, it is necessary to deploy a SPIRE Agent to each node in that cluster that is running a workload ([read more](/docs/latest/spire/installing/install-agents/#installing-spire-agents-on-kubernetes) on how to install SPIRE Agents on Kubernetes).

Service Account Tokens can be validated using the Kubernetes [Token Review API](https://kubernetes.io/docs/reference/kubernetes-api/authentication-resources/token-review-v1/). Because of this, the SPIRE Server does not itself need to be running on Kubernetes, and a single SPIRE Server may support agents running on multiple Kubernetes clusters with PSAT attestation enabled.

### Projected Service Account Tokens

Node attestation using Kubernetes [Projected Service Account Tokens](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/#service-account-token-volume-projection) (PSATs) allows a SPIRE Server to verify the identity of a SPIRE Agent running on a Kubernetes Cluster.

To use PSAT Node Attestation, configure enable the PSAT Node Attestor plugin on the [SPIRE Server](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_server_nodeattestor_k8s_psat.md) and [SPIRE Agent](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_agent_nodeattestor_k8s_psat.md).

{{< info >}}
SAT based node attestation, an earlier alternative to PSAT, is no longer supported as of SPIRE 1.12.0.
{{< /info >}}

## Attestation of nodes running Linux {#customize-server-linux-attestation}

SPIRE is able to attest the identities of workloads running physical or virtual machines (nodes) running Linux. As part of the attestation process it is necessary for the SPIRE Server to establish trust to a SPIRE Agent running on a Linux node. SPIRE supports a variety of Node Attestors depending on where the node is running that allow the use of different selectors when creating registration entries to identify specific workloads.

### Join Token

A join token is a simple method of attesting a server to an agent using a single-use token that is generated on the server and supplied to the agent when the agent is started. It works on any node running Linux.

The SPIRE server can be configured to support join token attestation by enabling the built-in `join-token` NodeAttestor plugin, via the following stanza in the `server.conf` configuration file:

``` syntaxhighlighter-pre
NodeAttestor "join_token" {
    plugin_data {
    }
} 
```

Once join token node attestation has been configured, a join token can be generated on the server using the `spire-server token generate` command. Optionally you can associate a particular SPIFFE ID with the Join Token with the `-spiffeID` flag. [Read more](/docs/latest/deploying/spire_server/#spire-server-token-generate) about using this command.

When starting a SPIRE Agent for the first time with Join Token attestation enabled, the agent can be started with the `spire-agent run` command, and specifying the join token generated by the server using the `-joinToken` flag. [Read more](/docs/latest/deploying/spire_agent/#spire-agent-run) about this command.

The server will validate the join token and issue the Agent an SVID, and the SVID will be rotated automatically as long as it maintains a connection to the Server. On subsequent starts the Agent will use that SVID to authenticate to the server unless it has expired and not renewed.

To use Join Token Node Attestation, configure and enable the join token Node Attestor plugin on the [SPIRE Server](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_server_nodeattestor_jointoken.md) and [SPIRE Agent](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_agent_nodeattestor_jointoken.md).

To disable join token attestation on the server, comment out or delete this stanza from the configuration file before starting it.

### X.509 Certificate

In many cases, particularly where nodes are provisioned manually (such as is in a datacenter) a node may be able to be identified by validating an existing X.509 leaf certificate that has previously been installed on the node, and uniquely identifies it.

Typically these leaf certificates are generated from a single common key and certificate (for the purposes
of this guide, they will be called the *root certificate bundle*). The Server must be configured with the root key and any intermediate certificates, to be able to validate the leaf certificate presented by a particular machine. Only when a certificate that can be validated by the certificate chain to the server is found will node attestation be successful and workloads on that node be able to be issued SPIFFE IDs.

In addition attestor exposes the selector `subject:cn` which will match any certificate that is both (a) valid, as described above, and (b) whose common name (CN) matches that described in the selector.

To use X.509 Certificate Node Attestation, configure and enable the x509pop Node Attestor plugin on the [SPIRE Server](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_server_nodeattestor_x509pop.md) and [SPIRE Agent](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_agent_nodeattestor_x509pop.md).

### SSH Certificate

In some environments each node is automatically provisioned with a valid and unique SSH certificate that identifies the node. SPIRE can use this certificate to bootstrap its identity.

Nodes attested via this method are automatically given a SPIFFE ID in the form of:

```
spiffe://<trust-domain>/spire/agent/sshpop/<fingerprint>
```

Where `<fingerprint>` is a hash of the certificate itself. This SPIFFE ID can then be used as the basis of other workload registration entries.

To use SSH Certificate Node Attestation, configure and enable the sshpop Node Attestor plugin on the [SPIRE Server](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_server_nodeattestor_sshpop.md) and [SPIRE Agent](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_agent_nodeattestor_sshpop.md).

## Attestation for Linux nodes on a Cloud Provider {#customize-server-cloud-attestation}

Many cloud providers offer privileged APIs that allow a process running on a particular node hosted by that provider to be able to prove which node it is running on. SPIRE can be configured to leverage these APIs for node attestation. This is particularly convenient for automation because an Agent starting for the first time on a new instance can automatically attest its identity to the SPIRE server without pre-existing certificates or join tokens being issued to it.

### Google Compute Engine Instances

Google Compute Engine (GCE) node attestation allows a SPIRE Server to identify and authenticate a SPIRE Agent running on a GCP GCE instance automatically. In brief, it is accomplished through the following:

1.   The SPIRE Agent gcp\_iit Node Attestor plugin retrieves a GCP instance's [instance identity token](https://cloud.google.com/compute/docs/instances/verifying-instance-identity), and identifies itself to the SPIRE Server gcp\_iit Node Attestor plugin.
2.   The SPIRE Server gcp\_iit Node Attestor plugin calls a GCP API to verify the validity of the token, if the `use_instance_metadata` configuration value is set to `true`.
3.  Once verification takes place, the SPIRE Agent is considered attested, and issued its own SPIFFE ID.
4.  Finally, SPIRE issues SVIDs to workloads on the nodes if they match a registration entry. The registration entry may include selectors exposed by the Node Attestor, or have the SPIFFE ID of the SPIRE Agent as a parent.

To use GCP IIT Node Attestation, configure and enable the gcp_iit Node Attestor plugin on the [SPIRE Server](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_server_nodeattestor_gcp_iit.md) and [SPIRE Agent](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_agent_nodeattestor_gcp_iit.md).

### Amazon EC2 Instances

EC2 node attestation allows a SPIRE Server to identify and authenticate a SPIRE Agent running on an AWS EC2 Instance automatically. In brief, it is accomplished through the following:

1.  The SPIRE Agent aws\_iid Node Attestor plugin retrieves an AWS instance's instance identity document, and identifies itself to the SPIRE Server aws\_iid Node Attestor plugin.
2.  The SPIRE Server aws\_iid Node Attestor plugin calls an AWS API to verify the validity of the document, using an AWS IAM role with limited permissions. 
3.  Once verification takes place, the SPIRE Agent is considered attested, and issued its own SPIFFE ID.
4.  Finally, SPIRE issues SVIDs to workloads on the nodes if they match a registration entry. The registration entry may include selectors exposed by the Node Attestor or Resolver, or have the SPIFFE ID of the SPIRE Agent as a parent.

For more information on configuring AWS EC2 Node Attestor plugins, refer to the corresponding SPIRE documentation for the AWS [SPIRE Server Node Attestor](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_server_nodeattestor_aws_iid.md) on the SPIRE Server and the [SPIRE Agent Node Attestor](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_agent_nodeattestor_aws_iid.md) on the agent.

### Azure Virtual Machines

Azure MSI node attestation allows a SPIRE Server to identify and authenticate a SPIRE Agent running on an Azure VM automatically. SPIRE uses MSI tokens in order to attest the agent. The MSI tokens must be scoped to mitigate abuse if intercepted. In brief, it is accomplished through the following:

1.  The SPIRE Agent azure\_msi Node Attestor plugin retrieves an Azure VM's MSI token, and identifies itself to the SPIRE Server azure\_msi Node Attestor plugin.
2.  The SPIRE Server azure\_msi Node Attestor plugin retrieves the JSON Web Key Set (JWKS) document from Azure–via an API call and uses JWKS information to validate the MSI token. 
3.  Once verification takes place, the SPIRE Agent is considered attested, and issued its own SPIFFE ID.
4.  Finally, SPIRE issues SVIDs to workloads on the nodes if they match a registration entry. The registration entry may include selectors exposed by the Node Attestor or have the SPIFFE ID of the SPIRE Agent as a parent.

{{< warning >}}
The default resource–assigned by the agent plugin–is scoped relatively widely; it uses the Azure Resource Manager(`https://management.azure.com` endpoint)'s resource id. For security reasons, consider using a custom resource id, to scope more narrowly. 

If you configure a custom resource ID in the agent configuration file, you must specify custom resource IDs for each tenant, in the `NodeAttestor` stanza of the `server.conf` configuration file.
{{< /warning >}}

For more information on configuring Azure MSI Node Attestor plugins, refer to the corresponding SPIRE documentation for the Azure MSI [SPIRE Server Node Attestor](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_server_nodeattestor_azure_msi.md)  on the SPIRE Server and the [SPIRE Agent Node Attestor](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_agent_nodeattestor_azure_msi.md) on the agent.

# Configuring workload attestation
_This configuration applies to the SPIRE Agent_

Whereas Node Attestation concerns how a SPIRE Server identifies a SPIRE Agent on a particular physical or virtual machine, Workload Attestation concerns how a SPIRE Agent identifies a specific process. The two are typically used in concert to identify specific workloads.

As with Node Attestation, Workload Attestation is accomplished through enabling the relevant plugins. Different plugins make different selectors available which can be used in registration entries to identify specific workloads. Unlike with Node Attestation, where only a single strategy can be used for any given workload at a time, Workload Attestation can involve multiple strategies for a single workload. A single workload may, for example, be required to run under a given Unix group, and be started from a specific Docker image.

## Workload Attestation for workloads scheduled by Kubernetes

When workloads are running in Kubernetes, it is valuable to be able to describe them in terms of Kubernetes constructs such as the namespace, service account, or label associated with the pod the workload is running under.

The Kubernetes Workload Attestor plugin works by interrogating the local Kubelet to retrieve kubernetes-specific metadata about particular process when it calls the Workload API, and uses that to identify workloads whose registration entries match those values.

For more information, including details of the exposed selectors, refer to the corresponding SPIRE documentation for the [Kubernetes Workload Attestor plugin](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_agent_workloadattestor_k8s.md).

## Workload Attestation for Docker containers

When workloads are running in a Docker container, it can be helpful to be able to describe them in terms of attributes of that container, such as the Docker image the container was started from, or the value of a particular environment variable.

The Docker Workload Attestor plugin works by interrogating to the local Docker daemon to retrieve Docker-specific metadata about a particular process when it calls the Workload API.

For more information, including details of the exposed selectors, refer to the corresponding SPIRE documentation for the [Docker Workload Attestor plugin](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_agent_workloadattestor_docker.md).

## Workload Attestation for Unix processes 

When workloads are running on Unix, it can be helpful to be able to describe them in terms of how that process is being managed by Unix, such as the name of the unix group it is running under.

The Unix Workload Attestor works by determining kernel metadata from the workload calling the Workload API by examining the caller of the Unix domain socket.

For more information, including details of the exposed selectors, refer to the corresponding SPIRE documentation for the [Unix Workload Attestor plugin](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_agent_workloadattestor_unix.md).

# Configuring where to store agent and server data
_This configuration applies to the SPIRE Server and SPIRE Agent_

The `data_dir` option in the `agent.conf` and `server.conf` configuration files sets the directory for SPIRE runtime data.

If you specify a relative path for `data_dir` by starting the path with `./` then `data_dir` is evaluated based on the current working directory from which you executed the `spire-agent` or `spire-server` command. Using a relative path for `data_dir` can be useful for an initial assessment of SPIRE, but for production deployments you may want to set `data_dir` to an absolute path. By convention, specify `"/opt/spire/data"` for `data_dir` if you have installed SPIRE in `/opt/spire`.

Ensure the path that you specify for `data_dir` and all subdirectories are readable by the Linux user that runs the SPIRE Agent or Server executable. You may want to use [chown](http://man7.org/linux/man-pages/man1/chown.1.html) to change the ownership of these data directories to the Linux user that will run the executable.

If the path that you specify for `data_dir` does not exist, the SPIRE Agent or Server executable will create the path if the Linux user that runs the executable has permissions to do so.

Typically you should use the value for `data_dir` as the base directory for other data paths that you configure in the `agent.conf` and `server.conf` configuration files. For example, if you set `data_dir` to `"/opt/spire/data"` in `agent.conf`, set the `KeyManager "disk" plugin_data directory` to `"/opt/spire/data/agent"`. Or, if you set `data_dir` to `/opt/spire/data` in `server.conf`, set the `connection_string` to `"/opt/spire/data/server/datastore.sqlite3"` if you use SQLite for the SPIRE Server data-store as described next.

# Configuring how to store server data
_This configuration applies to the SPIRE Server_

The data-store is where SPIRE Server persists dynamic configuration such as registration entries and identity mapping policies that are retrieved from the SPIRE Server. By default, SPIRE bundles SQLite and sets it as the default for storage of server data. SPIRE also supports other compatible data-stores. For production purposes, you should carefully consider which database to use, particularly when deploying SPIRE in a High Availability configuration.

The SPIRE Server can be configured to utilize different SQL-compatible storage backends by configuring the default SQL data-store plugin as described below. A complete reference for how this block is configured can be found in the [SPIRE documentation](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_server_datastore_sql.md).

### Configure SQLite as a SPIRE data-store

By default, the SPIRE Server creates and uses a local SQLite database for backing up and storing configuration data. While convenient for testing this is generally not recommended for production deployments as it is difficult to share a SQLite data-store across multiple machines, which can complicate backups, HA deployments and upgrades.

To configure the server to use a SQLite database, enable the stanza in the configuration file that looks like this:

``` syntaxhighlighter-pre
    DataStore "sql" {
        plugin_data {
            database_type = "sqlite3"
            connection_string = "/opt/spire/data/server/datastore.sqlite3"
        }
    }
```

There should be no other (un-commented) `DataStore` stanzas in the configuration file.

The database will be created in the path specified in `connection_string`. For more information about choosing a location for SPIRE-related data, see [Configuring where to store agent and server data](#configuring-where-to-store-agent-and-server-data).

### Configure MySQL as a Datastore

In production it is recommended to use a dedicated database to back up and store configuration data. While installing and configuring a MySQL database is outside the scope of this guide, it is worth noting that SPIRE Server requires:

A dedicated database on the MySQL server for SPIRE Server configuration.

A MySQL user that has the ability to connect to any EC2 instance running the SPIRE Server and that can both INSERT and DROP tables, columns and rows from that database.

To configure the SPIRE Server to use a MySQL database, enable the stanza in the configuration file that looks like this:

``` syntaxhighlighter-pre
    DataStore "sql" {
        plugin_data {
            database_type = "mysql"
            connection_string = "username:password@tcp(localhost:3306)/dbname?parseTime=true"
        }
    }
```

In the connection string above, substitute the following:

* `username` for the username of the MySQL user that should be used to access the database
* `password` for the password of the MySQL user
* `localhost:3306` for the IP address or hostname of the MySQL server, and
port number
* `dbname` for the name of the database 

### Configure Postgres as a Datastore

In production it is recommended to use dedicated database to back up and store configuration data. While installing and configuring a Postgres database is outside the scope of this guide, it is worth noting that SPIRE Server requires:

* A dedicated database on the Postgres server for SPIRE Server configuration
* A Postgres user that has the ability to connect to any instance running the SPIRE Server and that can both INSERT and DROP tables, columns and rows from that database

To configure the SPIRE Server to use a Postgres database, enable the following stanza in the server configuration file:

``` syntaxhighlighter-pre
    DataStore "sql" {
        plugin_data {
            database_type = "postgres"
            connection_string = "dbname=[database_name] user=[username]
                                 password=[password] host=[hostname] port=[port]"
        }
    }
```

The `connection_string` value is in a key=value format, however you may also use a connection URI (see [34.1.1. Connection Strings](https://www.postgresql.org/docs/11/libpq-connect.html#LIBPQ-CONNSTRING) in the Postgres documentation for supported connection string formats).

The following list summarizes the connection string values you set:

* \[database-name\] - the name of the database 
* \[username\] - the username of the Postgres user accessing the database
* \[password\] - the user's password
* \[hostname\] - the IP address or hostname of the Postgres server
* \[port\] - port number of the Postgres server

# Configuring how generated keys are stored on the Agent and Server
_This configuration applies to the SPIRE Server and SPIRE Agent_

Both the SPIRE Agent and SPIRE Server generate private keys and certificates during normal operation. It is important to maintain the integrity of these keys and certificates to ensure the integrity of the issued SPIFFE identities is maintained.

Currently SPIRE supports two key management strategies on both the Agent and Server.

* **Store in-memory**. In this strategy keys and certificates are only stored in-memory. This means that if the Server or Agent crashes or is otherwise re-started, the keys must be re-generated. In the case of the SPIRE Agent this typically requires the agent to re-attest to the Server upon restart. This strategy can be managed by enabling and configuring the memory key manager plugin for the [SPIRE Server](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_server_keymanager_memory.md) and/or [SPIRE Agent](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_agent_keymanager_memory.md).

* **Store on disk**. In this strategy, keys and certificates are stored in a specified file on disk. An advantage of this approach is they survive a restart of the SPIRE Server or Agent. A disadvantage is that since they keys are stored in files on disk, additional precautions must be taken to prevent a malicious process from reading those files. This strategy can be managed by enabling and configuring the disk key manager plugin for the [SPIRE Server](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_server_keymanager_disk.md) and/or [SPIRE Agent](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_agent_keymanager_disk.md).

Alternatively, SPIRE can be configured to integrating a custom backend such as a secret store through third party key manager plugins. The guide on [Extending SPIRE](/docs/latest/spire/developing/extending/) covers this in more detail.

# Configuring which trust root / "upstream authority" your application will use
_This configuration applies to the SPIRE Server_

Each SPIRE Server uses a specific root signing key that is used to accomplish several important actions:

* To establish trust by a SPIRE Agent to the SPIRE Server, as the agent holds a certificate that has been signed by that key (note though that trust from the server to the agent is established through attestation).
* To generate X.509 or JWT SVIDs that are issued to workloads
* To generate SPIFFE trust bundles (used to establish trust with other
SPIRE Servers)

{{< warning >}}
This signing key should be considered extremely sensitive as to obtain it would allow a malicious actor to impersonate the SPIRE Server and to issue identities on its behalf. 
{{< /warning >}}

To help ensure the integrity of the signing key a SPIRE Server may either sign material itself using a signing key stored on disk, or delegate signing to an independent Certificate Authority (CA), such as the AWS Secrets Manager. This behavior is configured through the `UpstreamAuthority` section in the
`server.conf` file.

For a complete server configuration reference, see the [SPIRE Server Configuration Reference](/docs/latest/deploying/spire_server/).

#### Configure an On-disk Signing Key

The SPIRE Server can be configured to load CA credentials from disk, using them to generate intermediate signing certificates for the server's signing authority.

The SPIRE Server comes with a "dummy" key and certificate that can be used to simplify testing, however since this same key is distributed to all SPIRE users it should not be used for anything other than testing purposes. Instead an on-disk signing key should be generated.

If the `openssl` tool is installed, a valid root key and certificate can be generated using a command similar to the following:

``` syntaxhighlighter-pre
sudo openssl req \
       -subj "/C=/ST=/L=/O=/CN=acme.com" \
       -newkey rsa:2048 -nodes -keyout /opt/spire/conf/root.key \
       -x509 -days 365 -out /opt/spire/conf/root.crt
```

This strategy can be managed by enabling and configuring the `disk` UpstreamAuthority plugin for the [SPIRE Server](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_server_upstreamauthority_disk.md).

#### Configure AWS Secrets Manager

The SPIRE Server can be configured to load CA credentials from [Amazon Web Services Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html), using them to generate intermediate signing certificates for the server's signing authority. 

This strategy can be managed by enabling and configuring the `awssecret` UpstreamAuthority plugin for the [SPIRE Server](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_server_upstreamauthority_awssecret.md).

#### Configure AWS Certificate Manager

The SPIRE Server can be configured to load CA credentials from Amazon Web Services Certificate Manager [Private Certificate Authority](https://aws.amazon.com/certificate-manager/private-certificate-authority/) (PCA) them to generate intermediate signing certificates for the server's signing authority. 

This strategy can be managed by enabling and configuring the `aws_pca` UpstreamAuthority plugin for the [SPIRE Server](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_server_upstreamauthority_aws_pca.md).

#### Configure another SPIRE installation

The SPIRE Server can be configured to load CA credentials from the Workload API of another SPIFFE implementation such as SPIRE. This enables a technique called "Nested SPIRE" that, as a compliment to HA deployments, allows independent SPIRE Servers to issue identities against a single trust domain.

A full treatment for Nested SPIRE is beyond the scope of this guide. However this strategy can be managed by enabling and configuring the `spire` UpstreamAuthority plugin for the [SPIRE Server](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_server_upstreamauthority_spire.md).

# Export Metrics for Monitoring
_This configuration applies to the SPIRE Server and SPIRE Agent_

To configure a SPIRE Server or Agent to output data to a metrics collector, edit the telemetry section in `server.conf` or `agent.conf`. SPIRE can export metrics to 
[Datadog](https://docs.datadoghq.com/developers/dogstatsd/) (DogStatsD format),
[M3](https://github.com/m3db/m3),
[Prometheus](https://prometheus.io/), and
[StatsD](https://github.com/statsd/statsd).

You may configure multiple collectors at the same time. DogStatsD, M3, and StatsD support multiple declarations in the event that you want to send metrics to more than one collector.

{{< info >}}
If you want to use Amazon Cloud Watch for metrics collection, review [this document](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-Agent-custom-metrics-statsd.html) on retrieving custom metrics with the CloudWatch agent and StatsD.
{{< /info >}}

Below is an example of a configuration block for `agent.conf` or `server.conf` that exports telemetry to Datadog, M3, Prometheus, and StatsD, and disables the in-memory collector:

``` syntaxhighlighter-pre
telemetry {
        Prometheus {
                port = 9988
        }

        DogStatsd = [
            { address = "localhost:8125" },
        ]

        Statsd = [
            { address = "localhost:1337" },
            { address = "collector.example.org:8125" },
        ]

        M3 = [
            { address = "localhost:9000" env = "prod" },
        ]

        InMem {
            enabled = false
        }
}
```

For more information, see the [telemetry configuration](/docs/latest/deploying/telemetry_config/) guide.

# Logging
_This configuration applies to the SPIRE Server and SPIRE Agent_

You can set the log file location and the level of logging for the SPIRE Server and SPIRE Agent in their respective configuration files. Edit the `log_file` value to set the log file location and the `log_level` value to set the level of logging. This can be one of DEBUG, INFO, WARN or ERROR.

By default, SPIRE logs go to STDOUT. However the SPIRE Agent and Server can be configured instead to write logs directly to a file by specifying the path to the file in the `log_file` attribute.

# Where next?

Once you've configured your Server and Agents, consider reviewing the guide on [Registering Workloads](/docs/latest/spire/using/registering/).

{{< scarf/pixels/high-interest >}}

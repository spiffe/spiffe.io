---
title: Configuring SPIRE
description: How to configure SPIRE for your environment
weight: 130
toc: true
---

To customize the behavior of the SPIRE Server and SPIRE Agent to meet your application’s needs you edit configuration files for the server and agent. 

# How to configure SPIRE on Kubernetes

TBD - Should cover where to find the relevant files.

# How to configure SPIRE on Linux

TBD - Should cover where to find the relevant files.

# Configuring a trust domain 

The trust domain corresponds to the trust root of a SPIFFE identity provider. A trust domain could represent an individual, organization, environment or department running their own independent SPIFFE infrastructure. All workloads identified in the same trust domain are issued identity documents that can be verified against the root keys of the trust domain.

Each SPIRE server is associated with a single trust domain that must be unique within that organization. The trust domain takes the same form as a DNS name (for example, `prod.acme.com`), however it does not need to correspond to any DNS infrastructure.

The trust domain is configured in the SPIRE Server before it is first started. It is configured through the `trust_domain` parameter in the `server` stanza in the configuration file. For example, if the trust domain of the server should be configured to `prod.acme.com` then it would be set as:

``` syntaxhighlighter-pre
trust_domain = "prod.acme.com"
```

A SPIRE Server and Agent can only issue identities to a single trust domain, and the trust domain configured by an agent must match that of the server it is connecting to. It is possible to establish trust to workloads issued SPIFFE IDs under different trust domains through SPIFFE Federation.

To configure the server’s trust domain:

1. Edit the server’s configuration (on linux this is typically in **/opt/spire/conf/server/server.conf**, for Kubernetes it is typically in the X confi
2. Locate the section labeled **trust_domain**  
3. Enter the trust domain name you decided on in the [Plan Your Configuration](#plan-your-configuration) section above. 

# Configure the Port on which the Server Listens to Agents

By default, the SPIRE Server listens on port 8081 for incoming connections from SPIRE Agents; to choose a different value, edit the `bind_port` parameter in the `server.conf` file. For example, to change the listening port to 9090:

``` syntaxhighlighter-pre
bind_port = "9090"
```

If this configuration is changed from the default on the server, then the configuration of the serving port must also be changed on the agents.

# Configuring node attestation

A SPIFFE Server identifies and attests Agents through the process of *node attestation* and *resolution* (read more about this in [SPIRE Concepts](/spire/overview/#spire-concepts)). This is accomplished through Node Attestor and Node Resolver plugins, which you configure and enable in the server. 

Your choice of node attestation method determines which node-attestor plugins you configure SPIRE to use in Server Plugins and Agent Plugins sections of the SPIRE configuration files. You must configure at least one node attestor on the server and only one node attestor on the agent.

## Attestation for Kubernetes nodes {#customize-server-k8s-attestation}

A crucial SPIRE Server feature is the ability to identify and establish trust to the nodes in a Kubernetes cluster. You choose the strategy to identify and trust nodes depending on the features in your Kubernetes cluster and your preferred deployment topology.

<table style="width:100%;">
<colgroup>
<col style="width: 27%" />
<col style="width: 47%" />
<col style="width: 24%" />
</colgroup>
<thead>
<tr class="header">
<th>Node Identification Strategy</th>
<th>Use this strategy if</th>
<th>Deployment Options</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>(Experimental) Projected Service Account Token (PSAT)</strong></td>
<td><p>Your Kubernetes cluster supports <a href="https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/#service-account-token-volume-projection" class="external-link">Service Account Token Volume Projection</a>.<br />
<br />
At the time of this writing,  projected service accounts are a relatively new feature in Kubernetes and not all deployments support them. Your Kubernetes platform documentation will tell you whether this feature is available.</p>
<blockquote>
<p>NOTE: At the time of writing, Amazon's Elastic Kubernetes Service (EKS) does not support Service Account Token Volume Projection.</p>
</blockquote></td>
<td>Server and agent may be running on distinct Kubernetes clusters</td>
</tr>
<tr class="even">
<td><strong>Service Account Token (SAT)</strong></td>
<td><p>Your Kubernetes deployment does <em>not </em>support projected service account tokens then this is the recommended deployment strategy. The agent and the server must be co-deployed into the same Kubernetes cluster.</p></td>
<td>Server and agent must be on the same Kubernetes cluster</td>
</tr>
</tbody>
</table>

### Service Account Tokens

TODO: Describe how to enable SAT

### Projected Service Account Tokens

TODO: Describe how to enable PSAT

## Attestation for Linux nodes {#customize-server-linux-attestation}

TODO: Write intro

### Join Token

A join token is a simple method of attesting a server to an agent using a single-use token that is generated on the server.

The SPIRE server can be configured to support join token attestation by enabling the built-in `join-token` NodeAttestor plugin, via the following stanza in the `server.conf` configuration file:

``` syntaxhighlighter-pre
NodeAttestor "join_token" {
    plugin_data {
    }
} 
```

To disable join token attestation on the server, comment out or delete this stanza from the configuration file before starting it.

TODO: How does the agent get configured?

TODO: How is a join token generated on the server?

### X.509 Certificate

In many cases, particularly where nodes are provisioned manually (such as is in a datacenter) a node may be able to be identified by validating an existing X.509 certificate. For the purposes of this guide, these will be called *leaf certificates*. 

Typically these leaf certificates are generated from a single common key and certificate (for the purposes
of this guide, they will be called the *root certificate bundle*). The specific leaf certificates that allow a node to be part of a node set are configured by creating a x509pop [registration entry](/spire/docs/registering/).

However the Server must be configured with the root key and certificates, to be able to validate the leaf certificate presented by a particular machine. 

##### Configure the Server

Enable this node attestation mode by enabling the relevant section in the command line:

``` syntaxhighlighter-pre
NodeAttestor "x509pop" {
    plugin_data {
            ca_bundle_path = "/opt/spire/conf/rootCA.crt"
    }
}
```

In the `ca_bundle_path` field, enter the path to the trusted root certificate bundle on disk. If multiple roots are to be considered trustworthy, then these should be included as a bundle. Concretely the file must contain one or more PEM blocks forming the set of trusted root certificates for chain-of-trust verification.

### SSH Certificate

TODO: Describe how sshpop node attestation is configured.

## Attestation for Linux nodes on a Cloud Provider {#customize-server-cloud-attestation}

TODO: Write intro

### Google Compute Engine Instances

GCE node attestation and resolution allows a SPIRE Server to identify and authenticate a SPIRE Agent running on a GCP GCE instance automatically. In brief, it is accomplished through the following:

1.  The SPIRE Agent gcp\_iit Node Attestor plugin retrieves a GCP instance's instance identity token, and identifies itself to the SPIRE Server gcp\_iit Node Attestor plugin.
2.  The SPIRE Server gcp\_iit Node Attestor plugin calls a GCP API to verify the validity of the token, if the `use_instance_metadata` configuration value is set to `true`.
3.  Once verification takes place, the SPIRE Agent is considered
attested, and becomes a valid node in the SPIRE system.  Enterprise can then create node sets (groups of nodes on which attestation policies can be applied) based on GCP characteristics such as project id, instance name, zone, service account, instance tag, instance label, and instance metadata. 
4.  Finally, Enterprise applies workload policies to node sets and issues SVIDs to matching workload instances. 

{{ <info > }}
To allow node attestation based on service account, instance tag, instance label, and instance metadata, you must  set `use_instance_metadata` to `true` in the GCP plugin stanza of the SPIRE Server server configuration file.
{{ </info> }}

##### Create a GCP Service Account for Node Attestation and Resolution if Necessary

If `use_instance_metadata` is set to true in the SPIRE Server server configuration file, you must create a GCP service account that has the correct permissions to perform node attestation and resolution.

To do this, follow these steps:

1.  Update the service account of the SPIRE Server to have the `compute.instances.get` `role so that the server can validate the instance identity token
2.  Update the access scope this role to allow `Read` access to the `Compute Engine API`.

For more information on GCP security credentials see
this <a href="https://cloud.google.com/docs/authentication/production" class="external-link">GCP authentication and authorization document</a>. 

##### Configure the Server

In the `project-id` field, in the `gcp_iit` Node Attestor plugin stanza enter the ID of the project containing the instance.

In the `zone` field, in the `gcp_iit` Node Attestor plugin stanza enter the zone containing the instance.

In the `instance-name` field, in the `gcp_iit` Node Attestor plugin stanza enter the name of the instance.

In addition, you can allow node attestation based on service account, instance tag, instance label, and instance metadata. To do this, set `use_instance_metadata` to `true` in the `gcp_iit` Node Attestor plugin stanza and then set values for the `tag`, `sa`, `label`, and `metadata` fields accordingly.

For example:

``` syntaxhighlighter-pre
NodeAttestor "gcp_iit" {
  plugin_data {
    # List of whitelisted ProjectIDs for which nodes can be attested.
    projectid_whitelist = ["my_projectid"]

    # If true, instance metadata is fetched from the Google Compute Engine API and used to augment
    # the node selectors produced by the plugin.  Defaults to false.
    # use_instance_metadata = true
    # The opions below are only relevant when use_instance_metadata is set to true
    # Path to the service account file used to authenticate with the Google Compute Engine API
    #   use if operating outside of GCP
    #     service_account_file = "/opt/spire/config/my_sa_file"
    # Instance label keys considered for selectors.  No instance label keys will be will be considered
    #   if this is not set.
    #     allowed_label_keys = [""]
    # Instance metadata keys considered for selectors. No instance metadata keys will be will be considered
    #   if this is not set.
    #     allowed_metadata_keys=[""]
    # Sets the maximum metadata value size considered by the plugin for selectors. Defaults to 128
    #     max_metadata_value_size = 128  
  }
}
```

For more information on configuring GCP GCE Node Attestor plugin, refer to the corresponding <a href="https://github.com/spiffe/spire/blob/master/doc/plugin_server_nodeattestor_gcp_iit.md" class="external-link">SPIRE documentation for the GCP Node Attestor</a>. 

### Amazon EC2 Instances

EC2 node attestation and resolution allows a SPIRE Server to identify and authenticate a SPIRE Agent running on an AWS EC2 Instance automatically. In brief, it is accomplished through the following:

1.  The SPIRE Agent aws\_iid Node Attestor plugin retrieves an AWS instance's instance identity document, and identifies itself to the SPIRE Server aws\_iid Node Attestor plugin.
2.  The SPIRE Server aws\_iid Node Attestor plugin calls an AWS API to verify the validity of the document, using an AWS IAM role with limited permissions. 
3.  Once verification takes place, the SPIRE Agent is considered
    attested, and becomes a valid node in the SPIRE
    system.  Enterprise can then create node sets (groups of nodes on
    which attestation policies can be applied) based on AWS
    characteristics such as instance tags, security group IDs, security
    group names and the IAM role. 
4.  Finally, Enterprise applies workload policies to node sets and
    issues SVIDs to matching workload instances. 

##### Create an AWS IAM Role for Node Attestation and Resolution

You must make available an AWS IAM account that has `ec2:DescribeInstances` and `iam:GetInstanceProfile` permissions. The following is an example for a JSON IAM policy needed to get instance's info from AWS.

``` syntaxhighlighter-pre
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "ec2:DescribeInstances",
                "iam:GetInstanceProfile"
            ],
            "Resource": "*"
        }
    ]
}
```

Read more about AWS IAM security credentials <a href="https://docs.aws.amazon.com/general/latest/gr/aws-security-credentials.html" class="external-link">here</a>.

##### Configure the Server

In the `access_key_id` field, in both the aws`_iid` Node Attestor plugin stanza and the aws`_iid` Node Resolver plugin stanza, enter the access key id for the AWS account created above.

In the `secret_access_key`* *field, in both the `aws_iid` Node Attestor plugin stanza and the `aws_iid` Node Resolver plugin stanza, enter the secret access key for the AWS account created above.

For example:

``` syntaxhighlighter-pre
NodeAttestor "aws_iid" {
    plugin_data {
        access_key_id = "ACCESS_KEY_ID"
        secret_access_key = "SECRET_ACCESS_KEY"
    }
} 
NodeResolver "aws_iid" {
    plugin_data {
        access_key_id = "ACCESS_KEY_ID"
        secret_access_key = "SECRET_ACCESS_KEY"
    }
}
```

For more information on configuring AWS EC2 Node Attestors or Resolver plugins, refer to the corresponding SPIRE documentation for the AWS [Node Attestor](https://github.com/spiffe/spire/blob/master/doc/plugin_server_nodeattestor_aws_iid.md) and [Node Resolver](https://github.com/spiffe/spire/blob/master/doc/plugin_server_noderesolver_aws_iid.md).

### Azure Virtual Machines

Azure MSI node attestation and resolution
allows a SPIRE Server to identify and authenticate a SPIRE Agent running on an Azure VM automatically. In brief, it is accomplished through the following:

1.  The SPIRE Agent azure\_msi Node Attestor plugin retrieves an an Azure VM's MSI token, and identifies itself to the SPIRE Server azure\_msi Node Attestor plugin.
2.  The SPIRE Server azure\_msi Node Attestor plugin retrieves the JSON Web Key Set (JWKS) document from Azure–via an API call and uses JWKS information to validate the MSI token. 
3.  The SPIRE Server azure\_msi Node Resolver plugin interacts with Azure to obtain information about the agent VM--such as subscription ID, VM name, network security group, virtual network, and virtual network subnet–to build up a set of attributes about the agent VM that can then be used as node selectors for the Azure node set.
4.  Once verification takes place, the SPIRE Agent is considered attested, and becomes a valid node in the SPIRE system.  Enterprise can then create node sets (groups of nodes on which attestation policies can be applied) based on Azure characteristics such as subscription ID, VM name, network security group, virtual network, and virtual network subnet.
5.  Finally, SPIRE applies workload policies to node sets and issues SVIDs to matching workload instances. 

##### Configure the Server

In the `server.conf` file, you configure behavior for the Azure MSI node attestor and node resolver.

To configure **node attestor** behavior:

-   In the azure\_msi `NodeAttestor` plugin stanza, specify the resource IDs for the tenants whose MSI tokens the server will accept. 
-   If you have configured the agent attestor to receive a custom resource id for the MSI token (see [Configure the Agent](#configure-the-agent)) specify the custom resource ID for each tenant. 

For example:

``` syntaxhighlighter-pre
NodeAttestor "azure_msi" {
   enabled = true
   plugin_data {
       tenants = {
           // Tenant configured with the default resource id (i.e., the resource manager)
           "9E85E111-1103-48FC-A933-9533FE47DE05" = {}
           // Tenant configured with a custom resource id
           "DD14E835-679A-4703-B4DE-8F00A20C732E" = {
               resource_id = "http://example.org/app/"
       }
  }
}
```

To configure **node resolver** behavior:

Set the `use_msi` value in the `NodeResolver` plugin stanza to either `true` or `false`, depending on whether the server is validating tokens from more than one tenant, or only the tenant in which the VM the server is on is running.

-   If the server is validating tokens from more than one tenant, set
    `use_msi` to `false` and configure the `tenants` stanza to map each
    tenant's id to authentication credentials, as in the following
    pseudocode:

    ``` syntaxhighlighter-pre
        NodeResolver "azure_msi" {
            enabled = true
            plugin_data {
                use_msi = false
                tenants = {
                    TENANT_ID = {
                        subscription_id = SUBSCRIPTION_ID
                        app_id = APP_ID
                        app_secret = APP_SECRET
                    }
                }
            }
        }
    ```

-    If the server is validating tokens only from the tenant in which the server's VM is running, then set `use_msi` to true. 

##### Configure the Agent

SPIRE uses MSI tokens in order to attest the agent. The MSI tokens must be scoped to mitigate abuse if intercepted.

The default resource–assigned by the agent plugin–is scoped relatively widely; it uses the Azure Resource Manager(`https://management.azure.com` endpoint)'s resource id. For security reasons, consider using a custom resource id, to scope more narrowly. 

To do this, in the `NodeAttestor` plugin stanza of the agent.conf file, set` resource_id` to the custom resource ID. 

For example:

``` syntaxhighlighter-pre
NodeAttestor "azure_msi" {
    plugin_data {
        resource_id = "http://example.org/app/"
    }
} 
```

{{< info >}}
If you configure a custom resource ID in the agent configuration file, you must specify custom resource IDs for each tenant, in the `NodeAttestor` stanza of the `server.conf` configuration file. (See [Configure the Server](#configure-the-server).)
{{< /info >}}

# Configuring workload attestation

Which workload attestation method your application requires. As with node attestation methods, your choice depends on the infrastructure your application’s workloads are deployed in (for example, SPIRE supports identifying workloads that run in Kubernetes).

## Workload Attestation for Kubernetes

TODO: Complete

## Workload Attestation for Docker

TODO: Complete

## Workload Attestation for Linux processes 

TODO: Complete

# Configuring how to store server data

SPIRE employs a database to persist data related to workload identities and registration entries. By default, SPIRE bundles SQLite and sets it as the default for storage of server data. SPIRE currently also supports PostgreSQL. For production purposes, you should carefully consider which database to use. 

The datastore is where SPIRE Server persists dynamic configuration such as registration entries and identity mapping policies that are retrieved from the SPIRE Server. The SPIRE Server can be configured to utilize different storage options as datastore backends by configuring the Datastore block in the configuration file. Supported configuration options for this block are described below. A completereference for how this block is configured can be found in the <a href="https://github.com/spiffe/spire/blob/master/doc/plugin_server_datastore_sql.md" class="external-link">SPIRE documentation</a>.

### Configure SQLlite as a Datastore

By default, the SPIRE Server creates and uses a local SQLlite database for backing up and storing configuration data. While convenient for testing this is generally not recommended for production deployments as it is difficult to share a SQLlite datastore across multiple machines, which can complicate backups, HA deployments and upgrades.

To configure the server to use a SQLlite database, enable the stanza in the configuration file that looks like this:

``` syntaxhighlighter-pre
    DataStore "sql" {
        plugin_data {
            database_type = "sqlite3"
            connection_string = "/opt/spire/data/server/datastore.sqlite3"
        }
    }
```

There should be no other (un-commented) `Datastore` stanzas in the configuration file.

The database will be created in a path specified in the connection string, which is relative to the path of the `spire-server` binary.

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

# Configuring which key management backend your application requires

The key manager generates and persists the public-private key pair used for the agent SVID.  You must choose whether to store the private key on disk or in memory. For production purposes, you also might consider integrating a custom backend for storage purposes, such as a secret store.

TODO: Complete this.

When you customize these instructions for your architecture, you will substitute the appropriate path values to point to your application’s key and certs.

# Configuring which trust root / "upstream CA" your application will use

Each SPIRE Server uses a specific root signing key that is used to accomplish several important actions:

To establish trust by a SPIRE Agent to the SPIRE Server, as the agent holds a certificate that has been signed by that key (note though that trust from the server to the agent is established through attestation).

* To generate X.509 SVIDs that are issued to workloads
* To generate SPIFFE trust bundles (used to establish trust with other
SPIRE Servers)

{{< warning >}}
This signing key should be considered extremely sensitive as to obtain it would allow a malicious actor to impersonate the SPIRE Server and to issue identities on its behalf. 
{{< /warning >}}

To help ensure the integrity of the signing key a SPIRE Server may either sign material itself using a signing key stored on disk, or delegate singing to an independent Certificate Authority (CA), such as the AWS Secrets Manager. This behavior is configured through the `UpstreamCA` section in the
`server.conf` file.

For a complete server configuration reference, see the [SPIRE Server Configuration Reference](https://github.com/spiffe/spire/blob/master/doc/spire_server.md).

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

To configure SPIRE Server to use an on-disk CA credentials, ensure the `UpstreamCA "disk"` stanza is un-commented. In the `plugin_data` section, configure the following values:

* `ttl` - This is the lifespan of intermediate certificates generated from the certificate obtained from disk.
* `key_file_path` - This should be set to the path of the signing key. Key files must contain a single PEM encoded key. The supported key types are EC (ASN.1 or PKCS8 encoded) or RSA (PKCS1 or PKCS8 encoded).
* `cert_file_path` - This should be set to the certificate that corresponds to the signing key.
* `bundle_file_path` - If the certificate specified above is not a root certificate, but has been signed by a different root authority, then it is also necessary to specify the certificate bundle so that the full trust chain can be verified. The certificate bundle file should contain a chain of certificates, in PEM format, up to the trusted root. If the certificate specified above is a root (that is, self-signed) certificate, then this does not need to be configured.

For example:

``` syntaxhighlighter-pre
    UpstreamCA "disk" {
        plugin_data {
            ttl = "1h"
            cert_file_path = "/opt/spire/conf/root.crt"
            key_file_path = "/opt/spire/conf/root.key"
        }
    }
```

#### Configure AWS Secrets Manager as an Upstream Certificate Authority (CA)</span>

The SPIRE Server can be configured to load CA credentials from AWS Secrets Manager, using them to generate intermediate signing certificates for the server's signing authority. To configure SPIRE Server to use AWS Secrets Manager to sign certificates for the SPIRE Server, ensure the `UpstreamCA "awssecret"` stanza is un-commented. In the `plugin_data` section, configure the following values:

* `ttl` - This is the lifespan of intermediate certificates generated from AWS Secrets Manager.
* `region` - AWS Region that the AWS Secrets Manager is running in
* `cert_file_arn` - ARN of the "upstream" CA certificate
* `key_file_arn` - ARN of the "upstream" CA key file
* `access_key_id` - AWS access key ID
* `secret_access_key` - AWS secret access key
* `secret_token` - AWS secret token
* `assume_role_arn` - ARN of role to assume

SPIRE Server requires that you employ a distinct Amazon Resource Name (ARN) for the CA certificate and the CA key. 

Here's a sample plugin\_data stanza for loading CA credentials from AWS Secrets Manager:

``` syntaxhighlighter-pre
    UpstreamCA "awssecret" {
        plugin_data {
            ttl = "1h"
            region = "us-west-2"
            cert_file_arn = "cert"
            key_file_arn = "key"
            access_key_id = "ACCESS_KEY_ID"
            secret_access_key = "SECRET_ACCESS_KEY"
            secret_token = "SECRET_TOKEN"
            assume_role_arn = "role"
        }
    }
```

Only the `region`, `cert_file_arn`, and `key_file_arn` must be configured. You optionally configure the remaining fields depending on how you choose to give SPIRE Server access to the ARNs.

<table>
<thead>
<tr class="header">
<th>If SPIRE Server Accesses the ARNs</th>
<th>then these additional fields are mandatory</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>by providing an access key id and secret access key</td>
<td><p><code> access_key_id</code></p>
<p><code>secret_access_key</code></p></td>
</tr>
<tr class="even">
<td><p>by using temporary credentials for an IAM account</p>
<p><strong>NOTE</strong>: It is the server user's responsibility to provide a new valid token whenever the server is started</p></td>
<td><p><code>access_key_id</code></p>
<p><code>secret_access_key</code></p>
<p><code>secret_token</code></p></td>
</tr>
<tr class="odd">
<td>via an EC2 unit that has an attached role with read access to the ARNs</td>
<td>none</td>
</tr>
<tr class="even">
<td><p>By configuring the UpstreamCA plugin to assume another IAM role that has access to the secrets</p>
<p><strong>NOTE</strong>: The IAM user for which the access key id and secret access key must have permissions to assume the other IAM role, or the role attached to the EC2 instance must have this capability.</p></td>
<td><p><code>access_key_id</code></p>
<p><code>secret_access_key</code></p>
<p><code>secret_token</code></p>
<p><code>assume_role_arn</code></p></td>
</tr>
</tbody>
</table>

Because the plugin fetches the secrets from the AWS secrets manager only at startup, automatic rotation of secrets is not advised.

For more information on the AWS Secrets Manager, see the <a href="https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html" class="external-link">AWS Secrets Manager</a> documentation. 

# Export Metrics for Monitoring

SPIRE allows you to export both Server and  Agent metrics for the purposes of telemetry/monitoring. To configure which metrics collectors you export metrics data to, edit the "Telemetry configuration" section of the server and agent configuration files. SPIRE currently supports exporting of metrics to Prometheus, Statsd, and DogStatsd. You may use all, some, or none. Statsd and DogStatsd both support multiple declarations in the event that you want to send metrics to more than one collector.

{{< info >}}
If you want to use Amazon Cloud Watch for metrics collection, review [this document](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-Agent-custom-metrics-statsd.html) on retrieving custom metrics with the CloudWatch agent and StatsD.
{{< /info >}}

The Telemetry configuration section looks like this:

``` syntaxhighlighter-pre
#telemetry {
#        Prometheus {
#                port = 9988
#        }
#
#        DogStatsd {
#                address = "localhost:8125"
#        }
#
#       Statsd {
#                address = "localhost:1337"
#        }
#
#        Statsd {
#               address = "collector.example.org:8125"
#        }
#}
```

# Logging

You can set the log file location and the level of logging for the SPIRE Server and SPIRE Agent in their respective configuration files. Edit the `log_file` value to set the log file location and the `log_level` value to set the level of logging. 

> By default, SPIRE logs go to STDOUT.

Here is a sample configuration file logging section: 

``` syntaxhighlighter-pre
# log_file: file to write logs to. STDOUT by default
# log_file = "/opt/spire/logs/agent/agent.log"

# log_level Sets the logging level <DEBUG|INFO|WARN|ERROR>
# default INFO
# log_level = "INFO"
```
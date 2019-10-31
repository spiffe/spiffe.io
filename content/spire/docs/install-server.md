---
title: Install SPIRE Server
short: Install Server
description: How to install the SPIRE Server on Linux and Kubernetes
weight: 110
---

# Plan Your Configuration for Linux or Kubernetes

To customize the behavior of the SPIRE Server and SPIRE Agent to meet your application’s needs you edit configuration files for the server and agent. 

The following decisions influence how you set values in the configuration file: 

* What you will name your server trust domain and your agent trust domain 

TODO: What is a trust domain? How to choose one?

Trust domain names must be identical in the server and the agent. 

* Which node attestation method your application requires 

This depends on your where your workload is running. Your choice of node attestation method determines which node-attestor plugins you configure SPIRE to use in Server Plugins and Agent Plugins sections of the SPIRE configuration files. You must configure at least one node attestor on the server and only one node attestor on the agent. 

Choosing an appropriate node attestation method is covered in the [agent installation guide](/spire/docs/install-agent).

* Which workload attestation method your application requires. As with node attestation methods, your choice depends on the infrastructure your application’s workloads are deployed in (for example, SPIRE supports identifying workloads that run in Kubernetes).

Choosing an appropriate node attestation method is covered in the [agent installation guide](/spire/docs/install-agent).

* Which type of database your application will use to store server data

SPIRE employs a database to persist data related to workload identities and registration entries. By default, SPIRE bundles SQLite and sets it as the default for storage of server data. SPIRE currently also supports PostgreSQL. For production purposes, you should carefully consider which database to use. 

* Which key management backend your application requires

The key manager generates and persists the public-private key pair used for the agent SVID.  You must choose whether to store the private key on disk or in memory. For production purposes, you also might consider integrating a custom backend for storage purposes, such as a secret store.

* Which trust root (“upstream certificate authority (CA)”) your application will use

The SPIRE server provides a CA. If you’re, for example, using an external PKI system that provides an upstream CA, you can configure SPIRE to use that instead.

Once you’ve made these decisions, you can [configure the server](#step-4) and [configure the agent](#step-5) accordingly, after [installing them](#step-3-install-the-server-and-agent). 

# How to install the SPIRE server on Linux 

## Step 1: Obtain the SPIRE Binaries {#step-1}

Pre-built SPIRE releases can be found on the [SPIRE downloads page](/downloads#spire). These releases contain both server and agent binaries.

If you wish, you may also [build SPIRE from source](https://github.com/spiffe/spire/blob/master/CONTRIBUTING.md).

## Step 2: Install the Server and Agent {#step-2}

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

## Step 3: Configure the Server {#step-3}

To configure the server you:

1. Configure the trust domain
2. Configure the server certificate authority (CA), which might include configuring an UpstreamCA plugin 
3. Configure the node attestation plugin
4. Configure a default **.data** directory for persisting data

However, to get a simple deployment up and running for demonstration purposes, you need only go through steps 1, 2, and 3. 

To configure the items in steps 1 and 2, edit the server’s configuration file, located in **/opt/spire/conf/server/server.conf**.

If you choose to change the default data directory, you do this at the command line.  


For simplicity’s sake, this guide illustrates node attestation using the join token method. Note that SPIRE ships with the default node attestation method set to join token. 

Pre-built binaries must reside in a **.data** directory. Create this directory in the location of your choice. For example: 

```shell
sudo mkdir -p /opt/spire/.data
```

# How to install the SPIRE server on Kubernetes

TODO: We should find some standard Kubernetes configuration files and publish those, and reference them here. The standard files should be fully annotated.

This section walks you step-by-step through getting a server running in your Kubernetes cluster and configuring a workload container to access SPIRE.

{{< warning >}}
You must run all commands from the directory containing the **.yaml** files used for configuration. See [Obtain the Required Files](#section-1) for details.
{{< /warning >}}

## Section 1: Obtain the Required Files {#section-1}

This deployment this guide walks you through setting up requires a number of **.yaml** files *and* you must run all commands in the directory in which those files
reside.

To obtain this directory of files clone **https://github.com/spiffe/spire-tutorials** and obtain
the **.yaml** files from the **spire-tutorials/k8s** subdirectory.

## Section 2: Configure Kubernetes Namespace for SPIRE Components {#section-2}

Follow these steps to configure the **spire** namespace in which SPIRE Server and SPIRE Agent are deployed.

1. Create the namespace:

    ```bash
    $ kubectl apply -f spire-namespace.yaml
    ```

2. Run the following command and verify that *spire* is listed in the output:

    ```bash
    $ kubectl get namespaces
    ```

## Section 3: Configure SPIRE Server {#section-3}

To configure the SPIRE server, you:

1. Create server service account
2. Create server configmap
3. Create server statefulset

### Create Server Service Account

1. Configure a service account named **spire-server**, by applying the **server-account.yaml** configuration file:

    ```bash
    $ kubectl apply -f server-account.yaml
    ```

2. To confirm successful creation, verify that “spire-server” appears in the output of the following command:

    ```bash
    $ kubectl get serviceaccount --namespace spire
    ```

### Create Server Bundle Configmap, Role & ClusterRoleBinding

For the server to function, it is necessary for it to provide agents with certificates that they can use to verify the identity of the server when establishing a connection.

In a deployment such as this, where the agent and server share the same cluster, SPIRE can be configured to automatically generate these certificates on a periodic basis and update a configmap with contents of the certificate. To do that, the server needs the ability to get and patch a configmap object in the `spire` namespace.

1. Create the Configmap a named **spire-bundle** by applying the **spire-bundle-configmap.yaml** configuration file:

    ```bash
    $ kubectl apply -f spire-bundle-configmap.yaml
    ```

2. To confirm successful creation, verify the configmap **spire-bundle** is listed in the output of the following command:

    ```bash
    $ kubectl get configmaps --namespace spire | grep spire
    ```

To allow the server to read and write to this configmap, a ClusterRole must be created that confers the appropriate entitlements to Kubernetes RBAC, and that ClusterRoleBinding must be associated with the service account created in the previous step.

1. Create a ClusterRole named **spire-server-trust-role** and a corresponding ClusterRoleBinding by applying the **server-cluster-role.yaml** configuration file:

    ```bash
    $ kubectl apply -f server-cluster-role.yaml
    ```

2. To confirm successful creation, verify that the ClusterRole appears in the output of the following command:

    ```bash
    $ kubectl get clusterroles --namespace spire | grep spire
    ```

### Create Server Configmap

The server is configured in the Kubernetes configmap specified in server-configmap.yaml, which specifies a number of important directories, notably **/run/spire/data** and **/run/spire/config**. These volumes are bound in when the server container is deployed.

Before applying the configmap to your cluster, you should review the instructions for [customizing server configuration](#customize-server}).

To applying the server configmap to your cluster, issue the following command:

```bash
$ kubectl apply -f server-configmap.yaml
```

### Create Server StatefulSet

Deploy the server by applying the configuration **server-statefulset.yaml** file:

```bash
$ kubectl apply -f server-statefulset.yaml
```

This creates a statefulset called **spire-server** in the **spire** namespace and starts up a **spire-server** pod, as demonstrated in the output of the following two commands:

```bash
$ kubectl get statefulset --namespace spire

NAME           READY   AGE
spire-server   1/1     86m


$ kubectl get pods --namespace spire

NAME                           READY   STATUS    RESTARTS   AGE
spire-server-0                 1/1     Running   0          86m
```

When you deploy the server it automatically configures a livenessProbe on the SPIRE server's GRPC port, which ensures availability of the container.

When the server deploys, it binds in the volumes summarized in the following table:

| Volume | Description | Mount Location |
| :------ |:---------- | :------------- |
| **spire-config** | A reference to the **spire-server** configmap created in the previous step | **/run/spire/config** |
| **spire-data** | The hostPath for the server's SQLite database and keys file | **/run/spire/data** |

### Create Server Service

1. Create the server service by applying the **server-service.yaml** configuration file:

    ```bash
    $ kubectl apply -f server-service.yaml
    ```

2. Verify that the **spire** namespace now has a **spire-server** service in the **spire** namespace:

    ```bash
    $ kubectl get services --namespace spire

    NAME           TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
    spire-server   NodePort   10.107.205.29   <none>        8081:30337/TCP   88m
    ```
# Configuring the Server on Linux and Kubernetes {#customize-server}

TODO: Needs cleanup, and to be re-written to make sense whether a customer is a Linux or Kubernetes user.

## How to set up Node Attestation for Kubernetes nodes {#customize-server-k8s-attestation}
### SAT plugin
TODO: Complete

### PSAT plugin
TODO: Complete

## How to set up Node Attestation for Linux nodes {#customize-server-linux-attestation}

TODO: Much of the content here can be derived from that in Scytale Enterprise
### Join Token
### X.509

## How to set up attestation for Linux nodes running on a Cloud Provider {#customize-server-cloud-attestation}
TODO: Much of the content here can be derived from that in Scytale Enterprise
### AWS
### Azure
### GCP

## Customising the  type of database your application will use to store server data

TODO: What are the (built in) options here? 

## Configure the Server’s Trust Domain

To configure the server’s trust domain:

1. Edit the server’s configuration (on linux this is typically in **/opt/spire/conf/server/server.conf**, for Kubernetes it is typically in the X confi
2. Locate the section labeled **trust_domain**  
3. Enter the trust domain name you decided on in the [Plan Your Configuration](#plan-your-configuration) section above. 

## Configure the Trusted Root CA Plugin

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
## Customizing the  key management backend your application requires

TODO: Complete this.

When you customize these instructions for your architecture, you will substitute the appropriate path values to point to your application’s key and certs.

For a complete server configuration reference, see the [SPIRE Server Configuration Reference](https://github.com/spiffe/spire/blob/master/doc/spire_server.md).
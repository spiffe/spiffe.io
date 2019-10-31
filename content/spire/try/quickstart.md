---
title: SPIRE Quickstart
short: SPIRE Quickstart
description: How to quickly get SPIRE up and running
weight: 1
toc: false
---

## Overview

In this quick introduction to SPIRE you will learn how to:

* **Start the spire-server process**
* **Attest a spire-agent to the server using a join token**
* **Configure a registration entry for a workload**
* **Fetch an SVID over the WorkloadAPI**
* **Learn where to find resources for more complex installations on Linux and Kubernetes** 

## Prerequisites

* **A Linux or macOS environment**
* **The openssl command line tool**
* **For macOS, Go 1.11 or higher must be installed to build SPIRE. See https://golang.org/dl/ or run `brew install golang`**

The commands in this getting started guide can be run as a standard user or root.

## Installing SPIRE

### Downloading SPIRE for Linux

```
$ curl -L https://github.com/spiffe/spire/releases/download/0.8.4/spire-0.8.4-linux-x86_64-glibc.tar.gz | tar xzf -
```

This will create a `spire-0.8.4` directory containing the binaries and example configuration files.

### Building SPIRE on macOS/Darwin

*To complete this step you will need Go 1.11 or higher ([https://golang.org/dl/](https://golang.org/dl/))*

```
$ git clone --single-branch --branch v0.8 https://github.com/spiffe/spire.git
$ go build ./cmd/spire-server 
$ go build ./cmd/spire-agent
```

## Starting the SPIRE Server

The SPIRE Server manages and issues identities. You can use the example configuration file provided to start the server:

```
$ ./spire-server run -config conf/server/server.conf
...
INFO[0000] Starting TCP server   address="127.0.0.1:8081" subsystem_name=endpoints
INFO[0000] Starting UDS server   address=/tmp/spire-registration.sock subsystem_name=endpoints
```

{{< info >}}
The server will run in the foreground and log to standard out. You may want to perform the further steps in a new terminal window.
{{< /info >}}


## Creating a join token to attest the agent to the server

A join token is one of the many available agent attestor methods. It is a one-time-use, pre-shared key that attests (authenticates) the SPIRE agent to the SPIRE server. Other agent attestation methods include AWS/GCP instance identity tokens and X.509 certificates. To see a complete list of available attestors, click [here](https://spiffe.io/spire/overview/#selectors).

Check that the server is running:

```
$ ./spire-server healthcheck
Server is healthy.
```

Generate a one-time-use token to use to attest the agent:

```
$ ./spire-server token generate -spiffeID spiffe://example.org/myagent
Token: <token_string>
```

Make a note of the token, you will need it in the next step to attest the agent on initial startup.

{{< info >}}
A Join Token is just one of the many available agent attestation methods. To see a complete list of available attestors, click [here](https://spiffe.io/spire/overview/#selectors).
{{< /info >}}

## Starting the agent

SPIRE agents query the SPIRE server to attest (authenticate) nodes and workloads.

Use the token created in the previous step to start and attest the agent:

```
$ ./spire-agent run -config conf/agent/agent.conf -joinToken <token_string>
...
INFO[0000] Starting workload API   subsystem_name=endpoints
```

{{< info >}}
Like the server, the agent will run in the foreground and log to standard out, you may want to perform the further steps in a new terminal window.
{{< /info >}}


## Create a registration policy for your workload

In order for SPIRE to identify a workload, you must register the workload with the SPIRE Server, via registration entries. Workload registration tells SPIRE how to identify the workload and which SPIFFE ID to give it.

{{< info >}}
This command is creating a registration entry based on the current user's UID ($(id -u)) - feel free to adjust this as necessary
{{< /info >}}


```
$ ./spire-server entry create -parentID spiffe://example.org/myagent \
    -spiffeID spiffe://example.org/myservice -selector unix:uid:$(id -u)
Entry ID      : ac5e2354-596a-4059-85f7-5b76e3bb53b3
SPIFFE ID     : spiffe://example.org/myservice
Parent ID     : spiffe://example.org/myagent
TTL           : 3600
Selector      : unix:uid:501
```

{{< info >}}
`unix` is just one of the available workload attestation methods. To see a complete list of available attestors, click [here](https://spiffe.io/spire/overview/#selectors).
{{< /info >}}


## Fetch and view a x509 SVID 

Check that the agent is running:

```
$ ./spire-agent healthcheck
Agent is healthy.
```

This command replicates the process that a workload would take to get an SVID from the agent. The SVID could be used to authenticate the workload to another workload. To fetch and write an x509 SVID to /tmp/:

```
$ ./spire-agent api fetch x509 -write /tmp/
Received 1 bundle after 254.780649ms
SPIFFE ID:		spiffe://example.org/myservice
SVID Valid After:	2019-10-25 19:07:49 +0000 UTC
SVID Valid Until:	2019-10-25 20:07:21 +0000 UTC
Intermediate #1 Valid After:	2019-10-25 19:07:11 +0000 UTC
Intermediate #1 Valid Until:	2019-10-25 20:07:21 +0000 UTC
CA #1 Valid After:	2018-05-13 19:33:47 +0000 UTC
CA #1 Valid Until:	2023-05-12 19:33:47 +0000 UTC
Writing SVID #0 to file /tmp/svid.0.pem.
Writing key #0 to file /tmp/svid.0.key.
Writing bundle #0 to file /tmp/bundle.0.pem.
```

You can use the `openssl` command to view the contents of the SVID:

```
$ openssl x509 -in /tmp/svid.0.pem -text -noout
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number:
            a2:76:ed:12:58:b0:1e:9f:9a:5b:42:60:b4:b1:52:b8
    Signature Algorithm: ecdsa-with-SHA384
        Issuer: C=US, O=SPIFFE
        Validity
            Not Before: Oct 25 19:07:49 2019 GMT
            Not After : Oct 25 20:07:21 2019 GMT
        Subject: C=US, O=SPIRE
        Subject Public Key Info:
            Public Key Algorithm: id-ecPublicKey
                Public-Key: (256 bit)
                pub: 
                    04:62:3d:4f:3d:21:d1:cc:c4:8b:89:c8:b2:a9:f0:
                    bd:88:89:3d:c3:a6:fe:25:27:18:6b:56:b2:2c:9c:
                    78:8c:40:cc:50:4d:e7:8a:8e:c0:c9:77:69:23:a6:
                    ca:b7:97:42:dc:12:1c:1d:c7:82:26:8a:4e:d9:59:
                    0f:1e:15:ac:e8
                ASN1 OID: prime256v1
                NIST CURVE: P-256
        X509v3 extensions:
            X509v3 Key Usage: critical
                Digital Signature, Key Encipherment, Key Agreement
            X509v3 Extended Key Usage: 
                TLS Web Server Authentication, TLS Web Client Authentication
            X509v3 Basic Constraints: critical
                CA:FALSE
            X509v3 Subject Key Identifier: 
                9D:B4:3C:3A:D7:9C:3A:3D:FE:9D:00:47:5A:22:06:3B:95:4B:6A:40
            X509v3 Authority Key Identifier: 
                keyid:21:12:95:72:50:9E:B1:E5:BA:35:78:65:49:62:3C:0B:5C:4C:07:BD
            X509v3 Subject Alternative Name: 
                URI:spiffe://example.org/myservice
    Signature Algorithm: ecdsa-with-SHA384
         30:65:02:31:00:93:3c:f3:bd:cd:28:21:8f:dc:a9:bf:0b:41:
         34:21:54:cb:15:a0:92:9d:89:f8:f8:cc:49:e5:b7:e3:bd:0b:
         4f:a1:1a:46:ed:49:85:11:89:df:27:c1:06:72:7d:cd:bf:02:
         30:7b:ab:99:9e:bd:5d:ea:0d:05:85:f6:4e:18:11:8c:2d:f3:
         de:07:b5:e7:b7:6b:fe:b2:97:9c:41:d4:31:dd:7f:10:be:e4:
         75:ed:a4:bf:c3:ae:da:1d:28:4b:dc:2b:b5
```

## Next steps

* [An in-depth overview of SPIRE](https://spiffe.io/spire/overview/)

* [A detailed guide to installing and configuring SPIRE for Linux hosts](https://spiffe.io/spire/getting-started-linux/)

* [A detailed guide to installing and configuring SPIRE in a Kubernetes environment](https://spiffe.io/spire/getting-started-k8s/)


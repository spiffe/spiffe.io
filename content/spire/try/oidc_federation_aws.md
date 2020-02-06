---
title: SPIRE OIDC Federation with AWS
short: Federation
description: Setting up SPIRE to federate with AWS
weight: 50
toc: true
menu:
  spire:
    weight: 20
    parent: 'spire-try'
---
Since version 0.8.1, SPIRE contains experimental support for [Open ID Connect](https://openid.net/connect/) (OIDC) federation and SPIRE Server-to-SPIRE Server federation. This document describes how to authenticate SPIRE workloads to Amazon AWS S3 buckets using OIDC so the workloads can use data on S3. Using this document as a guide, you should be able to configure access to AWS services other than S3.

We assume the instances running workloads are on a cloud service other than Amazon, such as GCP. If the instances were on Amazon, you could use IAM to authenticate workloads rather than SPIFFE OIDC federation.

As OIDC is based on OAuth, SPIRE workloads use JWT [SVIDs](https://spiffe.io/spiffe/#spiffe-verifiable-identity-document-svid) rather than X.509 SVIDs to transmit workload identity information.

For more information about configuring SPIRE OIDC federation, watch a 22-minute [demo of OIDC authentication](https://www.youtube.com/watch?v=db_3LefoG9k&list=PLWsNZXV-gXVY_br7I8gz9q0Fijk4DoUxG&index=9&t=775s) to AWS S3 buckets.

## Related Documents

As part of setting up SPIRE OIDC federation, you must install and configure the SPIRE OIDC [Discovery Provider REST API](/spire/docs/oidc_discovery/).

Complete installation and configuration of the SPIRE Server and Agent are not described in this document. See the [SPIRE documentation](/spire/docs/) for installation and configuration information.

If you are new to SPIFFE and SPIRE, see the [SPIFFE overview](/spiffe/) and [SPIRE introductory documents](/spire/).

## Required Accounts and Permissions

To configure OIDC federation for access to AWS, you'll need the following:

* [SPIRE Server and Agent](/downloads/) executables
* Ability to create instances to contain the SPIRE Server and Agent
* Root access to the instances that contain the SPIRE Server and Agent
* Network access to an ACME-compliant CA such as Let's Encrypt
* Access to the AWS console
* [AWS CLI tools](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html) installed on the same instance as the SPIRE Agent
* DNS A record and TCP/IP access to port 443 for the SPIRE OIDC [Discovery Provider REST API](/spire/docs/oidc_discovery/)

# Part One: Configure SPIRE Components

In the first half of this procedure, you configure the SPIRE components. In the second half, you configure the AWS components.

## Configuration Overview for SPIRE Components

The table below summarizes the steps needed to configure the SPIRE components of OIDC federation to AWS. Follow the links for details.

| Step | Action | Description |
| --- | --- | --- |
| Step 1 | [Prepare installation environments](#prepare-installation-environments) | Decide where you'll install SPIRE components |
| Step 2 | [Install, configure, and run the SPIRE Server](#install-configure-and-run-the-spire-server) | Customize `server.conf`, including `ca_key_type` and `jwt_issuer` settings |
| Step 3 | [Install, configure, and run the OIDC Discovery Provider](#install-configure-and-run-the-oidc-discovery-provider) | The SPIRE OIDC Discovery Provider serves OIDC discovery documents via a REST API |
| Step 4 | [Install and configure SPIRE Agent](#install-and-configure-the-spire-agent) | Configure the SPIRE Agent as needed for your environment |
| Step 5 | [Register (Attest) the Node](#register-attest-the-node) | Verify the identity of the node (machine) that the SPIRE Agent runs on |
| Step 6 | [Register Workloads on the SPIRE Server](#register-workloads-on-the-spire-server) | Verify the identity of workloads |

# Configure SPIRE for OIDC Federation

Follow the procedures in the sections below to configure SPIRE for OIDC federation.

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

See [Configuring SPIRE](/spire/docs/configuring) and [Server configuration file](https://github.com/spiffe/spire/blob/master/doc/spire_server.md#server-configuration-file) for more information about SPIRE Server configuration settings.

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

## Install, configure, and run the OIDC Discovery Provider

The SPIRE OIDC Discovery Provider serves OIDC discovery documents via a REST API. See the separate [OIDC Discovery Provider](/spire/docs/oidc_discovery/) installation documentation.

Throughout this document, `spire-oidc.example.org` is used as an example SPIRE OIDC Discovery Provider REST API domain.

## Install and Configure the SPIRE Agent

The steps below provide an overview of installing and configuring the SPIRE Agent. For more detailed information, see [Install SPIRE Agents](/spire/docs/install-agents/).

1. Set up an instance or machine on which to run the SPIRE Agent, typically a different machine than the SPIRE Server.

2. [Download](/downloads/) and [install](/spire/docs/install-agents/) SPIRE Agent.

4. Make any necessary changes to your SPIRE Agent configuration file such as configuring a trust domain and bind port as described in [Configuring SPIRE](/spire/docs/configuring/). For more information on `agent.conf` options, see the [SPIRE Agent Configuration Reference](https://github.com/spiffe/spire/blob/master/doc/spire_agent.md#agent-configuration-file) on GitHub.

## Register (Attest) the Node

A SPIRE Server identifies SPIRE Agents through the process of [node attestation](/spire/concepts#node-attestation). This is accomplished through Node Attestor and Node Resolver plugins, which you configure and enable in the server.

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

# Part Two: Configure AWS Components

After configuring the SPIRE components, continue with configuring AWS.

## Configuration Overview for AWS Components

The table below summarizes the steps needed to configure AWS for OIDC federation. Follow the links for details for each step.

| Step | Action | Description |
| --- | --- | --- |
| Step 1 | [Set up the OIDC identity provider on AWS](#set-up-an-oidc-identity-provider-on-aws) | Configure an identity provider to allow access to Amazon AWS |
| Step 2 | [Create a custom AWS IAM policy](#create-a-custom-aws-iam-policy) | Create an access permissions policy to attach to the IAM role |
| Step 3 | [Create an AWS IAM Role for the identity provider](#create-an-aws-iam-role-for-the-identity-provider) | Create a Web Identity role |
| Step 4 | [Add the SPIFFE ID to the IAM role](#add-the-spiffe-id-to-the-iam-role) | Restrict S3 access to workloads matching the SPIFFE ID |
| Step 5 | [Get a JWT SVID and Access S3](#get-a-jwt-svid-from-the-agent-and-access-s3) | Fetch a JWT SVID from the agent and use it to authenticate to S3 |

## Set up an OIDC Identity Provider on AWS

To allow the SPIRE Agent to authenticate to an AWS service such as an S3 bucket, you must configure an OpenID Connect identity provider. The AWS identity provider queries the SPIRE OIDC [Discovery Provider REST API](/spire/docs/oidc_discovery/) that you configured.

1. Navigate to the AWS [Identity and Access Management (IAM) page](https://console.aws.amazon.com/iam/home#/home), logging in if necessary.

2. Click **Identity Providers** on the left and then click **Create Provider** at the top of the page.

3. For **Provider Type**, choose **OpenID Connect**.

4. For **Provider URL**, type the URL corresponding to the `domain` that you configured in the  `oidc-discovery-provider.conf` for the OIDC Discovery Provider. This is URL to the OIDC Discovery Provider REST API, such as `https://spire-oidc.example.org`.

5. For **Audience**, type an arbitrary string that you'll use when authenticating to the Amazon S3 bucket with the SPIRE agent. You can create additional audience strings for an identity provider after creating the provider. Click **Next Step**.

6. Verify the information on the **Verify Provider Information** page and if OK, click **Create**.

7. If desired, you can add additional audiences from the **Summary** page.

## Create a Custom AWS IAM Policy

If you want to create a custom access policy to attach to your IAM role, create it before configuring your IAM role. If you plan to use an existing IAM policy, either one you've already created or a standard Amazon policy, proceed to the next section.

To create a custom AWS IAM policy:

1. Navigate to the AWS [Identity and Access Management (IAM) page](https://console.aws.amazon.com/iam/home#/home), logging in if necessary.

2. Click **Policies** on the left and then click **Create Policy** in the middle of the page.

3. Click **Choose a service** and click the service to which you are configuring federation, such as **S3**.

4. Under **Actions** configure the actions on the service that this policy should allow access to.

5. Under **Resources**, configure the specific resources that the actions should allow access to or click **Any** to enable access to all matching resources.

6. If necessary, configure **Request conditions** such as limiting access to certain IP ranges.

7. Click **Review policy**.

8. Type a name for the policy, a description if desired, and click **Create policy**.

### Sample AWS IAM Policy

Use the following JSON configuration as an aid in creating your own AWS IAM S3 policy.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "s3:PutAccountPublicAccessBlock",
                "s3:GetAccountPublicAccessBlock",
                "s3:ListAllMyBuckets",
                "s3:ListJobs",
                "s3:CreateJob",
                "s3:HeadBucket"
            ],
            "Resource": "*"
        },
        {
            "Sid": "VisualEditor1",
            "Effect": "Allow",
            "Action": "s3:*",
            "Resource": [
                "arn:aws:s3:::oidc-federation-test",
                "arn:aws:s3:::oidc-federation-test/*",
                "arn:aws:s3:*:*:job/*"
            ]
        }
    ]
}
```

## Create an AWS IAM Role for the Identity Provider

The IAM role contains the connection parameters for the OIDC federation to AWS such as the OIDC identity provider, IAM policy, and SPIFFE ID of the connecting workloads.

1. Navigate to the AWS [Identity and Access Management (IAM) page](https://console.aws.amazon.com/iam/home#/home), logging in if necessary.

2. Click **Roles** on the left and then click **Create Role** in the middle of the page.

3. Click **Web Identity** near the top of the page.

4. For **Identity provider**, choose the identity provider that you created in AWS in the previous section.

5. For **Audience**, choose one of the audiences that you configured for the identity provider in the previous section and then click **Next: Permissions**.

6. Select one or more policies to associate with the AIM role and click **Next: Tags**.

7. If desired, specify one or more tags to keep track of this IAM role and then click **Next: Review**.

8. Type a name for the IAM role, a description if desired, and click **Create role**. Examples in this document use `oidc-role` as the name for the IAM role.

## Add the SPIFFE ID to the IAM Role

To allow the workload from outside AWS to access the AWS resource, such as S3, add the workload's SPIFFE ID to the IAM role. This restricts access to the IAM role to JWT SVIDs with the specified SPIFFE ID.

1. Navigate to the AWS [Identity and Access Management (IAM) page](https://console.aws.amazon.com/iam/home#/home), logging in if necessary.

2. Open the IAM role that you created in the previous section. If needed, click **Roles** on the left, use the search field to find the IAM role that you created in the last section, and click the role.

3. Click the **Trust relationships** tab near the middle of the page and then click **Edit trust relationship**.

4. In the JSON access control policy, add a condition line at the end of the `StringEquals` attribute to restrict access to workloads matching the SPIFFE ID you configured.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::012345678901:oidc-provider/spire-oidc.example.org"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "spire-oidc-example.org:aud": "mys3",
          "spire-oidc-example.org:sub": "spiffe://spire-oidc-example.org/workload"
        }
      }
    }
  ]
}
```

5. Click **Update Trust Policy**.

## Get a JWT SVID from the Agent and Access S3

Retrieve a JWT SVID from the SPIRE Agent and use the JWT token in the JWT SVID to access S3.

1. Run the following command on the instance where you've installed the SPIRE Agent to retrieve a JWT SVID:

```console
/opt/spire-agent/bin/spire-agent api fetch jwt -audience mys3 -socketPath /opt/spire-agent/sockets/agent.sock
```

This will output something similar to:

```console
token(spiffe://spire-oidc.example.org/oidc-test-workload):
    0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789
    JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0
    123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789J
    WT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN01
    23456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JW
    T-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN012
    3456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT
    -TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN012
bundle(spiffe://spire-oidc.example.org):
    {
    "keys": [
        {
            "use": "jwt-svid",
            "kty": "RSA",
            "kid": "ABCDEFGHIJKLMNOPQRSTUVWXYZ012345",
            "n": "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789
            ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEF
            GHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKL
            MNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQR
            STUVWXYZ0123456789ABCDEFGHIJKLMNOPQR",
            "e": "AQAB"
        }
    ]
}
```

2. Save the JWT portion of the previous command's output to an environmental variable, using the syntax appropriate for the shell you're using:
```console
export JWT=0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN012
3456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOK
EN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JW
T-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456
789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN01
23456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TO
KEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789J
WT-TOKEN0123456789JWT-TOKEN012
```

This environmental variable will be used by the AWS `aws sts assume-role-with-web-identity` command later.

3. Save the JWT to a file for use by the AWS `aws s3 cp` command later.

```console
echo JWT=0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN01234
56789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN
0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-
TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN012345678
9JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123
456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKE
N0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT-TOKEN0123456789JWT
-TOKEN0123456789JWT-TOKEN012 > token
```

4. Optionally, test that you can retrieve an STS token by running the following command:

```console
aws sts assume-role-with-web-identity --role-arn arn:aws:iam::012345678901:role/oidc-role \
--role-session-name mys3 --web-identity-token $JWT
```

If successful, the command will return JSON output similar to the following.

```json
{
    "Credentials": {
        "AccessKeyId": "0123456789ABCDEFGHIJ",
        "SecretAccessKey": "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123",
        "SessionToken": "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRS
TUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789A
BCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRS
TUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789A
BCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRS
TUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789A
BCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXY=",
        "Expiration": "2019-10-11T21:59:06Z"
    },
    "SubjectFromWebIdentityToken": "spiffe://spire-oidc.example.org/oidc-test-workload",
    "AssumedRoleUser": {
        "AssumedRoleId": "0123456789ABCDEFGHIJK:mys3",
        "Arn": "arn:aws:sts::012345678901:assumed-role/oidc-role/mys3"
    },
    "Provider": "arn:aws:iam::012345678901:oidc-provider/spire-oidc.example.org",
    "Audience": "mys3"
}
```

5. Access S3 using the JWT that you retrieved earlier. In this example, we're copying the file `s3://oidc-federation-test/test.txt` to our local environment. You would run the following command on the instance where you've installed the SPIRE Agent, specifying the ARN of the IAM role that you created earlier:

```console
AWS_ROLE_ARN=arn:aws:iam::012345678901:role/oidc-role AWS_WEB_IDENTITY_TOKEN_FILE=token \
aws s3 cp s3://oidc-federation-test/test.txt test.txt
```

If successful, this command would output:

```console
download: s3://oidc-federation-test/test.txt to ./test.txt
```

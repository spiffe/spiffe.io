---
title: Accessing S3 buckets via SPIRE OIDC Federation
short: AWS Federation
description: Configuring SPIRE workloads to access Amazon S3 buckets
weight: 70
---
This document describes how to authenticate SPIRE workloads to Amazon AWS S3 buckets using [Open ID Connect](https://openid.net/connect/) (OIDC) so the workloads can use data on S3. Using this document as a guide, you should be able to configure access to AWS services other than S3.

We assume the instances running workloads are on a cloud service other than Amazon, such as GCP. If the instances were on Amazon, you could use IAM to authenticate workloads rather than SPIFFE OIDC federation.

For more information about configuring SPIRE OIDC federation, watch a 22-minute [demo of OIDC authentication](https://www.youtube.com/watch?v=db_3LefoG9k&list=PLWsNZXV-gXVY_br7I8gz9q0Fijk4DoUxG&index=9&t=775s) to AWS S3 buckets.

## Related Documents

Before proceeding with these instructions, see [Configuring SPIRE for OIDC Federation](/spire/docs/federation/oidc_federation).

Complete installation and configuration of the SPIRE Server and Agent are not described in this document. Instead see [Install SPIRE Server](/spire/docs/install-server/) and [Install SPIRE Agents](/spire/docs/install-agents/).

If you are new to SPIFFE and SPIRE, see the [SPIFFE overview](/spiffe/) and [SPIRE introductory documents](/spire/).

## Required Accounts and Permissions

To configure OIDC federation to AWS S3 buckets, you'll need the following:

* Access to the AWS console
* [AWS CLI tools](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html) installed on the same instance as the SPIRE Agent

## Configuration Overview

The table below summarizes the steps needed to configure SPIRE workload OIDC authentication to AWS S3 buckets. Follow the links for details for each step.

| Step | Action | Description | 
| --- | --- | --- |
| Step 1 | [Configure the SPIRE Server, Agent, and OIDC Discovery Provider](/spire/docs/federation/oidc_federation) | These steps are described in the linked document |
| Step 2 | [Customize the SPIRE server configuration](#customize-the-spire-server-configuration) | Customize `server.conf`, including `ca_key_type` and `jwt_issuer` settings |
| Step 3 | [Set up the OIDC identity provider on AWS](#set-up-an-oidc-identity-provider-on-aws) | Configure an identity provider to allow access to Amazon AWS |
| Step 4 | [Create a custom AWS IAM policy](#create-a-custom-aws-iam-policy) | Create an access permissions policy to attach to the IAM role |
| Step 5 | [Create an AWS IAM Role for the identity provider](#create-an-aws-iam-role-for-the-identity-provider) | Create a Web Identity role |
| Step 6 | [Add the SPIFFE ID to the IAM role](#add-the-spiffe-id-to-the-iam-role) | Restrict S3 access to workloads matching the SPIFFE ID |
| Step 7 | [Get a JWT SVID and Access S3](#get-a-jwt-svid-from-the-agent-and-access-s3) | Fetch a JWT SVID from the agent and use it to authenticate to S3 |


## Customize the SPIRE Server Configuration

Modify the following two settings in your `server.conf` SPIRE Server configuration file to configure OIDC interoperability with AWS.

| Setting | Example | Description |
| --- | --- | --- |
| `ca_key_type` |  `rsa-2048` | The key type used for the server certificate authority.<br/> Valid key types depend on the service to which you are configuring federation. To authenticate to AWS services, the only valid key type is `rsa-2048`. AWS does not support elliptical curve keys.|
| `jwt_issuer` | `https://spire-oidc.example.org` | The URL to the OIDC discovery-supporting identity provider. This value is put in the "iss" (issuer) claim in JWT-SVIDs created by SPIRE Server.  This should be the same domain that you configure for the `domain` setting in the OIDC Discovery Provider `oidc-discovery-provider.conf` file. |

See [Configuring SPIRE](/spire/docs/configuring) and [Server configuration file](https://github.com/spiffe/spire/blob/master/doc/spire_server.md#server-configuration-file) for more information about SPIRE Server configuration settings.

## Set up an OIDC Identity Provider on AWS

To allow the SPIRE Agent to authenticate to an AWS service such as an S3 bucket, you must configure an OpenID Connect identity provider.

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

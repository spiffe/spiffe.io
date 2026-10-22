# Commercial ecosystem source review

Checked 22 October 2026. Thirteen additive records supplement the inherited directory. The Rust SDK entry now points to its published `spiffe` crate. Vendor documentation describes support; this is not an independent interoperability or conformance audit.

The new commercial view includes these thirteen offerings and the three existing upstream commercial integrations. Existing matrix declarations were preserved.

| Offering | Documented scope | Primary sources |
| --- | --- | --- |
| Aembit | Identity issuance and access | [X.509-SVID provider](https://docs.aembit.io/user-guide/access-policies/credential-providers/about-spiffe-x509-svid/); [JWT-SVID support](https://aembit.io/press-release/aembit-introduces-spiffe-credential-provider-to-extend-secure-workload-authentication-across-cloud-native-and-ai-environments/) |
| Cofide Connect | SPIRE operations and integration | [Workload credentials](https://docs.cofide.dev/workloads/credentials/); [Deploy Cofide SPIRE](https://docs.cofide.dev/trust-zones/deploy-spire/) |
| Defakto | Identity issuance and federation | [Identity model](https://d.defakto.security/mint/concepts/terminology/); [AWS federation](https://d.defakto.security/mint/integration/tutorial-aws-federation/); [Serverless identities](https://d.defakto.security/mint/configuration/serverless-configuration/serverless-configuration-overview/) |
| Google Cloud managed workload identities | Managed identity issuance | [Managed workload identities](https://docs.cloud.google.com/iam/docs/managed-workload-identity) |
| Greymatter | Service identity and networking | [SPIRE integration](https://greymatter.gitbook.io/grey-matter-documentation/usage/fabric/security/spire); [Platform scope](https://greymatter.io/blog/greymatter-vs-istio-differences/) |
| Idira Secure Workload Access | Identity issuance and secrets access | [Workload identity overview](https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-overview.htm); [Agent and Workload API](https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-troubleshooting.htm) |
| Messier 42 Quantum Helix | Identity for high-assurance environments, signed AI records and CABE integration | [Identity and cryptography](https://messier42.com/engineering/identity/); [Notary evidence](https://messier42.com/engineering/evidence/); [CABE integration](https://messier42.com/quantum-helix/); [Security model](https://messier42.com/security/) |
| Red Hat Zero Trust Workload Identity Manager | SPIRE operations on OpenShift | [Product overview](https://www.redhat.com/en/technologies/cloud-computing/openshift/zero-trust-workload-identity-manager); [Release documentation](https://docs.redhat.com/en/documentation/openshift_container_platform/4.19/html/security_and_compliance/zero-trust-workload-identity-manager) |
| Riptides | X.509-SVID and JWT-SVID issuance, daemon attestation, Linux kernel mTLS | [Workload identity](https://docs.riptides.io/concepts/workload-identity/); [Architecture](https://docs.riptides.io/concepts/architecture/); [Vendor article](https://riptides.io/blog/how-to-deliver-spiffe-identity-to-ai-agents/) |
| OpenAI | Service accepting JWT-SVIDs through federation | [SPIFFE setup](https://developers.openai.com/api/docs/guides/workload-identity-federation/spiffe); [Exchange reference](https://developers.openai.com/api/reference/workload-identity-federation) |
| Anthropic / Claude | Service accepting JWT-SVIDs through federation | [SPIFFE setup](https://platform.claude.com/docs/en/manage-claude/wif-providers/spiffe); [WIF reference](https://platform.claude.com/docs/en/manage-claude/wif-reference) |
| StrongDM ID | JWT-SVID issuance for workloads and agents | [SPIFFE client examples](https://github.com/strongdm/agentic-auth/blob/master/examples/spiffe-client/README.md); [Identity service integration](https://github.com/strongdm/agentic-auth/blob/master/README.md) |
| Teleport Workload Identity | Identity issuance and integration | [Workload identity](https://goteleport.com/docs/machine-workload-identity/workload-identity/introduction/); [Agent configuration](https://goteleport.com/docs/reference/machine-workload-identity/machine-id/configuration/) |

## Claim boundaries

Messier 42 is listed alphabetically under the same rules as other vendors. Its public identity guide supports namespace authority selection, X.509-SVID delivery, TPM attestation, SPIFFE federation, ML-DSA issuer signatures and ML-KEM/hybrid key establishment. The Notary entry describes the protocol-agnostic signing engine and its middleware model. The published evidence guide documents HTTP and MQTT integrations. CABE supplies policy-controlled object-key access through a client integration. Protocol configuration details belong in the linked technical documentation. The directory presents these capabilities directly.

Google Cloud documentation marks the GKE offering as Preview. Red Hat 4.18 and 4.19 documentation differ on maturity; the entry links the 4.19 release documentation and tells readers to use their matching version.

These records do not add inferred support checkmarks to the inherited implementation matrix. Matrix consolidation remains open in finding F7.

## Related community entry

nono is included under Service Meshes & Proxies as a community project. Its supervisor consumes JWT-SVIDs through the Workload API and uses them for bearer injection or OAuth token exchange outside the sandboxed process. Issue [#1095](https://github.com/nolabs-ai/nono/issues/1095) is closed as completed and references implementation PR [#1272](https://github.com/nolabs-ai/nono/pull/1272). The entry follows the [current integration documentation](https://github.com/nolabs-ai/nono/blob/07ffbf88c56182070a11a4f92ab076524297e914/docs/cli/features/spiffe.mdx) and [credential-source code](https://github.com/nolabs-ai/nono/blob/07ffbf88c56182070a11a4f92ab076524297e914/crates/nono-proxy/src/spiffe.rs), rather than treating every goal in the original issue as implemented.

## Riptides and SPIRE source check

Riptides product documentation establishes X.509-SVID and JWT-SVID issuance and the daemon/kernel integration. The kernel generates X.509 keys and CSRs; the daemon and control plane supply certificates. This is more precise than the article's description of issuance entirely inside the kernel. No Workload API support or interoperability with either AI API is inferred from SVID issuance. The article remains a labeled vendor source.

SPIRE's [upstream overview](https://spiffe.io/docs/latest/spire-about/) identifies it as production-ready. Its [architecture](https://spiffe.io/docs/latest/spire-about/spire-concepts/) describes runtime workload attestation and cached SVID delivery, including AWS node attestation. Its [agent configuration reference](https://spiffe.io/docs/latest/deploying/spire_agent/#availability-target) describes automatic X.509-SVID rotation. These sources do not support the article's characterization of SPIRE as a demonstration, Kubernetes-bound, or lacking credential lifecycle management. Application authorization and delegated user credentials are separate concerns.

---
title: Get Involved
short: Get Involved
navgroup: spiffe-about
description: How to navigate and connect with the SPIFFE community
weight: 400
aliases:
    - /community
    - /docs/latest/spiffe/get-involved
---

SPIFFE is guided by a small but very active community of passionate software engineers with empathy for the problems that the project is tackling.

## Join the Community

* **Slack** --- Most real-time discussions happen on SPIFFE's Slack channels at https://spiffe.slack.com. You can join [here](https://slack.spiffe.io/).

* **Mailing lists** --- Announcements occur in the SPIFFE [Google Group](https://groups.google.com/a/spiffe.io/forum/#!forum/announce). There is also a [users](https://groups.google.com/a/spiffe.io/forum/#!forum/user-discussion) and [developers](https://groups.google.com/a/spiffe.io/forum/#!forum/dev-discussion) list.

* **Special Interest Groups and Working Groups** --- The broader SPIFFE community is self-organized into Special Interest Groups (SIGs) that coordinate to manage specific aspects of SPIFFE’s design, and Working Groups (WGs) that focus on short-term cross-SIG initiatives. A list of active SIGs and WGs can be found [here](https://github.com/spiffe/spiffe/tree/main/community).

* **Social media** --- Follow us on [Twitter](https://twitter.com/SPIFFEio).

## Contribute to the Project

You can contribute to SPIFFE and SPIRE by filing issues and submitting pull requests on GitHub. See these contribution guidelines for details such as GitHub etiquette and coding conventions:

* [SPIFFE contribution guidelines](https://github.com/spiffe/spiffe/blob/main/CONTRIBUTING.md)
* [SPIRE contribution guidelines](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/CONTRIBUTING.md)

While anyone is welcome to propose contributions via pull requests, we strongly encourage significant contributions - particularly those that might require a significant change to core components - to be first discussed and a high level design agreed upon with the appropriate SIGs or WGs (see above).

Day to day contributions are vetted by the project's maintainers. Overall project direction, guidance and conflict resolution is overseen by the projects' Technical Steering Committee. Full details on this process can be found [in the project GOVERNANCE page](https://github.com/spiffe/spiffe/blob/main/GOVERNANCE.md).

### Add SPIFFE Support to Other Projects

Contributions don't have to land in the SPIFFE and SPIRE repositories to move the project forward. Adding SPIFFE support to other tools, libraries, and platforms is one of the most valuable ways to grow the [SPIFFE ecosystem](/docs/latest/spiffe-about/ecosystem/). Some good starting points:

* **Consume SPIFFE identities in your application or library** --- add support for fetching identities from the [SPIFFE Workload API](/docs/latest/spiffe-about/spiffe-concepts/#spiffe-workload-api), for example by building on one of the SDKs listed on the ecosystem page.

* **Accept SVIDs in a tool you maintain or use** --- allow workloads to authenticate to a database, proxy, message broker, or other service with an X.509-SVID or JWT-SVID instead of a shared secret.

* **List a project on the ecosystem page** --- if a project already supports SPIFFE but isn't listed, add an entry to [`data/ecosystem.yaml`](https://github.com/spiffe/spiffe.io/blob/master/data/ecosystem.yaml) and open a pull request against [spiffe/spiffe.io](https://github.com/spiffe/spiffe.io).

If you're unsure where to start, ask in the [SPIFFE Slack](https://slack.spiffe.io/) channels or bring your idea to one of the SIGs or WGs listed above --- the community is happy to help scope out an integration.

## SPIFFE and SPIRE Branding Media Library

Find SPIFFE and SPIRE logos here:

* [SPIFFE](https://branding.cncf.io/tree/master/projects/spiffe)
* [SPIRE](https://branding.cncf.io/tree/master/projects/spire)

{{< scarf/pixels/medium-interest >}}

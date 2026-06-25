---
title: "[Re-Cap] SPIFFE Community Day: Fall 2018"
description: "A recap of SPIFFE's seventh community day, held in November 2018 across San Francisco, New York, and online for 150+ attendees. The event featured project updates, demos, and talks from Pinterest, Square, and VMware, with a spotlight on two emerging capabilities: SPIFFE Federation for establishing trust across identity namespaces, and JWT-SVID support for token-based service authentication."
date: 2020-06-08
author: "Umair M. Khan"
tags: ["Community"]
draft: false
---
Scytale hosted SPIFFE’s seventh community day in November 2018. This event was a great way for participants to learn the latest SPIFFE/SPIRE updates, and to meet peers and practitioners. Being new to this community, it was a great learning experience for me. It certainly felt like drinking from a firehose!

The event nearly doubled in attendance, with 150+ participants representing various industries attending in person in San Francisco and New York and online.

The [agenda](http://go.scytale.io/spiffe-community-day-2018-nov-agenda) was full of project updates, demos, and user presentations from organizations including Pinterest, Square, and VMware. Of the many project updates, two stood out for me:

-   **SPIFFE Federation**: In today’s enterprise, a natural tension exists between a desire for a contiguous service identity namespace with consistently applied and auditable policies, and a desire for isolation and autonomy. Some examples of this include when distinct business units are supported by independent platforms teams but must establish mutual trust. The SPIFFE community foresees that adopters will want to establish mutual trust between SPIFFE-compatible vendors.
-   _SPIFFE Federation_ is a proposal to build trust between two identity namespaces, running across heterogeneous platforms. Work is being done in SPIFFE to define a standard interface for federation support, and in SPIRE to implement that interface. [Here’s Scytale’s Max Lambrecht](https://www.youtube.com/watch?v=8VE8TKCuS_I&feature=youtu.be&t=485) discussing the upcoming Federation API.
-   **JWT Support:** Many organizations want to use JWT-based tokens for service-to-service authentication, but up till now the only way to authenticate using a SPIFFE ID was via an X.509 certificate. While this suffices for many use-cases (eg. mTLS), there are others where mTLS is unsuitable (e.g. when an application load balancer is in the network path, or when queue messages must be identified). A group of SPIFFE contributors has been working on a JWT-based token specification of the SPIFFE ID (the JWT-SVID), and a mechanism to generate and validate these tokens via the SPIFFE Workload API. This **GREATLY** simplifies JWT-based authentication between workloads. [Here’s Scytale’s Andrew Harding](https://www.youtube.com/watch?v=8VE8TKCuS_I&feature=youtu.be&t=1415) discussing the JWT support.

Here’s a complete recording of the meeting (two parts):

[Watch on YouTube](https://www.youtube.com/watch?v=2rMSS8tDevM)

[Watch on YouTube](https://www.youtube.com/watch?v=8VE8TKCuS_I)

Slides are available here:

[View on Google Docs](https://docs.google.com/presentation/d/1trpEu7QFh8g7mtNBf6dAIjhN_GHtxhVzT58xWH6r-pY/edit?usp=sharing)

A big thank you to all presenters, contributors, and attendees for making it a huge success. Special thanks to Square (in San Francisco) and [Work-Bench](https://www.work-bench.com/) (in New York) for hosting the SPIFFE community.

*This post was [originally published on the SPIFFE Medium blog](https://medium.com/spiffe/re-cap-spiffe-community-day-fall-2018-6d098c921ab).*

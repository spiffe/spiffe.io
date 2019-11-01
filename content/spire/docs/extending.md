---
title: Extend SPIRE
description: Learn how to extend SPIRE with third-party plugins
weight: 140
---

# Available third party plugins

TODO: This should list out third party plugins that developers have made available, grouped by plugin type, with a short description of each.

# Integrating third party plugins

TODO:  This should explain how a third party plug-in such as https://github.com/bloomberg/spire-tpm-plugin. The text below should explain how to do this step by step.

As described above in the [Plan Your Configuration](#plan-your-configuration) section, before installing and configuring you determine which plugin you configure the server to use for node attestation. You must edit the configuration file to point to the path to the binary of the plugin your application will use. 

1. Edit the server’s configuration file in **/opt/spire/conf/server/server.conf**
2. Locate the **plugin_cmd = { .. }** entry in the **plugins { ... }** section 
3. Set the value to the path to your plugin binary 
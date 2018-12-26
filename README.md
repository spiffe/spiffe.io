# spiffe.io

This repository contains the source for the [SPIFFE](https://github.com/spiffe/spiffe) website, currently hosted at https://spiffe.netlify.com. That website also contains the documentation for [SPIRE](https://github.com/spiffe/spire), the SPIFFE Runtime Environment.

## Toolchain

The site is built using:

* [Hugo](https://gohugo.io/)
* The [Bulma](https://bulma.io) CSS framework

## Develop the site locally

To develop the locally, you'll first need to install some assets (mostly Sass assets) using [npm](https://npmjs.org):

```shell
make setup
```

With those assets in place, you can run the site locally using [Hugo](#hugo) or [Docker](#docker).

### Hugo

To run the site using Hugo, make sure it's [installed](https://gohugo.io/getting-started/installing/) and then run:

```shell
make serve
```

> Check the `HUGO_VERSION` environment variable in the [`netlify.toml`](netlify.toml) configuration file to see which Hugo version is deemed canonical for the SPIFFE website. Any Hugo version at or after that version should work fine. If you plan on working on the Sass/CSS, make sure to install the "extended" version of Hugo with support for [Hugo Pipes](https://gohugo.io/hugo-pipes/), which processes the Sass in realtime.

### Docker

If you have Docker installed, a convenient alternative to installing Hugo itself is to simply run:

```shell
make docker-serve
```

## Publishing the site

The site is published automatically by [Netlify](https://netlify.com). Whenever you merge pull requests to `master`, the site is automatically built and published in about a minute. **There's no need to handle this manually**.

## Updating the site

The assets used to build the site are in a variety of directories and formats.

### The "Who uses SPIFFE?" section

The list of issuers and consumers in the "Who uses SPIFFE?" section of the [home page](https://spiffe.netlify.com/) is generated using the [`data/users.yaml`](data/users.yaml) file. Make sure to add `name`, `description` (supports Markdown), `logo` file (all logos should be added to [`static/img/logos`](static/img/logos)), and a `link` to an external page.

### Documentation

Markdown sources for the documentation are in the [`content`](content) directory.

#### Latest SPIRE version

Hugo can automatically infer the latest version of SPIRE using the GitHub [Releases API](https://developer.github.com/v3/repos/releases/). To insert that version into text, use the [`spire-latest`](layouts/shortcodes/spire-latest.html) [shortcode](#shortcodes). Here's an example:

```markdown
The most recent version of SPIRE is {{< spire-latest >}}.
```

### The Downloads page

The [Downloads](https://spiffe.netlify.com/downloads) page is built automatically using information from the GitHub [Releases API](https://developer.github.com/v3/repos/releases/). You can alter the text of the Downloads page in [`content/downloads/_index.md`](content/downloads/_index.md).

### The SPIFFE specification

The [Specification](https://spiffe.netlify.com/spiffe/#spec) section of the main [SPIFFE page](https://spiffe.netlify.com/spiffe) is generated using a YAML list in [`data/spec.yaml`](data/spec.yaml).

### Shortcodes

Hugo has a feature called [shortcodes](https://gohugo.io/content-management/shortcodes/) that enables you to embed custom logic in Markdown files. The shortcodes for the site are in [`layouts/shortcodes`](layouts/shortcodes).

#### Acknowledgments

The shortcode for the "Acknowledgments" section of the [Community](https://spiffe.netlify.com/community/#acknowledgments) page is in the [`acknowledgments.html`](layouts/shortcodes/acknowledgments.html) shortcode. To alter the contents of this section, update the [`data/acknowledgments.yaml`](data/acknowledgments.yaml) file.

#### Admonition blocks

There are four admonition blocks available for the site: info, danger, success, and warning. Here's an example:

```
{{< info >}}
Here's some important info regarding the SPIFFE project.
{{< /info >}}
```

Admonition blocks support Markdown.
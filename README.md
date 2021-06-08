# spiffe.io

This repository contains the source for the [SPIFFE](https://github.com/spiffe/spiffe) website, currently hosted at https://spiffe.netlify.com. That website also contains the documentation for [SPIRE](https://github.com/spiffe/spire), the SPIFFE Runtime Environment.

## Toolchain

The site is built using:

* [Hugo](https://gohugo.io/)
* The [Bulma](https://bulma.io) CSS framework

## Develop the site locally

### Using Docker

This is the preferred way to run the website for local development as Docker is the only tool you need to install and tool dependencies are managed better in the Docker method.

Ensure that Docker is running and then type:
```shell
$ make docker-serve
```
This command takes a few minutes to create a Docker image with all the tools you need to run the website. After that, it will serve the website locally. Note that some of the steps might ask you to run additional commands, please ignore them.

The following line indicates that the image has been created and the website is ready:
```
Web Server is available at //localhost:1313/ (bind address 0.0.0.0)
```
Open [`http://localhost:1313`](http://localhost:1313) in your browser to view your local version of the spiffe.io website.

The website is now running in development mode, meaning that any changes in the Markdown files or the [external content descriptor file](./external.yaml) trigger a rebuild of the site. After the rebuild, the site is reloaded in your browser.

You can also run the website with a list of releases under the "SPIRE Releases" heading on the Downloads page (`content/downloads/_index.md`):
```shell
$ make docker-serve-with-releases
```

The default of `make docker-serve` omits the live SPIRE releases as a workaround to avoid a GitHub rate limiting issue as described in [issue 93](https://github.com/spiffe/spiffe.io/issues/93).

### Using your local environment

Alternatively, you can run the website in development mode using the tools installed in your operating system.

You'll need:
* [Hugo](https://gohugo.io/) (use [HUGO VERSION](./netlify.toml), or higher)
* [Python](https://www.python.org/) (use [recommended version](./.python-version), or higher. [Pyenv](https://github.com/pyenv/pyenv) is recommended for version management)
* [Pipenv](https://pipenv.pypa.io/)
* [npm](https://npmjs.org)

> If you plan on working on the Sass/CSS, make sure to install the "extended" version of Hugo with support for [Hugo Pipes](https://gohugo.io/hugo-pipes/), which processes the Sass in realtime.


First, you will have to install the dependencies running:
```shell
$ make setup
```

Then you can run the website by typing:
```shell
$ make serve # or make serve-with-releases
```

Hugo might take a few seconds to build and serve the website. The following line indicates that the website is ready:
```
Web Server is available at //localhost:1313/ (bind address 0.0.0.0)
```

The website is now available at [`http://localhost:1313`](http://localhost:1313). Changes in the Markdown files or the [external content descriptor file](./external.yaml) trigger a rebuild of the site. After the rebuild, the site is reloaded in your browser.

### Checking for broken links

It is common that URLs you are pointing to get deprecated or moved somewhere else over time, leading to broken links on our website.

In order to avoid this, there is a tool that lets you check whether there are broken links in the whole website or not.

First, make sure you are serving the website locally using the `-with-releases` form of the script (`make docker-serve-with-releases` or `make serve-with-releases`), and that it is accessible at `http://localhost:1313`, then run the following command:

```shell
make docker-check-links # if you are using Docker to serve the website
```

or

```shell
make check-links # if you are using a local toolchain to serve the website
```

The tool will crawl your local website and report if there's any broken link on it. If there's any, and you can't create a PR to fix the link right away, please [file an issue on GitHub](https://github.com/spiffe/spiffe.io/issues/new)

## Publishing the site

The site is published automatically by [Netlify](https://netlify.com). Whenever you merge pull requests to `master`, the site is automatically built and published in about a minute. **There's no need to handle this manually**.

## Updating the site

The assets used to build the site are in a variety of directories and formats.

### The "Who uses SPIFFE?" section

The list of issuers and consumers in the "Who uses SPIFFE?" section of the [home page](https://spiffe.netlify.com/) is generated using the [`data/users.yaml`](data/users.yaml) file. Make sure to add `name`, `description` (supports Markdown), `logo` file (all logos should be added to [`static/img/logos`](static/img/logos)), and a `link` to an external page.

### Documentation

Markdown sources for the documentation are in the [`content`](content) directory.

#### Latest SPIRE version

Hugo can automatically infer the latest version of SPIRE using the GitHub [Releases API](https://developer.github.com/v3/repos/releases/). To insert that version into text, use the [`spire-latest`](layouts/shortcodes/spire-latest.html) [shortcode](#shortcodes).
This shortcode has a mandatory parameter that can be either `version`, `tag` or `tarball`.

Here's an example:

```markdown
The most recent version of SPIRE is "{{< spire-latest "version" >}}", that is tagged as "{{< spire-latest "tag" >}}" and packed in the file "{{< spire-latest "tarball" >}}"
```

that will generate the following output:

```
The most recent version of SPIRE is "0.9.3", that is tagged as "v0.9.3" and packed in the file "spire-0.9.3-linux-x86_64-glibc.tar.gz"
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
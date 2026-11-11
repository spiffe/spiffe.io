# spiffe.io

This repository contains the source for the [SPIFFE](https://github.com/spiffe/spiffe) website, currently hosted at https://spiffe.netlify.com. That website also contains the documentation for [SPIRE](https://github.com/spiffe/spire), the SPIFFE Runtime Environment.

## Toolchain

The site is built using:

* [Astro](https://astro.build/) with the [Starlight](https://starlight.astro.build/) docs theme
* [Python](https://www.python.org/), for [`pull_external.py`](pull_external.py), which pulls documentation in from other SPIFFE repositories

## Develop the site locally

You'll need:
* [Node.js](https://nodejs.org/) 22.23.4 or newer
* [Python](https://www.python.org/) 3.12 or newer

First, install the dependencies:
```shell
$ make setup
```

Then run the website:
```shell
$ make serve # or make serve-with-releases
```

The website is now available at [`http://localhost:4175`](http://localhost:4175).
The build converts the Markdown and data files into Starlight input once at
startup, so rerun `make serve` after editing source files or the
[external content descriptor file](./external.yaml).

`make serve` omits the live SPIRE releases (`HIDE_RELEASES=true`) as a
workaround to avoid a GitHub rate limiting issue as described in
[issue 93](https://github.com/spiffe/spiffe.io/issues/93); version placeholders
are shown instead. Use `make serve-with-releases` to include them, setting
`GITHUB_TOKEN` to avoid the rate limit.

To build the site as Netlify does, run `make build`. The output is in
`astro/dist/`, and `npm --prefix astro run preview` serves it at
[`http://localhost:4175`](http://localhost:4175). The build checks internal
routes, fragments, aliases and the search index.

Edit the existing `content/`, `data/` and `static/` sources. Files generated
under `astro/src/content/` and `astro/public/` are ignored. The external-content
contribution rules still apply.

### Checking for broken links

It is common that URLs you are pointing to get deprecated or moved somewhere else over time, leading to broken links on our website.

In order to avoid this, there is a tool that lets you check whether there are broken links in the whole website or not. It runs automatically on every pull request via the [Link check](.github/workflows/link-check.yml) GitHub Actions workflow, and you can also run it locally.

First, make sure you are serving the website locally with the releases included (`make serve-with-releases`), and that it is accessible at `http://localhost:4175`, then run the following command:

```shell
make docker-check-links # to run linkchecker in Docker
```

or

```shell
make check-links # if you have linkchecker installed locally (make setup installs it)
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

The build can automatically infer the latest version of SPIRE using the GitHub [Releases API](https://developer.github.com/v3/repos/releases/). To insert that version into text, use the `spire-latest` [shortcode](#shortcodes).
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

The Markdown sources use Hugo-style [shortcodes](https://gohugo.io/content-management/shortcodes/) to embed custom logic. The build expands them in [`astro/scripts/content.mjs`](astro/scripts/content.mjs).

#### Acknowledgments

The shortcode for the "Acknowledgments" section of the [Community](https://spiffe.netlify.com/community/#acknowledgments) page is generated by the `acknowledgments` shortcode. To alter the contents of this section, update the [`data/acknowledgments.yaml`](data/acknowledgments.yaml) file.

#### Admonition blocks

There are four admonition blocks available for the site: info, danger, success, and warning. Here's an example:

```
{{< info >}}
Here's some important info regarding the SPIFFE project.
{{< /info >}}
```

Admonition blocks support Markdown.

## Writing for the blog

The blog lives at [`/blog/`](https://spiffe.io/blog/) and is generated from
Markdown under [`content/blog/`](content/blog). Each post is a folder named
`YYYY-MM-DD-slug` (the date prefix keeps posts ordered in the filesystem and
becomes part of the URL) containing an `index.md` and any images it uses:

```
content/blog/
  2026-06-19-my-post/
    index.md        # front matter + body
    diagram.png     # images live alongside the post
```

**The fastest way to write a post is to copy the annotated example,
[`content/blog/2026-06-19-writing-a-blog-post/`](content/blog/2026-06-19-writing-a-blog-post/index.md),
rename the folder, and replace the contents.** That post is a `draft` (so it
only shows in local previews) and documents the front matter, images, tags, and
publishing flow as it goes - read it for the full walkthrough. Posts are tagged
with one or more of three tags: `SPIFFE`, `SPIRE`, and `Community`.

To preview locally, run the site (`make serve`) and open
[`http://localhost:4175/blog/`](http://localhost:4175/blog/). SEO metadata
(title, description, canonical URL, Open Graph and Twitter Card tags) and the
[RSS feed](https://spiffe.io/blog/index.xml) are generated automatically; you
don't need to add them by hand.

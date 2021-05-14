import yaml
import os
import shutil
import re
import toml
import subprocess
import requests
from typing import List, Set, Tuple, Pattern, Match
from urllib.parse import urlparse
from pathlib import Path

CHECKOUT_DIR = "checkouts"
GIT_CLONE_CMD = "git clone {{}} ./{}/{{}}/{{}}".format(CHECKOUT_DIR)
GIT_CHECKOUT_CMD = "git checkout {}"
GITHUB_API_LATEST_RELEASE = "https://api.github.com/repos/spiffe/spire/releases/latest"
MARKDOWN_IMAGE_REFERENCE_STYLE_OPENING = "["
RE_EXTRACT_TITLE: Pattern[str] = re.compile("([#\s]*)(?P<title>.*)")
RE_EXTRACT_IMAGES: Pattern[str] = re.compile(
    "\!\[(?P<alt>.*)\](?P<style>[\(\[])(?P<url>.*)[\)\]]"
)
RE_EXTRACT_LINKS: Pattern[str] = re.compile(
    "\[(?P<alt>[^\]]*)\]\((?P<rel>[\.\/]*)(?P<url>(?P<domain>https?:\/\/(?P<host>[a-zA-Z\.0-9-]+))?(?!#)\S+)\)"
)
RE_EXTRACT_GITHUB_PATH: Pattern[str] = re.compile(
    "https?:\/\/github\.com\/\w+\/\w+\/\w+\/\w+\/(?P<path>.*)"
)

# holds the git URL and the new path for links between pulled in files
internal_links: dict = {}
config: dict = toml.load("config.toml")
latest_release = None


def main():
    _pull_latest_release()
    os.system("rm -rf ./{}/".format(CHECKOUT_DIR))
    yaml_external = _read_yaml("external.yaml")
    repos_to_clone: Set[str] = set()
    directories_to_create: List[str] = []

    content: dict
    for directory, content in yaml_external.items():
        directories_to_create.append(directory)

        repo = _get_repo_url_from_pull_url(content.get("source"))
        repos_to_clone.add(repo)

    _clone_repos(repos_to_clone)
    generated_files = _pull_files(yaml_external)
    _generate_gitignore(generated_files)


def _pull_latest_release():
    global latest_release
    json = _get_latest_spire_release()
    latest_release = json.get("tag_name", "master")

    with open("data/releases.yaml", "w") as releases_file:
        releases_file.write(yaml.dump({"latest": json}))


def _read_yaml(file_name: str) -> dict:
    with open(file_name, "r", encoding="utf-8") as stream:
        yaml_file = yaml.safe_load(stream)
        return yaml_file


def _get_repo_url_from_pull_url(url: str) -> str:
    parsed = urlparse(url)
    repo_owner, repo_name = _get_canonical_repo_from_url(url)
    return "https://{}/{}/{}".format(parsed.netloc, repo_owner, repo_name)


def _get_canonical_repo_from_url(url: str) -> Tuple[str, str]:
    parsed = urlparse(url)
    repo_owner, repo_name = parsed.path[1:].split("/")[:2]
    return repo_owner, repo_name


def _get_file_content(filename: str, remove_heading=False) -> Tuple[str, str]:
    with open(filename, "r") as f:
        raw = f.readlines()
        if not remove_heading:
            return "".join(raw)

        heading = None
        for i in range(len(raw)):
            if raw[i].startswith("#"):
                heading = RE_EXTRACT_TITLE.match(raw[i]).group("title")
                heading = '"' + heading.replace('"', '\\"') + '"'
                continue

            if not raw[i].startswith("#") and not raw[i].strip() == "":
                return "".join(raw[i:]), heading


def _generate_yaml_front_matter(front_matter: dict = {}) -> List[str]:
    fm = ["---"]
    for key, value in front_matter.items():
        if type(value) == dict:
            fm.append(yaml.dump({key: value}).strip())
        else:
            fm.append("{}: {}".format(key, value))
    fm.append("---")
    fm = [l + "\n" for l in fm]

    return fm


def _clone_repos(repos: List[str]):
    for repo_url in repos:
        repo_owner, repo_name = _get_canonical_repo_from_url(repo_url)
        cmd = GIT_CLONE_CMD.format(repo_url, repo_owner, repo_name)
        os.system(cmd)


def _get_latest_spire_release() -> dict:
    global latest_release
    if latest_release is not None:
        return latest_release
    data = requests.get(GITHUB_API_LATEST_RELEASE)

    return data.json()


def _checkout_switch(content: dict):
    source = content.get("source")
    latest_release = _get_latest_spire_release()
    cmd = GIT_CHECKOUT_CMD.format(latest_release).split()
    repo_owner, repo_name = _get_canonical_repo_from_url(source)
    cwd = os.path.join(CHECKOUT_DIR, repo_owner, repo_name)
    subprocess.run(cmd, stdout=subprocess.PIPE, cwd=cwd)


def _get_branch_by_repo_url(url: str) -> str:
    repo_owner, repo_name = _get_canonical_repo_from_url(url)
    branch = (
        _get_latest_spire_release()
        if (repo_owner, repo_name) == ("spiffe", "spire")
        else "master"
    )

    return branch


def _pull_files(yaml_external: dict) -> List[str]:
    generated_files: List[str] = []
    content: dict

    # collects all the URLs and new file paths for the pulled in files.
    # we need to do this as a prep step before processing each file
    # so we can redirect internally
    for target_dir, content in yaml_external.items():
        source = content.get("source", "").strip()
        if source == config.get("spireGitHubUrl"):
            _checkout_switch(content)
        for rel_file in content.get("pullFiles", []):
            branch = _get_branch_by_repo_url(source)
            full_url = "{}/blob/{}/{}".format(content.get("source"), branch, rel_file)
            file_name = os.path.basename(rel_file)
            file_path = os.path.join(target_dir, file_name)
            rel_path_to_target_file = ("".join(file_path.split(".")[:-1])).lower()
            internal_links[full_url] = "/docs/latest/{}/".format(
                rel_path_to_target_file
            )

    for target_dir, content in yaml_external.items():
        source = content.get("source", "").strip()
        pull_files: List[str] = content.get("pullFiles", [])
        repo_owner, repo_name = _get_canonical_repo_from_url(content.get("source"))

        # processes and copies content from the git checkout to the desired location
        for rel_file in pull_files:
            filename = os.path.basename(rel_file)
            abs_path_to_source_file = os.path.abspath(
                os.path.join(CHECKOUT_DIR, repo_owner, repo_name)
            )
            abs_path_to_target_file = _copy_file(
                abs_path_to_repo_checkout_dir=abs_path_to_source_file,
                rel_path_to_source_file=rel_file,
                target_dir=target_dir,
                transform_file=content.get("transform", {}).get(filename, None),
                remove_heading=True,
                source=source,
            )
            generated_files.append(abs_path_to_target_file)

    return generated_files


def _generate_gitignore(paths_to_include: List[str]):
    with open("content/.gitignore", "w") as gitignore:
        gitignore.write("# THIS FILE IS AUTO-GENERATED. DO NOT MODIFY BY HAND\n\n")
        for f in paths_to_include:
            gitignore.write(os.path.relpath(f, "content") + "\n")


def _copy_file(
    abs_path_to_repo_checkout_dir: str,
    rel_path_to_source_file: str,
    target_dir: str,
    source: str,
    transform_file: dict = {},
    remove_heading: bool = True,
) -> str:
    file_name = os.path.basename(rel_path_to_source_file)

    rel_path_to_target_file = os.path.join(target_dir, file_name)
    abs_path_to_target_file = os.path.abspath(
        os.path.join("content/docs/latest", rel_path_to_target_file)
    )

    path_to_target_file = Path(os.path.dirname(abs_path_to_target_file))
    path_to_target_file.mkdir(parents=True, exist_ok=True)

    # we just copy files that aren't markdown
    abs_path_to_source_file = os.path.join(
        abs_path_to_repo_checkout_dir, rel_path_to_source_file
    )
    if os.path.splitext(abs_path_to_target_file)[1] != ".md":
        shutil.copyfile(abs_path_to_source_file, abs_path_to_target_file)
        return

    # copy file content
    with open(abs_path_to_target_file, "w") as target_file:
        content, heading = _get_file_content(abs_path_to_source_file, remove_heading)

        front_matter = None
        if heading:
            front_matter = {"title": heading}

        if transform_file:
            front_matter = {**front_matter, **transform_file.get("frontMatter", {})}

        if front_matter:
            target_file.writelines(_generate_yaml_front_matter(front_matter))

        final_content = _process_content(
            content=content,
            abs_path_to_source_dir=abs_path_to_repo_checkout_dir,
            rel_path_to_source_file=rel_path_to_source_file,
            source=source,
        )
        target_file.write(final_content)

        return abs_path_to_target_file


def _process_content(
    content: str,
    abs_path_to_source_dir: str,
    rel_path_to_source_file: str,
    source: str,
):
    repo_owner, repo_name = _get_canonical_repo_from_url(source)

    def repl_images(m: Match[str]):
        url = m.group("url")
        alt = m.group("alt")
        style = m.group("style")
        title = None

        if style == MARKDOWN_IMAGE_REFERENCE_STYLE_OPENING:
            image_reference_regex = '\[{}\]: *(?P<url>.*) "(?P<title>.*)"'.format(url)
            ref_match = re.search(image_reference_regex, m.string)
            url = ref_match.group("url")
            title = ref_match.group("title")

        new_url = _copy_asset(
            url_path=url,
            abs_path_to_source_dir=abs_path_to_source_dir,
            rel_path_to_source_file=rel_path_to_source_file,
            repo_owner=repo_owner,
            repo_name=repo_name,
        )
        figure = '{{{{< figure src="{}" alt="{}" title="{}" width="100" >}}}}'.format(
            new_url, alt, title
        )
        return figure

    def repl_links(m: Match[str]):
        alt = m.group("alt")
        rel = m.group("rel")
        url = m.group("url")
        domain = m.group("domain")
        host = m.group("host")

        rel_url = url

        # this is a FQDN
        if domain is not None:
            is_link_to_spire_repo = (
                host == "github.com"
                and _get_canonical_repo_from_url(url) == ("spiffe", "spire")
            )

            # that points to this site
            new_url = url
            if domain == config.get("publicUrl"):
                new_url = url[len(config.get("publicUrl")) :]
            elif is_link_to_spire_repo:
                new_url = url
                github_url = RE_EXTRACT_GITHUB_PATH.search(url)
                if github_url is not None and github_url.group("path") != "":
                    branch = _get_latest_spire_release()
                    new_url = "https://github.com/{}/{}/blob/{}/{}".format(
                        "spiffe", "spire", branch, github_url.group("path")
                    )

        # this is an internal relative url
        else:
            if rel == "./" or rel == "":
                rel_url = os.path.join(os.path.dirname(rel_path_to_source_file), url)

            branch = _get_branch_by_repo_url(source)

            new_url = "https://github.com/{}/{}/blob/{}/{}".format(
                repo_owner, repo_name, branch, rel_url
            )

            # if this file has been already pulled in, we can use the new internal URL
            # instead of pointing to the original github location
            if new_url in internal_links:
                new_url = internal_links[new_url]

        new_link = "[{}]({})".format(alt, new_url)
        return new_link

    parsed_content = RE_EXTRACT_IMAGES.sub(repl_images, content)
    parsed_content = RE_EXTRACT_LINKS.sub(repl_links, parsed_content)

    return parsed_content


def _copy_asset(
    url_path: str,
    abs_path_to_source_dir: str,
    rel_path_to_source_file: str,
    repo_owner: str,
    repo_name: str,
) -> str:

    if url_path.startswith(os.path.sep):
        rel_path_to_asset = url_path[1:]
    else:
        rel_path_to_source_dir = os.path.dirname(rel_path_to_source_file)
        rel_path_to_asset = os.path.join(rel_path_to_source_dir, url_path)

    path_to_source_asset = os.path.join(abs_path_to_source_dir, rel_path_to_asset)
    path_to_target_asset = Path(
        os.path.join("./static/img/checkouts", repo_owner, repo_name, rel_path_to_asset)
    )
    path_to_target_asset.parent.mkdir(parents=True, exist_ok=True)

    shutil.copyfile(path_to_source_asset, path_to_target_asset.absolute())

    rel_target_url_path = os.path.join(
        "/img/checkouts", repo_owner, repo_name, rel_path_to_asset
    )
    return rel_target_url_path


if __name__ == "__main__":
    main()

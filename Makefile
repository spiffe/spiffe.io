# Run podman with CONTAINER_RUNTIME=podman on the commandline
CONTAINER_RUNTIME ?= docker

setup:
	python3 -m pip install -r requirements.txt
	npm --prefix astro ci

serve: export HIDE_RELEASES = true
serve: pull-external-content
	npm --prefix astro run dev

serve-with-releases: pull-external-content
	npm --prefix astro run dev

build: pull-external-content
	npm --prefix astro run build

pull-external-content:
	python3 ./pull_external.py

ci-check-links: build
	echo "Running Astro preview server..." && \
	npm --prefix astro run preview & \
	sleep 5 && \
	echo "Running links checker..." && \
	linkchecker -f linkcheckerrc http://localhost:4175; \
	echo "Stopping Astro preview server..." && \
	pkill -f "[a]stro preview" || true

check-links:
	linkchecker -f linkcheckerrc http://localhost:4175

docker-check-links-build:
	$(CONTAINER_RUNTIME) build -f Dockerfile.linkchecker -t linkchecker .

docker-check-links: docker-check-links-build
	$(CONTAINER_RUNTIME) run --rm -it -u $(shell id -u):$(shell id -g) --net host linkchecker -f linkcheckerrc http://localhost:4175

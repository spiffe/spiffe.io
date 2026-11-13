# Run podman with CONTAINER_RUNTIME=podman on the commandline
CONTAINER_RUNTIME ?= docker

setup:
	python3 -m pip install -r requirements.txt
	npm ci

serve: export HIDE_RELEASES = true
serve: pull-external-content
	npm run dev

serve-with-releases: pull-external-content
	npm run dev

build: pull-external-content
	npm run build

pull-external-content:
	python3 ./pull_external.py

ci-check-links: build
	echo "Running Astro preview server..." && \
	npm run preview & \
	sleep 5 && \
	echo "Running links checker..." && \
	linkchecker -f linkcheckerrc http://localhost:4175; \
	echo "Stopping Astro preview server..." && \
	pkill -f "[a]stro preview" || true

check-links:
	linkchecker -f linkcheckerrc http://localhost:4175

docker-build:
	$(CONTAINER_RUNTIME) build . \
		--rm \
		-t spiffe.io:latest \
		-f Dockerfile.dev

# The anonymous volume keeps the image's node_modules in place of the host's.
docker-serve: docker-build
	$(CONTAINER_RUNTIME) run --init --rm \
		-v $(PWD):/app \
		-v /app/node_modules \
		-p 4175:4175 \
		-e HIDE_RELEASES=true \
		-u $(shell id -u):$(shell id -g) \
		spiffe.io:latest

docker-serve-with-releases: docker-build
	$(CONTAINER_RUNTIME) run --init --rm \
		-v $(PWD):/app \
		-v /app/node_modules \
		-p 4175:4175 \
		-e GITHUB_TOKEN \
		-u $(shell id -u):$(shell id -g) \
		spiffe.io:latest

docker-check-links-build:
	$(CONTAINER_RUNTIME) build -f Dockerfile.linkchecker -t linkchecker .

docker-check-links: docker-check-links-build
	$(CONTAINER_RUNTIME) run --rm -it -u $(shell id -u):$(shell id -g) --net host linkchecker -f linkcheckerrc http://localhost:4175

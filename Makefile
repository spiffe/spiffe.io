HUGO_VERSION ?= 0.68.3

# Run podman with CONTAINER_RUNTIME=podman on the commandline
CONTAINER_RUNTIME ?= docker

setup:
	pipenv install --dev
	npm install

serve:
	HIDE_RELEASES=true bash run.sh \
		--buildDrafts \
		--buildFuture \
		--disableFastRender \
		--ignoreCache \
		--noHTTPCache

serve-with-releases:
	bash run.sh \
		--buildDrafts \
		--buildFuture \
		--disableFastRender

production-build: ci-check-links
	hugo \
		--gc \
		--ignoreCache

preview-build: ci-check-links
	hugo \
		--gc \
		--ignoreCache \
		--baseURL $(DEPLOY_PRIME_URL)

docker-build:
	$(CONTAINER_RUNTIME) build . \
		--rm \
		-t spiffe.io:latest \
		-f Dockerfile.dev

docker-serve: docker-build
	$(CONTAINER_RUNTIME) run --rm -it \
		-v $(PWD):/app \
		-p 1313:1313 \
		-e HIDE_RELEASES=true \
		spiffe.io:latest

docker-serve-with-releases: docker-build
	$(CONTAINER_RUNTIME) run --rm -it \
		-v $(PWD):/app \
		-p 1313:1313 \
		spiffe.io:latest

pull-external-content:
	pipenv run python ./pull_external.py

ci-check-links: pull-external-content
	echo "Running Hugo server..." && \
	hugo server -p 1212 & \
	sleep 2 && \
	echo "Running links checker..." && \
	pipenv run linkchecker -f linkcheckerrc http://localhost:1212; \
	echo "Stopping Hugo server..." && \
	pkill hugo || true

check-links:
	pipenv run linkchecker -f linkcheckerrc http://localhost:1313

docker-check-links-build:
	$(CONTAINER_RUNTIME) build -f Dockerfile.linkchecker -t linkchecker .

docker-check-links: docker-check-links-build
	$(CONTAINER_RUNTIME) run --rm -it -u $(shell id -u):$(shell id -g) --net host linkchecker -f linkcheckerrc http://localhost:1313

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
	@if command -v pipenv >/dev/null 2>&1 && pipenv --venv >/dev/null 2>&1; then \
		pipenv run python ./pull_external.py; \
	else \
		python ./pull_external.py; \
	fi

ci-check-links: pull-external-content
	echo "Running Hugo server..." && \
	hugo server -p 1212 & \
	sleep 2 && \
	echo "Running links checker..." && \
	if command -v pipenv >/dev/null 2>&1 && pipenv --venv >/dev/null 2>&1; then \
		pipenv run linkchecker -f linkcheckerrc http://localhost:1212; \
	else \
		linkchecker -f linkcheckerrc http://localhost:1212; \
	fi; \
	echo "Stopping Hugo server..." && \
	pkill hugo || true

check-links:
	@if command -v pipenv >/dev/null 2>&1 && pipenv --venv >/dev/null 2>&1; then \
		pipenv run linkchecker -f linkcheckerrc http://localhost:1313; \
	else \
		linkchecker -f linkcheckerrc http://localhost:1313; \
	fi

docker-check-links-build:
	$(CONTAINER_RUNTIME) build -f Dockerfile.linkchecker -t linkchecker .

docker-check-links: docker-check-links-build
	$(CONTAINER_RUNTIME) run --rm -it -u $(shell id -u):$(shell id -g) --net host linkchecker -f linkcheckerrc http://localhost:1313

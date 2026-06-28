HUGO_VERSION ?= 0.163.3

# Run podman with CONTAINER_RUNTIME=podman on the commandline
CONTAINER_RUNTIME ?= docker

setup:
	python3 -m pip install -r requirements.txt
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

production-build: pull-external-content
	hugo \
		--gc \
		--ignoreCache

preview-build: pull-external-content
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
	$(CONTAINER_RUNTIME) run --init --rm \
		-v $(PWD):/app \
		-p 1313:1313 \
		-e HIDE_RELEASES=true \
		spiffe.io:latest

docker-serve-with-releases: docker-build
	$(CONTAINER_RUNTIME) run --init --rm \
		-v $(PWD):/app \
		-p 1313:1313 \
		spiffe.io:latest

pull-external-content:
	python3 ./pull_external.py

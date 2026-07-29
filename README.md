# agentic-devops-lab

A portable Express application for validating an agentic development and CI/CD
workflow.

## Requirements

- Node.js 24
- npm

## Install

Install the dependencies from the repository root:

```sh
npm install
```

## Start

Start the application:

```sh
npm start
```

The server listens on port `3000` by default. Set `PORT` to use a different
port:

```sh
PORT=8080 npm start
```

On startup, the application creates `data/app.sqlite` and initializes its
`app_metadata` table.

## Test

Run the automated test suite:

```sh
npm test
```

## Docker

Build the application image:

```sh
docker compose build
```

Start the application in the background:

```sh
docker compose up -d
```

The application is available at `http://localhost:3000`. Set `APP_PORT` to
publish it on a different host port:

```sh
APP_PORT=8080 docker compose up -d
```

Check the container status:

```sh
docker compose ps
```

Verify the application health endpoint:

```sh
curl -fsS http://localhost:3000/health
```

View the application logs:

```sh
docker compose logs
```

Stop and remove the application containers:

```sh
docker compose down
```

Compose stores the SQLite database in the named `app-data` volume. Running
`docker compose down` removes the containers but preserves this volume and its
database. Running `docker compose down -v` also deletes the volume and the
database; do not use it without a backup.

To run the image without Compose:

```sh
docker build -t agentic-devops-lab .
docker run --rm -p 3000:3000 -v agentic-devops-data:/app/data \
  agentic-devops-lab
```

The container runs as an unprivileged user and reports its status through the
`GET /health` endpoint.

## CI

CI runs for pull requests targeting `main`, pushes to `main`, and manual
workflow dispatches. The `Test` check installs dependencies with `npm ci`, runs
the complete test suite with `npm test`, validates the Docker Compose
configuration, and builds the production Docker image.

Successful CI will later become mandatory for merging into `main`.

## GitHub Container Registry

After `CI / Test` succeeds for a push to `main`, CI publishes the application
image to:

```text
ghcr.io/ab-soul-goodman/agentic-devops-lab
```

The registry uses two tag roles:

- The full Git commit SHA is immutable by project policy and must never be
  overwritten.
- `main` is a movable convenience tag that follows the latest successfully
  verified artifact for the current HEAD of the `main` branch.

The workflow does not publish `latest` or publish images for pull requests.
Before building, it checks whether the full SHA tag already exists. A repeated
workflow run does not rebuild or overwrite an existing SHA tag; it resolves the
existing digest and performs the complete verification against that exact
artifact.

Duplicate publication runs for the same commit are serialized by the
SHA-specific `ghcr-immutable-<sha>` concurrency group. Only the first run can
publish a missing SHA artifact; every later run waits, reuses the existing
digest, and performs the complete `image@digest` verification. Different commit
SHAs use different groups and can publish concurrently.

Immutable publication and digest verification run independently for every
commit pushed to `main`. Moving-tag promotion is a separate, serialized job:
only one promotion can update GHCR at a time, and subsequent promotion jobs
wait in the shared queue.

After acquiring the promotion lock, the job updates `main` only when digest
verification succeeded and its Git commit is still the current HEAD of
`refs/heads/main`. A stale job exits successfully without changing the moving
tag. An older workflow still publishes and verifies its immutable SHA artifact,
but cannot race a newer promotion.

Both queues use the supported GitHub Actions `concurrency.queue: max` setting so
pending jobs are retained. Actionlint 1.7.12 uses an older concurrency schema
and can report `queue` as an unexpected key; that diagnostic is a known false
positive when no other actionlint errors are present.

Because `main` moves, it must not be used for controlled promotion between
environments. The `image@digest` reference is the only supported reference for
controlled promotion, and TEST, UAT, and PROD must all use the same exact
digest.

Pull an image by its full 40-character commit SHA:

```sh
IMAGE=ghcr.io/ab-soul-goodman/agentic-devops-lab
GIT_SHA=<full-40-character-git-sha>
docker pull "${IMAGE}:${GIT_SHA}"
```

After pulling the SHA tag, obtain its digest:

```sh
IMAGE_REFERENCE="$(docker image inspect \
  --format '{{ index .RepoDigests 0 }}' \
  "${IMAGE}:${GIT_SHA}")"
echo "${IMAGE_REFERENCE}"
```

`IMAGE_REFERENCE` has the form
`ghcr.io/ab-soul-goodman/agentic-devops-lab@sha256:...`. Pull and run that exact
artifact with persistent application data mounted at `/app/data`:

```sh
docker pull "${IMAGE_REFERENCE}"
docker volume create agentic-devops-data
docker run --rm -p 3000:3000 \
  -v agentic-devops-data:/app/data \
  "${IMAGE_REFERENCE}"
```

The publication workflow does not change the GHCR package visibility. Configure
visibility separately when required. Do not put registry tokens in this
repository; authenticate to GHCR through an appropriate secure credential
mechanism.

Deployment to a VM is outside DEV-004 and is handled separately in DEV-005.

## Endpoints

- `GET /` renders an HTML page containing `Hello World`.
- `GET /health` returns HTTP 200 with `{"status":"ok"}`.

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

## Endpoints

- `GET /` renders an HTML page containing `Hello World`.
- `GET /health` returns HTTP 200 with `{"status":"ok"}`.

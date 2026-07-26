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

## Endpoints

- `GET /` renders an HTML page containing `Hello World`.
- `GET /health` returns HTTP 200 with `{"status":"ok"}`.

const { after, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { IncomingMessage, ServerResponse } = require('node:http');
const { Duplex } = require('node:stream');
const { createApp } = require('../src/app');

function request(app, url) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const socket = new Duplex({
      read() {},
      write(chunk, encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      }
    });
    const incomingMessage = new IncomingMessage(socket);
    incomingMessage.method = 'GET';
    incomingMessage.url = url;
    incomingMessage.headers = { host: 'localhost' };

    const serverResponse = new ServerResponse(incomingMessage);
    serverResponse.assignSocket(socket);
    serverResponse.on('error', reject);
    serverResponse.on('finish', () => {
      const rawResponse = Buffer.concat(chunks).toString();
      const bodyStart = rawResponse.indexOf('\r\n\r\n') + 4;

      resolve({
        status: serverResponse.statusCode,
        headers: serverResponse.getHeaders(),
        text: rawResponse.slice(bodyStart)
      });
    });

    app(incomingMessage, serverResponse);
  });
}

function isValidHelloWorldHtml(html) {
  const openingBodyTags = [...html.matchAll(/<body\b[^>]*>/gi)];
  const closingBodyTags = [...html.matchAll(/<\/body\s*>/gi)];

  if (openingBodyTags.length !== 1 || closingBodyTags.length !== 1) {
    return false;
  }

  const openingBody = openingBodyTags[0];
  const closingBody = closingBodyTags[0];
  const bodyContentStart = openingBody.index + openingBody[0].length;
  const bodyContentEnd = closingBody.index;

  if (openingBody.index >= bodyContentEnd) {
    return false;
  }

  const contentBeforeBody = html.slice(0, openingBody.index);
  if (!/<title\b[^>]*>[\s\S]*?<\/title\s*>/i.test(contentBeforeBody)) {
    return false;
  }

  const bodyContent = html.slice(bodyContentStart, bodyContentEnd);
  return /<h1\b[^>]*>\s*Hello World\s*<\/h1\s*>/i.test(bodyContent);
}

const validHelloWorldHtml = `<!doctype html>
<html>
  <head><title>Hello World</title></head>
  <body><h1>Hello World</h1></body>
</html>`;

describe('application routes', () => {
  const app = createApp({ databasePath: ':memory:' });

  after(() => {
    app.locals.database.close();
  });

  it('renders Hello World on the root route', async () => {
    const response = await request(app, '/');

    assert.equal(response.status, 200);
    assert.match(response.headers['content-type'], /^text\/html/);
    assert.equal(isValidHelloWorldHtml(response.text), true);
  });

  it('reports a healthy status', async () => {
    const response = await request(app, '/health');

    assert.equal(response.status, 200);
    assert.deepEqual(JSON.parse(response.text), { status: 'ok' });
  });
});

describe('Hello World HTML validation', () => {
  it('rejects an H1 after the body has closed', () => {
    const mutatedHtml = validHelloWorldHtml
      .replace('<h1>Hello World</h1>', '')
      .replace('</body>', '</body><h1>Hello World</h1>');

    assert.equal(isValidHelloWorldHtml(mutatedHtml), false);
  });

  it('rejects duplicate body elements', () => {
    const mutatedHtml = validHelloWorldHtml.replace(
      '</body>',
      '</body><body><h1>Hello World</h1></body>'
    );

    assert.equal(isValidHelloWorldHtml(mutatedHtml), false);
  });

  it('rejects an unclosed or malformed title', () => {
    const mutations = [
      validHelloWorldHtml.replace('</title>', ''),
      validHelloWorldHtml.replace('</title>', '</titlex>')
    ];

    for (const mutatedHtml of mutations) {
      assert.equal(isValidHelloWorldHtml(mutatedHtml), false);
    }
  });
});

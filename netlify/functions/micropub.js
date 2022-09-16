const https = require('https');

exports.handler = async function(event) {
  const authHeader = event.headers['authorization'];
  if (!authHeader)
    return UNAUTHORIZED;

  const authToken = trimPrefix(authHeader, "Bearer ");
  if (!authToken)
    return UNAUTHORIZED;

  const authorizationScope = await validateToken(authToken);
  if (!authorizationScope)
    return UNAUTHORIZED;

  switch (event.httpMethod) {
    case 'GET':
      switch (event.queryStringParameters['q']) {
        case 'config':
          return SUCCESS(CONFIG);
        case 'source':
          return NOT_IMPLEMENTED;
      }
      return INVALID_REQUEST;
    case 'POST':
      const request_body = (() => {
        switch (event.headers['content-type'].split(';')[0].trim()) {
          case 'application/json':
            return json_parse_or_null(event.body);
          case 'application/x-www-form-urlencoded':
            return Object.fromEntries((new URLSearchParams(event.body)).entries());
        }
        return null;
      })();

      if (!request_body)
        return INVALID_REQUEST;

      const action = request_body['action'] || 'create';
      // if (!authTokenScope(auth_token).includes(action))
      //   return INSUFFICIENT_SCOPE;
      const normalized_body = normalize_body(event.headers['content-type'], request_body);
      switch (action) {
        case 'create':
          return handleCreate(normalized_body);
        case 'update':
          return handleUpdate(normalized_body);
        case 'delete':
          return handleDelete(normalized_body);
        case 'undelete':
          return handleUndelete(normalized_body);
      }
      return INVALID_REQUEST;
  }

  return INVALID_REQUEST;
};

/// Validate the token and return its authorization scope. Returns an empty
/// array if not authorized
async function validateToken(token) {
  try {
    const response = await get({
      hostname: 'tokens.indieauth.com',
      path: '/token',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    })
    return response.scope || [];
  } catch (err) {
    return [];
  }
}

function normalize_body(contentType, body) {
  if (contentType == 'application/json')
    return body;

  let normalizedBody = { 'type': ['h-entry'], 'properties': {} };
  for (let [key, value] of Object.entries(body)) {
    key = key.trim();
    if (key == 'h') {
      normalizedBody.type = [value]
    } else if (key.endsWith("[]")) {
      normalizedBody.properties[key] = value.split(",");
    } else {
      normalizedBody.properties[key] = value;
    }
  }
  return normalizedBody;
}

const response = (statusCode, body, headers) => ({ statusCode, headers, body: JSON.stringify(body) })
const success = (body, headers) => response(200, body, headers);
const error = (statusCode, error, error_description) => response(statusCode, { error, error_description });

const UNAUTHORIZED = error(401, "unauthorized");
const FORBIDDEN = error(403, "forbidden");
const INSUFFICIENT_SCOPE = error(403, "insufficient_scope");
const INVALID_REQUEST = error(400, "invalid_request");
const FAILED_JSON_PARSING = error(400, "invalid_request", "Could not parse JSON body");
const NOT_IMPLEMENTED = error(501, "not_implemented");

// ********************** BACKEND ****************************************************************************
// Functions to perform the actual changes to the website

function handleCreate(body) {
  console.log(`CREATE ${JSON.stringify(body)}`);
  return NOT_IMPLEMENTED;
}

function handleUpdate(body) {
  console.log(`CREATE ${JSON.stringify(body)}`);
  return NOT_IMPLEMENTED;
}

function handleDelete(body) {
  console.log(`CREATE ${JSON.stringify(body)}`);
  return NOT_IMPLEMENTED;
}

function handleUndelete(body) {
  console.log(`CREATE ${JSON.stringify(body)}`);
  return NOT_IMPLEMENTED;
}

// *********************** HELPERS ****************************************************************************

/// Perform an HTTP GET request. `options` as in https.request
async function request(options, body) {
  return new Promise((resolve, reject) => {
    const request = https.request({
      port: 443,
      ...options,
    }, res => {
      res.on('data', resolve)
    });
    request.on('error', reject)
    if (body)
      request.write(body);
    request.end();
  })
}

async function get(options) {
  return request({ ...options, method: 'GET' }, null)
}

function trimPrefix(str, prefix) {
  if (str.startsWith(prefix))
    return str.slice(prefix.length);
  else
    return null;
}

function json_parse_or_null(text) {
  try {
    return JSON.parse(text);
  } catch (SyntaxError) {
    return null;
  }
}

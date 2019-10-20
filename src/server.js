var http = require('http'),
    httpProxy = require('http-proxy'),
    process = require('process'),
    jwt = require('jsonwebtoken'),
    Ajv = require('ajv');
var ajv = new Ajv();

var JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY.replace(/\\n/g, "\n");
var JWT_ALGORITHM = process.env.JWT_ALGORITHM || 'RS256';
var JWT_REQUIREMENTS = {
    algorithms: JWT_ALGORITHM
};

if (process.env.JWT_AUDIENCE) {
    JWT_REQUIREMENTS.audience = process.env.JWT_AUDIENCE;
}
if (process.env.JWT_ISSUER) {
    JWT_REQUIREMENTS.issuer = process.env.JWT_ISSUER;
}

var JWT_VALIDATE_SCHEMA = null;
if (process.env.JWT_VALIDATE_JSON_SCHEMA) {
    JWT_VALIDATE_SCHEMA = JSON.parse(process.env.JWT_VALIDATE_JSON_SCHEMA);
}

var ALLOW_ANONYMOUS = process.env.ALLOW_ANONYMOUS === "1";
var LISTEN_PORT = process.env.LISTEN_PORT;

var proxy = httpProxy.createProxyServer({});

var server = http.createServer(function(req, res) {

    var decoded = null;

    if (typeof req.headers.authorization === 'string') {
        if (req.headers.authorization.length > 7 && req.headers.authorization.substring(0, 7) === 'Bearer ') {
            var token = req.headers.authorization.substring(7);
            console.log(token);

            try {
                decoded = jwt.verify(
                    token,
                    JWT_PUBLIC_KEY,
                    JWT_REQUIREMENTS
                );
                console.log(decoded);
            } catch (err) {
                res.writeHead(403, { 'Content-Type': 'text/plain' });
                res.end(err.message);
                return;
            }
        }
    }

    if (!decoded && !ALLOW_ANONYMOUS) {
        console.log("Token not verified against requirements or public key");
        res.writeHead(401, { 'Content-Type': 'text/plain' });
        res.end('Unauthorized');
        return;
    }

    if (JWT_VALIDATE_SCHEMA) {
        if (!ajv.compile(JWT_VALIDATE_SCHEMA)(decoded)) {
            console.log("Token failed json schema validation");
            res.writeHead(401, { 'Content-Type': 'text/plain' });
            res.end('Unauthorized');
            return;
        }
    }


    proxy.web(req, res, {
    target: process.env.UPSTREAM_URL
  });
});


console.log("listening on port " + LISTEN_PORT)
console.debug("Debug info:", {
    jwt_requirements: JWT_REQUIREMENTS,
    jwt_algorithm: JWT_ALGORITHM,
    jwt_public_key: JWT_PUBLIC_KEY,
    jwt_validate_schema: JWT_VALIDATE_SCHEMA
});
server.listen(LISTEN_PORT);
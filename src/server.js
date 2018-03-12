var http = require('http'),
    httpProxy = require('http-proxy'),
    process = require('process'),
    jwt = require('jsonwebtoken');

var JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY.replace(/\\n/g, "\n");
var JWT_REQUIREMENTS = {
    algorithms: 'RS256',
    audience: process.env.JWT_AUDIENCE,
    issuer: process.env.JWT_ISSUER
};
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
        res.writeHead(401, { 'Content-Type': 'text/plain' });
        res.end('Unauthorized');
        return;
    }

  proxy.web(req, res, {
    target: process.env.UPSTREAM_URL
  });
});


console.log("listening on port " + LISTEN_PORT)
server.listen(LISTEN_PORT);
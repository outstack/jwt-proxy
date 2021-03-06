# JWT Proxy

A simple NodeJS docker image which proxies to an upstream server after first verifying a JSON Web Token against a
configured public key.

It's written in NodeJS, using [node-http-proxy](https://github.com/nodejitsu/node-http-proxy) and
[node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken). It's packaged as a docker image and run as follows:

    docker run \
        --init \
        -e UPSTREAM_URL=http://your-private-unauthenticated-api.example.com \
        -e LISTEN_PORT=8989 \
        -p 8989:8989 \
        -e JWT_PUBLIC_KEY="-----BEGIN CERTIFICATE-----\nMIID ... 8RujynGaw==\n-----END CERTIFICATE-----" \
        -e JWT_ISSUER="https://jwt-server.example.com/" \
        -e JWT_AUDIENCE="https://your-api.example.com" \
        -e ALLOW_ANONYMOUS=1 \
        outstack/jwt-proxy

## Custom token requirements

You can impose other requirements on tokens, such as requiring a certain scope, by passing in a json schema. For
example, to require a certain scope be present in a `scopes` claim:

    -e JWT_VALIDATE_JSON_SCHEMA='{"type": "object", "required": ["scopes"], "properties": { "scopes": { "type": "array", "contains": {"const": "the_required_scope" }}}}'

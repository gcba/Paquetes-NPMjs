# DID Resolver
This package exposes the functionality to resolve DIDs using Modena Resolvers.

```
import { DIDModenaResolver } from "@extrimian/did-resolver"

const resolver = new DIDModenaResolver({ modenaURL: getModenaApiURL() });
const didDocument = await resolver.resolveDID(did);
```

Resolve a DID using Modena Resolver requires a Modena API URL, which represents a modena node running as a service.

You can provide your own Modena node or use a public node.
# __PROJECT_NAME_MARKDOWN__

This is a zoneless Angular iMIS client iPart project.

Run `npm install` and `npm test`. Then use the `package` entry in `package.json`. Give `__PACKAGE_NAME__` to `imis_client_ipart_package` with `action=validate` and `action=deploy`.

The loader creates one Angular component for each iPart instance. Do not add Zone.js, server rendering, prerendering, a service worker, Shadow DOM, or `ViewEncapsulation.None`.

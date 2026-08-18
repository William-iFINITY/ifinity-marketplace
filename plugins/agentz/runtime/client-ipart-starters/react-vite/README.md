# __PROJECT_NAME_MARKDOWN__

This is a React and Vite iMIS client iPart project.

Run `npm install` and `npm test`. Then use the `package` entry in `package.json`. Give `__PACKAGE_NAME__` to `imis_client_ipart_package` with `action=validate` and `action=deploy`.

The loader creates one React root for each iPart instance. It also starts instances that iMIS adds later and unmounts instances that iMIS removes.

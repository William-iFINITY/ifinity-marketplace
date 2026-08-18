# __PROJECT_NAME_MARKDOWN__

This is a plain JavaScript iMIS client iPart project.

Run `npm install` and `npm test`. Then use the `package` entry in `package.json`. Give `__PACKAGE_NAME__` to `imis_client_ipart_package` with `action=validate` and `action=deploy`.

The local preview uses `.agentz/design-preview.css`. The production ZIP does not contain that file. AgentZ adds `design-tokens.css` during package validation and deployment.

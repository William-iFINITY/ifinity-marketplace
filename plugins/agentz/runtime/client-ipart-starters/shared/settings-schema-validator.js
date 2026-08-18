export function assertSettingsMatchSchema(value, schema, label = "Settings") {
  const errors = [];
  validate(value, schema ?? {}, "$", errors);
  if (errors.length > 0) throw new Error(`${label} do not match the declared schema: ${errors.join("; ")}`);
  return value;
}

export function assertSupportedSettingsSchema(schema, label = "Settings schema") {
  const errors = [];
  validateSchema(schema, "$", errors);
  if (errors.length > 0) throw new Error(`${label} is not supported: ${errors.join("; ")}`);
  return schema;
}

function validateSchema(schema, path, errors) {
  if (schema === true || schema === false) return;
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    errors.push(`${path} must be a schema object or boolean`);
    return;
  }
  const supported = new Set([
    "type", "properties", "required", "enum", "const", "allOf", "anyOf", "oneOf", "not",
    "minLength", "maxLength", "pattern", "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum",
    "minItems", "maxItems", "items", "title", "description", "default",
  ]);
  for (const keyword of Object.keys(schema)) if (!supported.has(keyword)) errors.push(`${path}.${keyword} is not a supported keyword`);
  const types = Array.isArray(schema.type) ? schema.type : schema.type == null ? [] : [schema.type];
  const supportedTypes = new Set(["null", "array", "object", "integer", "number", "string", "boolean"]);
  if (types.some((type) => typeof type !== "string" || !supportedTypes.has(type))) errors.push(`${path}.type contains an unsupported value`);
  if (schema.properties != null) {
    if (!schema.properties || typeof schema.properties !== "object" || Array.isArray(schema.properties)) errors.push(`${path}.properties must be an object`);
    else for (const [key, child] of Object.entries(schema.properties)) validateSchema(child, `${path}.properties.${key}`, errors);
  }
  if (schema.required != null && (!Array.isArray(schema.required) || schema.required.some((key) => typeof key !== "string"))) errors.push(`${path}.required must be an array of strings`);
  if (schema.enum != null && !Array.isArray(schema.enum)) errors.push(`${path}.enum must be an array`);
  for (const keyword of ["allOf", "anyOf", "oneOf"]) {
    if (schema[keyword] == null) continue;
    if (!Array.isArray(schema[keyword])) errors.push(`${path}.${keyword} must be an array`);
    else schema[keyword].forEach((child, index) => validateSchema(child, `${path}.${keyword}[${index}]`, errors));
  }
  if (schema.not != null) validateSchema(schema.not, `${path}.not`, errors);
  if (schema.items != null) validateSchema(schema.items, `${path}.items`, errors);
  for (const keyword of ["minLength", "maxLength", "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "minItems", "maxItems"]) {
    if (schema[keyword] != null && typeof schema[keyword] !== "number") errors.push(`${path}.${keyword} must be a number`);
  }
  if (schema.pattern != null) {
    if (typeof schema.pattern !== "string") errors.push(`${path}.pattern must be a string`);
    else try { new RegExp(schema.pattern, "u"); } catch { errors.push(`${path}.pattern must be a valid regular expression`); }
  }
}

function validate(value, schema, path, errors) {
  if (schema === true || schema == null) return;
  if (schema === false) {
    errors.push(`${path} is not permitted`);
    return;
  }
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    errors.push(`${path} has an invalid schema`);
    return;
  }
  if (Object.hasOwn(schema, "const") && !sameJson(value, schema.const)) errors.push(`${path} must equal the declared constant`);
  if (Array.isArray(schema.enum) && !schema.enum.some((candidate) => sameJson(value, candidate))) errors.push(`${path} must be one of the declared values`);
  if (Array.isArray(schema.allOf)) for (const child of schema.allOf) validate(value, child, path, errors);
  if (Array.isArray(schema.anyOf) && !schema.anyOf.some((child) => isValid(value, child))) errors.push(`${path} must match at least one allowed shape`);
  if (Array.isArray(schema.oneOf) && schema.oneOf.filter((child) => isValid(value, child)).length !== 1) errors.push(`${path} must match exactly one allowed shape`);
  if (schema.not && isValid(value, schema.not)) errors.push(`${path} matches a forbidden shape`);

  const allowedTypes = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  if (allowedTypes.length > 0 && !allowedTypes.some((type) => valueHasType(value, type))) {
    errors.push(`${path} must be ${allowedTypes.join(" or ")}`);
    return;
  }

  if (typeof value === "string") {
    if (typeof schema.minLength === "number" && value.length < schema.minLength) errors.push(`${path} is too short`);
    if (typeof schema.maxLength === "number" && value.length > schema.maxLength) errors.push(`${path} is too long`);
    if (typeof schema.pattern === "string") {
      try {
        if (!new RegExp(schema.pattern, "u").test(value)) errors.push(`${path} does not match the required pattern`);
      } catch {
        errors.push(`${path} has an invalid schema pattern`);
      }
    }
  }
  if (typeof value === "number") {
    if (typeof schema.minimum === "number" && value < schema.minimum) errors.push(`${path} is below the minimum`);
    if (typeof schema.maximum === "number" && value > schema.maximum) errors.push(`${path} is above the maximum`);
    if (typeof schema.exclusiveMinimum === "number" && value <= schema.exclusiveMinimum) errors.push(`${path} must be above the exclusive minimum`);
    if (typeof schema.exclusiveMaximum === "number" && value >= schema.exclusiveMaximum) errors.push(`${path} must be below the exclusive maximum`);
  }
  if (Array.isArray(value)) {
    if (typeof schema.minItems === "number" && value.length < schema.minItems) errors.push(`${path} has too few items`);
    if (typeof schema.maxItems === "number" && value.length > schema.maxItems) errors.push(`${path} has too many items`);
    if (schema.items) value.forEach((item, index) => validate(item, schema.items, `${path}[${index}]`, errors));
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    if (Array.isArray(schema.required)) {
      for (const key of schema.required) if (typeof key === "string" && !Object.hasOwn(value, key)) errors.push(`${path}.${key} is required`);
    }
    if (schema.properties && typeof schema.properties === "object" && !Array.isArray(schema.properties)) {
      for (const [key, child] of Object.entries(schema.properties)) if (Object.hasOwn(value, key)) validate(value[key], child, `${path}.${key}`, errors);
    }
  }
}

function isValid(value, schema) {
  const errors = [];
  validate(value, schema, "$", errors);
  return errors.length === 0;
}

function valueHasType(value, type) {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "object") return !!value && typeof value === "object" && !Array.isArray(value);
  if (type === "integer") return Number.isInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === type;
}

function sameJson(left, right) {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => sameJson(value, right[index]));
  }
  if (left && right && typeof left === "object" && typeof right === "object") {
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();
    return leftKeys.length === rightKeys.length && leftKeys.every((key, index) => key === rightKeys[index] && sameJson(left[key], right[key]));
  }
  return false;
}

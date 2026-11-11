// @ts-check
import generated from './schemas.generated.json';

/** @typedef {{ $ref?: string, type?: string, nullable?: boolean, enum?: unknown[], allOf?: Schema[], oneOf?: Schema[], properties?: Record<string, Schema>, required?: string[], items?: Schema, minimum?: number, maximum?: number, minLength?: number, maxLength?: number, maxItems?: number, pattern?: string, format?: string }} Schema */
/** @type {Record<string, Schema>} */
const schemas = generated;

/** @param {unknown} value @param {Schema} schema @returns {boolean} */
function matches(value, schema) {
  if (value === null && schema.nullable) return true;
  if (schema.$ref) return matches(value, schemas[schema.$ref.split('/').at(-1) || '']);
  if (schema.enum && !schema.enum.includes(value)) return false;
  if (schema.allOf && !schema.allOf.every((item) => matches(value, item))) return false;
  if (schema.oneOf && schema.oneOf.filter((item) => matches(value, item)).length !== 1) return false;
  if (schema.type === 'array') {
    return (
      Array.isArray(value) &&
      (schema.maxItems === undefined || value.length <= schema.maxItems) &&
      value.every((item) => matches(item, schema.items || {}))
    );
  }
  if (schema.type === 'object' || schema.properties) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const object = /** @type {Record<string, unknown>} */ (value);
    return (
      (schema.required || []).every((key) => Object.hasOwn(object, key)) &&
      Object.entries(schema.properties || {}).every(
        ([key, item]) => !Object.hasOwn(object, key) || matches(object[key], item),
      )
    );
  }
  if (schema.type === 'integer' || schema.type === 'number') {
    return (
      typeof value === 'number' &&
      Number.isFinite(value) &&
      (schema.type !== 'integer' || Number.isSafeInteger(value)) &&
      (schema.minimum === undefined || value >= schema.minimum) &&
      (schema.maximum === undefined || value <= schema.maximum)
    );
  }
  if (schema.type === 'string') {
    return (
      typeof value === 'string' &&
      (schema.minLength === undefined || Array.from(value).length >= schema.minLength) &&
      (schema.maxLength === undefined || Array.from(value).length <= schema.maxLength) &&
      (!schema.pattern || new RegExp(schema.pattern).test(value)) &&
      (schema.format !== 'date-time' || !Number.isNaN(Date.parse(value)))
    );
  }
  if (schema.type === 'boolean') return typeof value === 'boolean';
  return !schema.type;
}

/** @param {unknown} value @param {keyof typeof generated} model @returns {boolean} */
export function matchesContract(value, model) {
  return matches(value, schemas[model]);
}

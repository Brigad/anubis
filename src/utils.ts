const flattenObject = (obj, rootPath) => {
  const flattened = {};

  Object.keys(obj).forEach((key) => {
    const value = obj[key];

    const k = rootPath ? `${rootPath}.${key}` : key;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, k));
    } else {
      flattened[k] = value;
    }
  });

  return flattened;
};

export const getObjectDiff = (newContent, originalContent) => {
  const changes: Record<string, string[]> = {
    added: [],
    removed: [],
    changed: [],
  };

  const originalJSON = flattenObject(originalContent, "");
  const newJSON = flattenObject(newContent, "");

  for (const key of Object.keys(originalJSON)) {
    if (!newJSON[key]) {
      changes.removed.push(key);
    } else if (newJSON[key] !== originalJSON[key]) {
      changes.changed.push(key);
    }
  }

  for (const key of Object.keys(newJSON)) {
    if (!originalJSON[key]) {
      changes.added.push(key);
    }
  }

  return changes;
};

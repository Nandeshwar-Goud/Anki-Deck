const state = {
  'f1': { index: 1, lastAccessed: 1 },
  'f2': { index: 2, lastAccessed: 2 },
  'f3': { index: 3, lastAccessed: 3 },
  'f4': { index: 4, lastAccessed: 4 },
  'f5': { index: 5, lastAccessed: 5 },
  'f6': { index: 6, lastAccessed: 6 }
};
const MAX_SAVED_FILES = 5;
const keys = Object.keys(state);
if (keys.length > MAX_SAVED_FILES) {
    const sortedKeys = keys.sort((a, b) => state[b].lastAccessed - state[a].lastAccessed);
    console.log("sortedKeys:", sortedKeys);
    const keysToRemove = sortedKeys.slice(MAX_SAVED_FILES);
    console.log("keysToRemove:", keysToRemove);
    keysToRemove.forEach(key => delete state[key]);
}
console.log(state);

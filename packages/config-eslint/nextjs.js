import base from './base.js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...base,
  {
    // next lint's flat-config support is evolving; for v1 we lean on base + tseslint.
    // The `next` plugin can be added here once their flat-config recipe stabilizes.
    rules: {
      'react/jsx-key': 'error',
    },
  },
];

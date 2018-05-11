@module {Object} can-diff
@parent can-js-utilities
@collection can-infrastructure

Utilities for comparing and applying differences between data structures.

@type {Object}

  `can-diff` exports an object that contains all of its module functions:

  ```js
  import {diff} from "can-diff";

  // difference between two lists
  diff.list([ ... ], [ ... ])
  // difference between two objects
  diff.map()

  // emits patches from changes in a source observable
  new diff.Patcher()

  // diffs an object or array "deeply"
  diff.deep()

  // updates `dest` with source using
  // identity awareness
  diff.mergeDeep(dest, source)
  ```

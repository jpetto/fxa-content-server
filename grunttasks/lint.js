/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// meta grunt task to run other linters.

module.exports = function (grunt) {
  'use strict';

  grunt.registerTask('lint', 'lint all the things', [
    'concurrent:lint'
  ]);
};

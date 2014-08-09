/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern',
  'intern!object',
  'intern/chai!assert',
  'require',
  'intern/node_modules/dojo/node!xmlhttprequest',
  'app/bower_components/fxa-js-client/fxa-client',
  'app/scripts/lib/constants',
  'tests/lib/helpers',
  'tests/functional/lib/helpers'
], function (intern, registerSuite, assert, require, nodeXMLHttpRequest, FxaClient, Constants, TestHelpers, FunctionalHelpers) {
  'use strict';

  var config = intern.config;
  var AUTH_SERVER_ROOT = config.fxaAuthRoot;
  var SIGNIN_URL = config.fxaContentRoot + 'signin';
  var AVATAR_URL = config.fxaContentRoot + 'settings/avatar';
  var AVATAR_CHANGE_URL = config.fxaContentRoot + 'settings/avatar/change';
  var AVATAR_CHANGE_URL_AUTOMATED = config.fxaContentRoot + 'settings/avatar/change?automatedBrowser=true';

  var PASSWORD = 'password';
  var email;
  var client;


  registerSuite({
    name: 'settings/avatar',

    beforeEach: function () {
      email = TestHelpers.createEmail();

      client = new FxaClient(AUTH_SERVER_ROOT, {
        xhr: nodeXMLHttpRequest.XMLHttpRequest
      });

      var self = this;
      return client.signUp(email, PASSWORD, { preVerified: true })
        .then(function () {
           return FunctionalHelpers.clearBrowserState(self);
         })
        .then(function () {
          return self.get('remote')
            .get(require.toUrl(SIGNIN_URL))
            .setFindTimeout(intern.config.pageLoadTimeout)
            .findByCssSelector('form input.email')
              .click()
              .type(email)
            .end()

            .findByCssSelector('form input.password')
              .click()
              .type(PASSWORD)
            .end()

            .findByCssSelector('button[type="submit"]')
              .click()
            .end();
        });
    },

    teardown: function () {
      return FunctionalHelpers.clearBrowserState(this);
    },

    'go to avatars then avatar change': function () {
      return this.get('remote')
        .get(require.toUrl(AVATAR_URL))
        .setFindTimeout(intern.config.pageLoadTimeout)

        // go to change avatar
        .findById('change-avatar')
          .click()
        .end()

        // success is going to the change avatar page
        .findById('avatar-options')
        .end();
    },

    'visit gravatar with gravatar': function () {
      return this.get('remote')
        .get(require.toUrl(AVATAR_CHANGE_URL_AUTOMATED))
        .setFindTimeout(intern.config.pageLoadTimeout)

        // go to change avatar
        .findById('gravatar')
          .click()
        .end()

        .findById('submit-btn')
          .click()
        .end()

        // redirected back to main avatar page after save
        .findById('change-avatar')
        .end()

        // success is seeing the success text
        .findByCssSelector('.success')
          .text()
          .then(function (val) {
            assert.ok(val, 'has success text');
          })
        .end();
    },

    'visit gravatar with gravatar then cancel': function () {
      return this.get('remote')
        .get(require.toUrl(AVATAR_CHANGE_URL_AUTOMATED))
        .setFindTimeout(intern.config.pageLoadTimeout)

        // go to change avatar
        .findById('gravatar')
          .click()
        .end()

        .findByCssSelector('a.cancel')
          .click()
        .end()

        // redirected back to main avatar page after save
        .findById('avatar-options')
        .end()

        .findByCssSelector('.error')
          .text()
          .then(function (val) {
            assert.ok(! val, 'has no error text');
          })
        .end()

        // success is seeing the default avatar image
        .findByCssSelector('.default')
        .end();
    },

    'visit gravatar with no gravatar': function () {
      return this.get('remote')
        .get(require.toUrl(AVATAR_CHANGE_URL))
        .setFindTimeout(intern.config.pageLoadTimeout)

        // go to change avatar
        .findById('gravatar')
          .click()
        .end()

        // redirected back to main avatar page after error
        .findById('change-avatar')
        .end()

        // success is seeing the error text
        .findByCssSelector('.error')
          .text()
          .then(function (val) {
            assert.ok(val, 'has error text');
          })
        .end();
    },

    'attempt to use webcam for avatar': function () {
      return this.get('remote')
        .get(require.toUrl(AVATAR_CHANGE_URL_AUTOMATED))
        .setFindTimeout(intern.config.pageLoadTimeout)

        // go to change avatar
        .findById('camera')
          .click()
        .end()

        .findById('submit-btn')
          .click()
        .end()

        // success is returning to the avatar page with the change link
        .findById('change-avatar')
        .end();
    },

    'attempt to use webcam for avatar, then cancel': function () {
      return this.get('remote')
        .get(require.toUrl(AVATAR_CHANGE_URL_AUTOMATED))
        .setFindTimeout(intern.config.pageLoadTimeout)

        // go to change avatar
        .findById('camera')
          .click()
        .end()

        .findByCssSelector('a.cancel')
          .click()
        .end()

        // success is returning to the avatar change page
        .findById('avatar-options')
        .end();
    },

    'upload a profile image': function () {
      return this.get('remote')
        .get(require.toUrl(AVATAR_CHANGE_URL_AUTOMATED))
        .setFindTimeout(intern.config.pageLoadTimeout)

        // go to change avatar
        .findById('imageLoader')
        .end()

        .findById('file')
          .click()
        .end()

        .findByCssSelector('.cropper')
        .end()

        .findByCssSelector('.zoom-out')
          .click()
        .end()

        .findByCssSelector('.zoom-in')
          .click()
        .end()

        .findByCssSelector('.rotate')
          .click()
        .end()

        .findById('submit-btn')
          .click()
        .end()

        //success is returning to the avatar page with the change link
        .findById('change-avatar')
        .end();

    },

    'cancel uploading a profile image': function () {
      return this.get('remote')
        .get(require.toUrl(AVATAR_CHANGE_URL_AUTOMATED))
        .setFindTimeout(intern.config.pageLoadTimeout)

        // go to change avatar
        .findById('imageLoader')
        .end()

        .findById('file')
          .click()
        .end()

        .findByCssSelector('.cropper')
        .end()

        .findByCssSelector('.cancel')
          .click()
        .end()

        //success is returning to the avatar change page
        .findById('avatar-options')
        .end();

    }

  });
});

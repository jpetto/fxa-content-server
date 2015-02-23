/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// helper functions for views with a profile image. Meant to be mixed into views.

'use strict';

define([
  'models/profile-image'
], function (ProfileImage) {

  return {
    initialize: function (options) {
      this.notifications = options.notifications;
    },

    displayProfileImage: function (account, wrapperClass) {
      var self = this;
      if (! wrapperClass) {
        wrapperClass = '.avatar-wrapper';
      }

      // We'll optimize the UI for the case that the account
      // doesn't have a profile image if it's not cached
      if (self._shouldShowDefaultProfileImage(account)) {
        self.$(wrapperClass).addClass('with-default');
      }

      return account.fetchCurrentProfileImage(account)
        .then(function (profileImage) {
          self.displayedProfileImage = profileImage;

          if (profileImage.isDefault()) {
            self.$(wrapperClass).addClass('with-default');
            self.logScreenEvent('profile_image_not_shown');
          } else {
            self.$(wrapperClass).removeClass('with-default');
            self.$(wrapperClass).append(profileImage.get('img'));
            self.logScreenEvent('profile_image_shown');
          }
        });
    },

    _shouldShowDefaultProfileImage: function (account) {
      return ! account.has('profileImageUrl');
    },

    updateProfileImage: function (profileImage) {
      var account = this.getSignedInAccount();
      account.setProfileImage(profileImage);
      this.user.setAccount(account);

      this.notifications.profileChanged({
        uid: account.get('uid')
      });
    },

    clearProfileImage: function () {
      // A blank image will clear the cache
      this.updateProfileImage(new ProfileImage());
    }
  };
});

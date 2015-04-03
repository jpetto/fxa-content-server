/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

define([
  'chai',
  'backbone',
  'sinon',
  'underscore',
  'views/mixins/avatar-mixin',
  'views/base',
  'models/notifications',
  'models/reliers/relier',
  'models/user',
  'models/account',
  'models/profile-image',
  'lib/channels/null'
], function (Chai, Backbone, sinon, _, AvatarMixin, BaseView, Notifications,
    Relier, User, Account, ProfileImage, NullChannel) {
  var assert = Chai.assert;

  var SettingsView = BaseView.extend({});

  _.extend(SettingsView.prototype, AvatarMixin);

  describe('views/mixins/avatar-mixin', function () {
    var view;
    var user;
    var account;
    var relier;
    var tabChannelMock;
    var notifications;
    var UID = '123';

    beforeEach(function () {
      user = new User();
      account = new Account();
      relier = new Relier();
      tabChannelMock = new NullChannel();

      notifications = new Notifications({
        tabChannel: tabChannelMock
      });

      account.set('uid', UID);

      view = new SettingsView({
        user: user,
        relier: relier,
        notifications: notifications
      });
      sinon.stub(view, 'getSignedInAccount', function () {
        return account;
      });
      sinon.stub(user, 'setAccount', function () { });

      sinon.stub(notifications, 'profileChanged', function () { });
    });

    describe('updateAvatarUrl', function () {
      it('stores the url', function () {
        view.updateProfileImage(new ProfileImage({ url: 'url' }));
        assert.equal(account.get('profileImageUrl'), 'url');
        assert.isTrue(view.getSignedInAccount.called);
        assert.isTrue(user.setAccount.calledWith(account));
        assert.isTrue(notifications.profileChanged.calledWith({ uid: UID }));
      });

      it('deletes the url if null', function () {
        view.updateProfileImage(new ProfileImage({ url: 'url' }));
        assert.isTrue(account.has('profileImageUrl'));

        view.clearProfileImage();
        assert.isFalse(account.has('profileImageUrl'));
        assert.isTrue(user.setAccount.calledWith(account));
        assert.isTrue(notifications.profileChanged.calledWith({ uid: UID }));
      });
    });

  });
});


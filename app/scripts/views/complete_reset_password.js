/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

define([
  'cocktail',
  'views/base',
  'views/form',
  'stache!templates/complete_reset_password',
  'views/mixins/password-mixin',
  'views/mixins/floating-placeholder-mixin',
  'lib/validate',
  'lib/auth-errors',
  'views/mixins/service-mixin'
],
function (Cocktail, BaseView, FormView, Template, PasswordMixin,
      FloatingPlaceholderMixin, Validate, AuthErrors, ServiceMixin) {
  var t = BaseView.t;
  var View = FormView.extend({
    template: Template,
    className: 'complete-reset-password',

    initialize: function (options) {
      options = options || {};

      // We use the interTabChannel rather than notifications because we only
      // want to send account data to other tabs– not listeners on all channels.
      this._interTabChannel = options.interTabChannel;
    },

    events: {
      'click #resend': BaseView.preventDefaultThen('resendResetEmail')
    },

    // beforeRender is asynchronous and returns a promise. Only render
    // after beforeRender has finished its business.
    beforeRender: function () {
      try {
        this.importSearchParam('token');
        this.importSearchParam('code');
        this.importSearchParam('email');
      } catch(e) {
        // This is an invalid link. Abort and show an error message
        // before doing any more checks.
        this.logError(AuthErrors.toError('DAMAGED_VERIFICATION_LINK'));
        return true;
      }

      // Remove any spaces that are probably due to a MUA adding
      // line breaks in the middle of the link.
      this.token = this.token.replace(/ /g, '');
      this.code = this.code.replace(/ /g, '');

      if (! this._doesLinkValidate()) {
        // One or more parameters fails validation. Abort and show an
        // error message before doing any more checks.
        this.logError(AuthErrors.toError('DAMAGED_VERIFICATION_LINK'));
        return true;
      }

      var self = this;
      return this.fxaClient.isPasswordResetComplete(this.token)
        .then(function (isComplete) {
          self._isLinkExpired = isComplete;
          if (isComplete) {
            self.logError(AuthErrors.toError('EXPIRED_VERIFICATION_LINK'));
          }
          return true;
        });
    },

    afterRender: function () {
      this.initializePlaceholderFields();
    },

    _doesLinkValidate: function () {
      return Validate.isTokenValid(this.token) &&
             Validate.isCodeValid(this.code) &&
             Validate.isEmailValid(this.email);
    },

    context: function () {
      var doesLinkValidate = this._doesLinkValidate();
      var isLinkExpired = this._isLinkExpired;

      // damaged and expired links have special messages.
      return {
        isPasswordAutoCompleteDisabled: this.isPasswordAutoCompleteDisabled(),
        isLinkDamaged: ! doesLinkValidate,
        isLinkExpired: isLinkExpired,
        isLinkValid: doesLinkValidate && ! isLinkExpired
      };
    },

    isValidEnd: function () {
      return this._getPassword() === this._getVPassword();
    },

    showValidationErrorsEnd: function () {
      if (this._getPassword() !== this._getVPassword()) {
        var err = AuthErrors.toError('PASSWORDS_DO_NOT_MATCH');
        this.displayError(err);
      }
    },

    submit: function () {
      var self = this;
      var email = self.email;
      var password = self._getPassword();
      var token = self.token;
      var code = self.code;

      // If the user verifies in the same browser and the original tab
      // is still open, we want the original tab to redirect back to
      // the RP. The only way to do that is for this tab to sign in and
      // get a sessionToken. When the reset password complete poll
      // completes in the original tab, it will fetch the sessionToken
      // from localStorage and go to town.
      return self.fxaClient.completePasswordReset(email, password, token, code)
        .then(function () {
          return self.fxaClient.signIn(email, password, self.relier);
        }).then(function (accountData) {
          var account = self.user.initAccount(accountData);
          self._interTabChannel.send('login', accountData);

          return self.user.setSignedInAccount(account)
            .then(function () {
              return account;
            });
        })
        .then(function (account) {
          // See the above note about notifying the original tab.
          self.logScreenEvent('verification.success');
          return self.broker.afterCompleteResetPassword(account);
        })
        .then(function (result) {
          if (! (result && result.halt)) {
            // the user is definitively signed in here, otherwise this
            // path would not be taken.
            if (self.relier.isDirectAccess()) {
              self.navigate('settings', {
                success: t('Account verified successfully')
              });
            } else {
              self.navigate('reset_password_complete');
            }
          }
        })
        .then(null, function (err) {
          if (AuthErrors.is(err, 'INVALID_TOKEN')) {
            self.logError(err);
            // The token has expired since the first check, re-render to
            // show a screen that allows the user to receive a new link.
            return self.render();
          }

          // all other errors are unexpected, bail.
          throw err;
        });
    },

    _getPassword: function () {
      return this.$('#password').val();
    },

    _getVPassword: function () {
      return this.$('#vpassword').val();
    },

    resendResetEmail: function () {
      var self = this;
      self.logScreenEvent('resend');
      return self.fxaClient.passwordReset(self.email, self.relier)
              .then(function (result) {
                self.navigate('confirm_reset_password', {
                  data: {
                    email: self.email,
                    passwordForgotToken: result.passwordForgotToken
                  }
                });
              }, function (err) {
                self.displayError(err);
              });
    }
  });

  Cocktail.mixin(
    View,
    PasswordMixin,
    ServiceMixin,
    FloatingPlaceholderMixin
  );

  return View;
});

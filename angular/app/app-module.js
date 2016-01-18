(function () {
  'use strict';

  /* @ngdoc object
   * @name psychicDoodle
   * @description
   *
   */
  angular
    .module('psychicDoodle', [
      'ngMaterial',
      'ui.router',
      'home'
    ])
    .config(function ($mdThemingProvider) {
      $mdThemingProvider.theme('default')
        .primaryPalette('pink')
        .accentPalette('orange')
        .dark();
    });
}());

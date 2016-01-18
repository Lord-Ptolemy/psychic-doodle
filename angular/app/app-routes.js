(function () {
  'use strict';

  angular
    .module('psychicDoodle')
    .config(config);

  function config($urlRouterProvider) {
    $urlRouterProvider.otherwise('/home');
  }
}());

(function () {
  'use strict';

  /**
   * @ngdoc object
   * @name psychicDoodle.controller:AppCtrl
   *
   * @description
   *
   */
  angular
    .module('psychicDoodle')
    .controller('AppCtrl', AppCtrl);

  function AppCtrl() {
    var vm = this;
    vm.ctrlName = 'AppCtrl';
    var remote = require('remote');
    var BrowserWindow = remote.require('browser-window');
    var window = BrowserWindow.getFocusedWindow();
    vm.close = function () {
      window.close();
    };
    vm.minimize = function () {
      window.minimize();
    };
    vm.reload = function () {
      window.reload();
    };
  }
}());

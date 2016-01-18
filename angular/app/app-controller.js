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
    vm.close = function () {
      var window = BrowserWindow.getFocusedWindow();
      window.close();
    };
    vm.minimize = function () {
      var window = BrowserWindow.getFocusedWindow();
      window.minimize();
    };
  }
}());

(function () {
  'use strict';

  /**
   * @ngdoc object
   * @name home.controller:HomeCtrl
   *
   * @description
   *
   */
  angular
    .module('home')
    .controller('HomeCtrl', HomeCtrl);

  function HomeCtrl($http) {
    var vm = this;
    var async = require('async');
    var unzip = require('unzip');
    var proxy = 'http://bochen415.info/loggify.php?url=';
    vm.ctrlName = 'HomeCtrl';
    vm.url = '';
    vm.install = installPack;

    function installPack (){
      var apiURL = vm.url+'?build=99';
      $http.get(apiURL).then(function (res) {
        vm.data = res.data;
        if(vm.data.solder){
          var modpackURL = vm.data.solder+'modpack/'+vm.data.name;
          $http.get(modpackURL).then(function (res) {
            vm.data.solderData = res.data;
            $http.get(modpackURL+'/'+vm.data.solderData.recommended).then(function (res) {
              vm.data.recommended = res.data;
            });
          });
        }
      });
    }
  }
}());

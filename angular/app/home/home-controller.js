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
    var AdmZip = require('adm-zip');
    var http = require('http');
    var https = require('https');
    var fs = require('fs');
    var mcLibs, forgeLibs, mcAssets, mcVersion;
    var threads = 10;
    vm.ctrlName = 'HomeCtrl';
    vm.url = 'http://api.technicpack.net/modpack/tekkit-legends';
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
              mcVersion = res.data.minecraft;
              downloadDeps();
            });
          });
        }
      });
    }

    function downloadLibs(){
      var zip = new AdmZip("install/bin/modpack.jar");
      zip.extractEntryTo('version.json', 'install/bin');
      forgeLibs = JSON.parse(fs.readFileSync('install/bin/version.json'));
      async.parallel([
        function (call) {
          $http.get('http://s3.amazonaws.com/Minecraft.Download/versions/'+mcVersion+'/'+mcVersion+'.json').then(function (res) {
            mcLibs = res.data;
            call();
          });
        },function (call) {
          $http.get('https://s3.amazonaws.com/Minecraft.Download/indexes/'+mcVersion+'.json').then(function (res) {
            mcAssets = res.data;
            call();
          });
        }
      ], function () {
        console.log(mcVersion);
        console.log(forgeLibs);
        console.log(mcLibs);
        console.log(mcAssets);
        fs.mkdirSync('install/libs');
        async.eachLimit(mcLibs.libraries, threads, function (lib, next) {
          var file = fs.createWriteStream("install/libs/"+libFile(lib.name));
          https.get(libUrl(lib.name), function(response) {
            response.pipe(file);
            response.on('end', function () {
              console.log(libFile(lib.name)+' downloaded from '+libUrl(lib.name));
              next();
            })
          });
        }, function () {
          console.log('Downloaded all mc libs');
          fs.mkdirSync('install/assets');
          async.forEachOfLimit(mcAssets.objects, threads, function (asset, key, next) {
            try {
              fs.accessSync('install/assets/'+asset.hash.substr(0,2), fs.F_OK);
            } catch (e) {
              fs.mkdirSync('install/assets/'+asset.hash.substr(0,2));
            }
            var file = fs.createWriteStream("install/assets/"+asset.hash.substr(0,2)+'/'+asset.hash);
            http.get("http://resources.download.minecraft.net/"+asset.hash.substr(0,2)+'/'+asset.hash, function(response) {
              response.pipe(file);
              response.on('end', function () {
                console.log(key+' downloaded from '+asset.hash);
                next();
              })
            });
          }, function () {
            console('Downloaded all mc libs');
          });
        });
      });

    }

    function libUrl (name){
      var elements = name.split(':');
      var pack = elements[0];
      var name = elements[1];
      var version = elements[2];
      return 'https://libraries.minecraft.net/'+pack.replace('.','/')+'/'+name+'/'+version+'/'+name+'-'+version+'.jar';
    }

    function libFile (name){
      var elements = name.split(':');
      var name = elements[1];
      var version = elements[2];
      return name+'-'+version+'.jar';
    }

    function downloadDeps(){
      async.eachLimit(vm.data.recommended.mods, threads, function (mod, next) {
        http.get(mod.url, function(response) {
          response.pipe(unzip.Extract({ path: 'install' }));
          response.on('end', function () {
            console.log(mod.name+' downloaded');
            next();
          })
        });
      }, function () {
        console.log('finished');
        var file = fs.createWriteStream("install/bin/minecraft.jar");
        http.get(' http://s3.amazonaws.com/Minecraft.Download/versions/'+mcVersion+'/'+mcVersion+'.jar', function(response) {
          response.pipe(file);
          response.on('end', function () {
            console.log('minecraft.jar was downloaded');
            downloadLibs();
          })
        });
      });
    };
  }
}());

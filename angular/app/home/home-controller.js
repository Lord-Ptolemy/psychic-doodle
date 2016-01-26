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

  function HomeCtrl($http, $log) {
    var vm = this;
    var child_process = require('child_process');
    var async = require('async');
    var unzip = require('unzip');
    var AdmZip = require('adm-zip');
    var http = require('http');
    var https = require('https');
    var fs = require('fs');
    var jetpack = require('fs-jetpack');
    var installDir = __dirname+'\\install';
    var username, mcVersion, gameDir, assetsDir, assetsIndex, uuid, accessToken, userProperties, nativesDir;
    var ygg = require('yggdrasil')({
      //Optional settings object
      host: 'https://authserver.mojang.com' //Optional custom host. No trailing slash.
    });
    var mcLibs, forgeLibs, mcAssets;
    var threads = 5;
    var classPath = '-cp ';
    $log.log(__dirname);
    vm.user = {
      email: '',
      password: ''
    };
    vm.ctrlName = 'HomeCtrl';
    vm.url = 'http://api.technicpack.net/modpack/tekkit-legends';
    vm.install = installPack;
    vm.login = loginUser;
    $log.debug(process);

    function loginUser() {
      ygg.auth({
        agent: 'Minecraft', //Agent name. Defaults to 'Minecraft'
        version: 1,
        user: vm.user.email, //Username
        pass: vm.user.password //Password
      }, function(err, data){
        $log.warn(err);
        $log.info(data);
        username = data.selectedProfile.name;
        gameDir = installDir;
        assetsDir = installDir+'\\assets';
        nativesDir = installDir+'\\natives';
        uuid = data.selectedProfile.id;
        accessToken = data.accessToken;
        userProperties = '{}';
      });
    }

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
              assetsIndex = mcVersion;
              downloadDeps();
            });
          });
        }
      });
    }

    function downloadLibs(){
      var zip = new AdmZip(installDir+"\\bin\\modpack.jar");
      zip.extractEntryTo('version.json', installDir+'\\bin');
      forgeLibs = JSON.parse(fs.readFileSync(installDir+'\\bin\\version.json'));
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
        fs.mkdirSync(installDir+'\\libs');
        async.eachLimit(mcLibs.libraries, threads, function (lib, next) {
          var file = fs.createWriteStream(installDir+"\\libs\\"+libFile(lib));
          https.get(libUrl(lib), function(response) {
            if(lib.extract){
              response.pipe(unzip.Extract({ path: nativesDir }));
            } else {
              response.pipe(file);
              classPath += installDir+"\\libs\\"+libFile(lib)+';';
            }
            response.on('end', function () {
              console.log(libFile(lib)+' downloaded from '+libUrl(lib));
              next();
            })
          });
        }, function () {
          classPath+=installDir+'\\bin\\minecraft.jar net.minecraft.client.main.Main';
          console.log('Downloaded all mc libs');
          var launch = 'java' +
            ' -Djava.library.path=' + nativesDir + ' ' + classPath +
            ' --username ' + username +
            ' --version ' + mcVersion +
            ' --gameDir ' + installDir +
            ' --assetsDir ' + assetsDir +
            ' --assetIndex ' + mcVersion +
            ' --uuid ' + uuid +
            ' --accessToken ' + accessToken +
            ' --userProperties ' + userProperties +
            ' --userType mojang';
          $log.info(launch);
          fs.mkdirSync(installDir+'\\assets');
          fs.mkdirSync(installDir+'\\assets\\indexes');
          var file = fs.createWriteStream(installDir+"\\assets\\indexes\\"+mcVersion+'.json');
          https.get('https://s3.amazonaws.com/Minecraft.Download/indexes/'+mcVersion+'.json', function(response) {
            response.pipe(file);
            response.on('end', function () {
              console.log('Asset index downloaded');
              child_process.exec(launch,
                function (error, stdout, stderr){
                  console.log('stdout: ' + stdout);
                  console.log('stderr: ' + stderr);
                  if(error !== null){
                    console.log('exec error: ' + error);
                  }
                });
            })
          });
          async.forEachOfLimit(mcAssets.objects, threads, function (asset, key, next) {
            try {
              fs.accessSync(installDir+'\\assets\\'+asset.hash.substr(0,2), fs.F_OK);
            } catch (e) {
              fs.mkdirSync(installDir+'\\assets\\'+asset.hash.substr(0,2));
            }
            var file = fs.createWriteStream(installDir+"\\assets\\"+asset.hash.substr(0,2)+'\\'+asset.hash);
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

    function libUrl (lib){
      var elements = lib.name.split(':');
      var pack = elements[0];
      var name = elements[1];
      var version = elements[2];
      return 'https://libraries.minecraft.net/'+pack.replace(/[.]/g,'/')+'/'+name+'/'+version+'/'+libFile(lib);
    }

    function libFile (lib){
      var elements = lib.name.split(':');
      var name = elements[1];
      var version = elements[2];
      var native = false;
      if(lib.natives){
        switch(process.platform){
          case "win32":
            native = lib.natives.windows;
            break;
          case "darwin":
            native = lib.natives.osx;
            break;
          case "linux":
            native = lib.natives.linux;
            break;
        }
      }
      if(native){
        native = native.replace('${arch}', process.arch.substr(1));
        return name+'-'+version+'-'+native+'.jar';
      }
      return name+'-'+version+'.jar';
    }

    function downloadDeps(){
      async.eachLimit(vm.data.recommended.mods, threads, function (mod, next) {
        http.get(mod.url, function(response) {
          response.pipe(unzip.Extract({ path: installDir }));
          response.on('end', function () {
            console.log(mod.name+' downloaded');
            next();
          })
        });
      }, function () {
        console.log('finished');
        var file = fs.createWriteStream(installDir+"\\bin\\minecraft.jar");
        http.get(' http://s3.amazonaws.com/Minecraft.Download/versions/'+mcVersion+'/'+mcVersion+'.jar', function(response) {
          response.pipe(file);
          response.on('end', function () {
            console.log('minecraft.jar was downloaded');
            downloadLibs();
          })
        });
      });
    }
  }
}());

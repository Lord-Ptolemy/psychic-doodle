/* global describe, beforeEach, it, expect, inject, module */
'use strict';

describe('AppCtrl', function () {
  var ctrl;

  beforeEach(module('psychicDoodle'));

  beforeEach(inject(function ($rootScope, $controller) {
    ctrl = $controller('AppCtrl');
  }));

  it('should have ctrlName as AppCtrl', function () {
    expect(ctrl.ctrlName).toEqual('AppCtrl');
  });
});

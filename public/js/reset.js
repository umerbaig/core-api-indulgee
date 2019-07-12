(function () {

  var signupApp = angular.module('resetPasswordApp', []);

  signupApp.controller('ResetPasswordController', function ResetPasswordController($scope, $http) {
    $scope.loading = false;
    $scope.error = false;
    $scope.passwordReset = false;
    $scope.message = '';

    $scope.reset = {
      email: '',
      code: location.search.split('=')[1],
      password: ''
    };

    $scope.obj = {
      email: '',
    };
    console.log($scope.reset);
    $scope.resetPassword = function () {
      $scope.loading = true;
      $scope.error = false;
      $http.post('/api/auth/verify_provider_reset_password', $scope.reset).success(function (data) {
        $scope.loading = false;
        if (data.error) {
          $scope.error = true;
          $scope.message = data.message;
          return;
        }
        $scope.passwordReset = true;
      })
      .error(function (err) {
        console.log(err);
        $scope.error = true;
        $scope.message = err.message;
        $scope.loading = false;
      });
    }

    $scope.sendResetEmail = function () {
      $scope.loading = true;
      $scope.error = false;
      $http.post('/api/auth/provider_reset_password', $scope.obj).success(function (data) {
        $scope.loading = false;
        if (data.error) {
          $scope.error = true;
          $scope.message = data.message;
          return;
        }
        $scope.passwordReset = true;
      })
      .error(function (err) {
        console.log(err);
        $scope.error = true;
        $scope.message = err.message;
        $scope.loading = false;
      });
    };
  });

})();
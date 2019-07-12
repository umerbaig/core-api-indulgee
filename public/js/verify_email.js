(function () {

  var signupApp = angular.module('emailVerifyApp', []);

  signupApp.controller('VerifyEmailController', function VerifyEmailController($scope, $http) {
    $scope.loading = false;
    $scope.error = false;
    $scope.emailVerified = false;
    $scope.message = '';
    $scope.obj = {
      code: location.search.split('=')[1],
      email: '',
    };

    $scope.submitData = function () {
      console.log('here', $scope.obj);
      $scope.loading = true;
      $scope.error = false;
      $http.post('/api/auth/verify_provider', $scope.obj).success(function (data) {
        $scope.loading = false;
        if (data.error) {
          $scope.error = true;
          $scope.message = data.message;
          return;
        }
        $scope.emailVerified = true;
      })
      .error(function (err) {
        console.log(err);
        $scope.error = true;
        $scope.message = err.message;
        $scope.loading = false;
      });
      console.log($scope.user, $scope.loading);
    };
    console.log($scope);
  });

})();
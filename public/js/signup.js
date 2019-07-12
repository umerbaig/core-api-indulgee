(function () {

  var signupApp = angular.module('signupApp', []);

  signupApp.controller('SignupController', function SignupController($scope, $http) {
    $scope.loading = false;
    $scope.error = false;
    $scope.userCreated = false;
    $scope.message = '';
    $scope.user = {
      username: '',
      email: '',
      password: '',
      name: ''
    };

    $scope.submitData = function () {
      $scope.loading = true;
      $scope.error = false;
      $http.post('/api/auth/signup_provider', $scope.user).success(function (data) {
        $scope.loading = false;
        if (data.error) {
          $scope.error = true;
          $scope.message = data.message;
          return;
        }
        $scope.userCreated = true;
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
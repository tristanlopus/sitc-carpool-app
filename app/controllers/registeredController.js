/*
 * RegisteredController
 * Controls the Registered app tab
 */
app.controller('RegisteredController', ['$scope', '$rootScope', '$log', '$q', '$mdToast', 'sitePickerGenerator', 'updateCheckedIn', 'getActiveSites', 'updatePaymentStatusModal', 'updatePaymentStatus', function($scope, $rootScope, $log, $q, $mdToast, sitePickerGenerator, updateCheckedIn, getActiveSites, updatePaymentStatusModal, updatePaymentStatus) {

  function hideSpeedDialButtons(){
      var speedDialButton_first = angular.element(document.querySelectorAll('#speedDialActionButton_first')).parent()
      var speedDialButton_second = angular.element(document.querySelectorAll('#speedDialActionButton_second')).parent()
      var speedDialButton_third = angular.element(document.querySelectorAll('#speedDialActionButton_third')).parent()

      speedDialButton_first.css({'transform':'translate(44px)', 'z-index':'-21'})
      speedDialButton_second.css({'transform':'translate(88px)', 'z-index':'-22'})
      speedDialButton_third.css({'transform':'translate(132px)', 'z-index':'-23'})
    }

  $scope.$on('$stateChangeSuccess', function(event, toState) {
    $log.log('stateChangeSuccess func ran! with toState ' + toState.name)

    if (toState.name == 'attendance.registered' || toState.name == 'attendance.checkedIn' || toState.name == 'attendance.assigned') {
      setTimeout(function(){hideSpeedDialButtons()}, 0)
      }
    })

    // $scope.testAttenCtrlAccess = "I can access RegisteredController!"
    var checkActivePaintSitesPromise = getActiveSites($rootScope.myCarpoolSite, 'paint')
    checkActivePaintSitesPromise.then(function(activeSites) {
      // $log.log("checkActivePaintSites: " + dump(activeSites, 'none'))
      if (Object.keys(activeSites).length > 0) {
        $scope.activePaintSites = true
      }
      else {
        $scope.activePaintSites = false
      }
    })

    var checkActivePlantSitesPromise = getActiveSites($rootScope.myCarpoolSite, 'plant')
    checkActivePlantSitesPromise.then(function(activeSites) {
      if (Object.keys(activeSites).length > 0) {
        // $log.log("checkActivePlantSites: " + dump(activeSites, 'none'))
        $scope.activePlantSites = true
      }
      else {
        $scope.activePlantSites = false
      }
    })

    var checkActivePlaySitesPromise = getActiveSites($rootScope.myCarpoolSite, 'play')
    checkActivePlaySitesPromise.then(function(activeSites) {
      // $log.log("checkActivePlaySites: " + dump(activeSites, 'none'))
      if (Object.keys(activeSites).length > 0) {
        $scope.activePlaySites = true
      }
      else {
        $scope.activePlaySites = false
      }
    })

    if ($scope.activePlantSites) {
      $log.log("Button should be disabled")
      $log.log("activePlantSites: " + $scope.activePlantSites)
    } else {
      $log.log("Button should not be disabled; it's your fault")
      $log.log("activePlantSites: " + $scope.activePlantSites)
    }

    /*
       * checkInPerson
     * Updates $scope arrays to reflect changes to persons's checkin status parameters, then updates them on the server.
     * Pre: personId is a valid person; selectedProject is a valid project, or null
     * Post: $scope arrays and server have been updated to reflect changes to person's checkin status parameters. corresponding view updates are automatically triggered by changes to $scope arrays (i.e. person is moved to the correct list in the correct tab).
     */
    $scope.checkInPerson = function(personId) {
      $log.log(personId)

      var valuesToUpdate = {
        "id":personId,
        "isCheckedIn": 1,
        "carpoolSite":$scope.carpoolSite
      }

      // update data on server
      updateCheckedIn(personId, valuesToUpdate)

      // update data locally
      $scope.persons[personId].isCheckedIn = 1
      $scope.checkedInPersons.push(personId)
      var personIndex = $scope.registeredPersons.indexOf(personId)
      $scope.registeredPersons.splice(personIndex, 1)
    }

    $scope.launchUpdatePaymenStatus = function (personId) {
      updatePaymentStatusModal(personId, $scope).then(function (result) {
        var adjustedAmountPaid = result.amountPaid * 100
        updatePaymentStatus(personId, adjustedAmountPaid, result.checkNumber).then(function () {
          $scope.$parent.persons[personId].paymentStatus = 1
          $scope.$parent.persons[personId].paymentAmount = result.amountPaid
          if (result.checkNumber) {
            $scope.persons[personId].checkNumber = result.checkNumber
          }

          $mdToast.showSimple(`Updated ${$scope.persons[personId].firstName}'s payment status`)
        }, function () {

        }, function () {

        })
      })
    }


}])

/*
 * driverControlPanelGenerator
 * Instantiates view and inline controller for managing the passengers assigned to a driver
 * Pre: myDriver is a person who is checked in and is an active driver
 * Post:
 */
app.factory('driverControlPanelGenerator', ['$q', '$log', '$mdDialog', '$mdToast', 'driverStatus', 'assignToDriver', 'updateCheckedIn', function($q, $log, $mdDialog, $mdToast, driverStatus, assignToDriver, updateCheckedIn) {

  return function(myDriver, $scope, myTeerCarId = null, myVanId = null) {

    $log.log('ran driverControlPanelGenerator!')

    return $mdDialog.show({
      templateUrl: "app/modalTemplates/driverControlPanelTemplate.html",
      scope: $scope,
      preserveScope: true,
      clickOutsideToClose: true,
      parent: angular.element(document.body),
      locals: {
        driver: myDriver,
        teerCarId: myTeerCarId,
        vanId: myVanId
      },
      controller: ['scope', 'driver', 'teerCarId', 'vanId', function(scope, driver, teerCarId, vanId) {
        $log.log('driver for control panel is' + $scope.persons[driver].firstName)

        // create objects representing driver on the scope of this modal
        $scope.driver = driver
        $scope.myPassengers = []
        $scope.teerCarId = teerCarId
        $scope.vanId = vanId


        if ($scope.drivers[driver]) {
          $log.log("This driver's info: " + dump($scope.drivers[driver], 'none'))
          $scope.drivers[driver].numSeatbelts = (parseInt($scope.drivers[driver].numSeatbelts) > parseInt($scope.drivers[driver].passengers.length)) ?  parseInt($scope.drivers[driver].numSeatbelts) : $scope.drivers[driver].passengers.length
          // push each of driver's passengers into array myPassengers on scope of this modal
          $scope.drivers[driver].passengers.forEach(function(currentPassenger) {
            $scope.myPassengers.push(currentPassenger)
          })
          if ($scope.drivers[driver].numSeatbelts != null && $scope.drivers[driver].numSeatbelts != 0 && $scope.drivers[driver].numSeatbelts != '') {
            var emptySeats = $scope.drivers[driver].numSeatbelts - 1 - $scope.drivers[driver].passengers.length
          }
          else {
            // emptySeats = 4 - parseInt($scope.drivers[driver].passengers.length)
          }
        } else {
          $log.log('else ran')
          var emptySeats = $scope.persons[driver].numSeatbelts
        }

        // for each empty seat, push an empty array element to myPassengers so that empty rows will appear in modal, signifying the open seats to the user
        for (var i=0; i < emptySeats; i++) {
          $scope.myPassengers.push('')
        }

        $scope.updateNumSeatbelts = function() {
          updateCheckedIn($scope.driver, {numSeatbeltsToday: $scope.drivers[$scope.driver].numSeatbelts}).then(function success() {
            $log.log("Updated num seatbelts on server.")
          }, function failure (error) {
            $log.log("$scope.updateNumSeatbelts, updateCheckedIn: Error - " + error)
          })
        }

        // watches for changes to the driver's numSeatbelts and adjusts the number of empty seats accordingly
        // If the numSeatbelts is set to a number less than the number of passengers already assigned to the driver, do nothing.
        // TODO: Maybe warn the user that the number of seatbelts they just entered is too few to accommodate the numeber of passengers aslready assigned to this driver
        $scope.$watch(
          function () {
            if ($scope.drivers[driver]) {
              return $scope.drivers[$scope.driver].numSeatbelts - 1
            }
            else {
              return null
            }
          },
          function (newVal, oldVal) {
            if (newVal > oldVal && newVal > $scope.myPassengers.length) {
              var seatsToAdd = newVal - oldVal
              for (var k = 0; k < seatsToAdd; k++) {
                $scope.myPassengers.push('')
              }
            }
            else if (newVal < oldVal) {
              var seatsToSplice = oldVal - newVal
              var numSeatsSpliced = 0
              for (var k = 0; k < $scope.myPassengers.length && numSeatsSpliced < seatsToSplice; k++) {
                if ($scope.myPassengers[k] == '') {
                  $scope.myPassengers.splice(k, 1)
                  numSeatsSpliced++
                }
              }
            }
          }
        )

        /*
         * updateDriverStatus
         * Update the status of a driver when their switch is toggled
         * Pre: personId is a valid person who is a driver
         * Post: If toggling driver to active, driver's status is now active; if toggling to inactive, driver's status is inactive, driver is deleted from $scope.drivers, and each of driver's passengers is update to have no driver
         */
        $scope.updateDriverStatus = function(personId) {
          // person.driverStatus controlled by switch in checkedIn and assigned directives
          $log.log('calling driverStatus on person ' + personId + 'with isDriver')
          var newStatus = $scope.persons[personId].driverStatus
          var driverPromise = driverStatus(personId, newStatus)
          driverPromise.then(function() {
            var driverName = $scope.persons[personId].firstName
            if (newStatus == 'isDriver') {
              $scope.drivers[personId] = {
                "numSeatbelts": $scope.persons[personId].numSeatbelts,
                "passengers": [],
                "carMake": $scope.persons[personId].carMake,
              }
              var message = "Added Driver: "
            } else {
              if ($scope.drivers.hasOwnProperty(personId)) {
                $scope.drivers[personId].passengers.forEach(function(currentPassenger) {
                  // set each passenger's driver to null on the server and the scope
                  assignToDriver(currentPassenger, '')
                  $scope.persons[currentPassenger].assignedToDriver_id = null
                })
                delete $scope.drivers[personId]
              }
              var message = "Removed Driver: "
            }
            $scope.closeDialog()
            $mdToast.showSimple(message + driverName)
          })
        }

        /*
         * removePassenger
         * Remove specified passenger from this driver when X is clicked in their driver control panel
         * Pre: passengerId is a person who is currently assigned to this driver
         * Post: passengerId's driver is set to null, on both the server and the scope, and they are spliced from this driver's passengers
         */
        $scope.removePassenger = function(passengerId) {
          // on server
          assignToDriver(passengerId, '')
          // on scope
          $scope.persons[passengerId].assignedToDriver_id = null
          var index = $scope.drivers[$scope.driver].passengers.indexOf(passengerId)
          $scope.drivers[$scope.driver].passengers.splice(index, 1)
          $scope.myPassengers.splice(index, 1)
        }

        $scope.unassignDriverFromTeerCar = function(driver) {
          $mdDialog.hide('removeDriver')
        }

        $scope.closeDialog = function() {
          $mdDialog.cancel()
        }
      }]
    })
  }
}])

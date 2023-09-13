(function () {
  var connected = false;
  var connectionFailed = false;
  var connectedDevice = null;
  var serviceUUID = null; // Store the current service UUID
  var characteristicUUID = null; // Store the current characteristic UUID
  var deviceJustConnected = false; // Flag to track if a device just connected
  var deviceJustDisconnected = false; // Flag to track if a device just disconnected

  // Function to check if Bluetooth is turned on
  function checkBluetoothStatus() {
    navigator.bluetooth
      .getAvailability()
      .then(function (isAvailable) {
        bluetoothOn = isAvailable;
      })
      .catch(function (error) {
        console.error('Error checking Bluetooth status:', error);
      });
  }

  // Function to set the service UUID
  function setServiceUUID(uuid) {
    serviceUUID = uuid;
  }

  // Function to set the characteristic UUID
  function setCharacteristicUUID(uuid) {
    characteristicUUID = uuid;
  }

  // Function to request Bluetooth device and connect with filters
  function connectBluetoothDeviceWithMatching(matchOption) {
    var filters = [];

    if (matchOption === 'current service' && serviceUUID) {
      filters.push({ services: [serviceUUID] });
    } else if (matchOption === 'current characteristics' && characteristicUUID) {
      filters.push({ characteristics: [characteristicUUID] });
    } else if (matchOption === 'current service and characteristics' && serviceUUID && characteristicUUID) {
      filters.push({ services: [serviceUUID], characteristics: [characteristicUUID] });
    }

    // If 'nothing' is selected or no valid filters are set, then accept all devices
    if (matchOption === 'nothing' || filters.length === 0) {
      filters = undefined;
    }

    var options = {};

    if (filters) {
      options.filters = filters;
    } else {
      options.acceptAllDevices = true;
    }

    // Include the service UUID in the optionalServices
    if (serviceUUID) {
      options.optionalServices = [serviceUUID];
    }

    navigator.bluetooth
      .requestDevice(options)
      .then(function (device) {
        connectedDevice = device;
        connectedDevice.addEventListener('gattserverdisconnected', handleDisconnection); // Listen for disconnection event
        return device.gatt.connect();
      })
      .then(function (server) {
        connected = true;
        connectionFailed = false; // Reset connectionFailed flag on successful connection
        deviceJustConnected = true; // Set the flag to true when device just connected
        deviceJustDisconnected = false; // Reset the flag to false on successful connection
        // Add additional code to interact with the connected device's characteristics
        console.log('Connected to Bluetooth device:', connectedDevice.name);
      })
      .catch(function (error) {
        console.error('Error connecting to Bluetooth device:', error);
        connected = false;
        connectionFailed = true; // Set connectionFailed flag on error
        deviceJustConnected = false; // Reset the flag to false on error
      });
  }

  // Function to handle disconnection event
  function handleDisconnection() {
    connected = false;
    connectedDevice = null;
    serviceUUID = null; // Reset the service UUID when disconnected
    characteristicUUID = null; // Reset the characteristic UUID when disconnected
    deviceJustDisconnected = true; // Set the flag to true when device just disconnected
    console.log('Disconnected from Bluetooth device.');
  }

  // Function to disconnect from the connected Bluetooth device
  function disconnectBluetoothDevice() {
    if (connected && connectedDevice) {
      connectedDevice.gatt.disconnect();
    } else {
      console.log('Error: Not connected to a Bluetooth device.');
    }
  }

  // Function to get the connected Bluetooth device
  function getConnectedBluetoothDevice() {
    return connectedDevice;
  }

  // Function to check if connected to a Bluetooth device
  function isConnected() {
    return connected;
  }

  // Function to check if connection to Bluetooth device failed
  function isConnectionFailed() {
    return connectionFailed;
  }

  // Function to check if a device just connected
  function isDeviceJustConnected() {
    if (deviceJustConnected) {
      deviceJustConnected = false; // Reset the flag to false after one frame
      return true; // Return true if a device just connected
    }
    return false;
  }

  // Function to check if a device just disconnected
  function isDeviceJustDisconnected() {
    if (deviceJustDisconnected) {
      deviceJustDisconnected = false; // Reset the flag to false after one frame
      return true; // Return true if a device just disconnected
    }
    return false;
  }

  // Function to get battery level from the connected Bluetooth device
  function getBatteryLevel() {
    if (connected && connectedDevice && characteristicUUID) {
      connectedDevice.gatt
        .getPrimaryService('battery_service')
        .then(function (service) {
          return service.getCharacteristic(characteristicUUID);
        })
        .then(function (characteristic) {
          return characteristic.readValue();
        })
        .then(function (value) {
          const batteryLevel = value.getUint8(0);
          console.log(`Battery percentage is ${batteryLevel}`);
          // Broadcast the battery level to Scratch
          window.ScratchExtensions.notify('sbxbluetoothextension_batterylevel', batteryLevel);
        })
        .catch(function (error) {
          console.error('Error reading battery level:', error);
        });
    } else {
      console.log('Error: Not connected to a Bluetooth device or characteristic UUID not set.');
    }
  }

  // Function to send data to the connected Bluetooth device
  function sendUUID(value) {
    if (connected && connectedDevice && characteristicUUID) {
      connectedDevice.gatt
        .getPrimaryService(serviceUUID)
        .then(function (service) {
          return service.getCharacteristic(characteristicUUID);
        })
        .then(function (characteristic) {
          // Convert the string value to ArrayBuffer
          var encoder = new TextEncoder();
          var data = encoder.encode(value);
          return characteristic.writeValue(data);
        })
        .then(function () {
          console.log(`Sent UUID value: ${value}`);
        })
        .catch(function (error) {
          console.error('Error sending data to UUID:', error);
        });
    } else {
      console.log('Error: Not connected to a Bluetooth device or characteristic UUID not set.');
    }
  }

  // Function to receive data from the connected Bluetooth device
  function receiveUUID() {
    if (connected && connectedDevice && characteristicUUID) {
      connectedDevice.gatt
        .getPrimaryService(serviceUUID)
        .then(function (service) {
          return service.getCharacteristic(characteristicUUID);
        })
        .then(function (characteristic) {
          return characteristic.readValue();
        })
        .then(function (value) {
          const receivedValue = value.getUint8(0);
          console.log(`Received UUID value: ${receivedValue}`);
          return receivedValue;
        })
        .catch(function (error) {
          console.error('Error receiving data from UUID:', error);
          return ''; // Return an empty string if there was an error
        });
    } else {
      console.log('Error: Not connected to a Bluetooth device or characteristic UUID not set.');
      return ''; // Return an empty string if not connected or UUID not set
    }
  }

  // Reporter to get the current service UUID
  function getServiceUUID() {
    return serviceUUID;
  }

  // Reporter to get the current characteristic UUID
  function getCharacteristicUUID() {
    return characteristicUUID;
  }

  // Reporter to get the connected device's name
  function getConnectedDeviceName() {
    if (connectedDevice) {
      return connectedDevice.name;
    }
    return '';
  }

  // Hat block to trigger when a device connects
  function whenDeviceConnects() {
    if (isDeviceJustConnected()) {
      return true;
    }
    return false;
  }

  // Hat block to trigger when a device disconnects
  function whenDeviceDisconnects() {
    if (isDeviceJustDisconnected()) {
      return true;
    }
    return false;
  }

  var descriptor = {
    blocks: [
      // Connect and Disconnect Blocks
      [' ', 'Connect Bluetooth device by matching %m.matchOption', 'connectBluetoothDeviceWithMatching', 'nothing'],
      [' ', 'Disconnect from Bluetooth device', 'disconnectBluetoothDevice'],

      // Blocks that don't need UUID
      ['b', 'Is connected to a Bluetooth device', 'isConnected'],
      ['b', 'Connection Failed?', 'isConnectionFailed'],
      ['r', 'Battery level', 'getBatteryLevel'], // Reporter block to get battery level

      // Blocks that need UUID
      ['', 'Set UUID for Service %s', 'setServiceUUID', 'your_service_uuid_here'],
      ['', 'Set UUID for Characteristic %s', 'setCharacteristicUUID', 'your_characteristic_uuid_here'],
      ['r', 'Receive data from UUID', 'receiveUUID'],
      ['r', 'Current Service UUID', 'getServiceUUID'],
      ['r', 'Current Characteristic UUID', 'getCharacteristicUUID'],
      ['r', 'Connected Device Name', 'getConnectedDeviceName'],
      ['', 'Send data to UUID %s', 'sendUUID', 'your_data_here'],
      
      // Hat blocks
      ['h', 'When device connects to Bluetooth', 'whenDeviceConnects'],
      ['h', 'When device disconnects from Bluetooth', 'whenDeviceDisconnects'],
    ],
    menus: {
      matchOption: ['current service', 'current characteristics', 'current service and characteristics', 'nothing'],
    },
  };

  // Register the extension
  const Bluetooth = {
    connectBluetoothDeviceWithMatching: connectBluetoothDeviceWithMatching,
    disconnectBluetoothDevice: disconnectBluetoothDevice,
    getConnectedBluetoothDevice: getConnectedBluetoothDevice,
    isConnected: isConnected,
    isConnectionFailed: isConnectionFailed,
    getBatteryLevel: getBatteryLevel,
    setServiceUUID: setServiceUUID,
    setCharacteristicUUID: setCharacteristicUUID,
    sendUUID: sendUUID,
    receiveUUID: receiveUUID,
    getServiceUUID: getServiceUUID,
    getCharacteristicUUID: getCharacteristicUUID,
    getConnectedDeviceName: getConnectedDeviceName,
    whenDeviceConnects: whenDeviceConnects,
    whenDeviceDisconnects: whenDeviceDisconnects,
  };

  ScratchExtensions.register('Bluetooth', descriptor, Bluetooth);

  // Initialize Bluetooth status check
  checkBluetoothStatus();
})();

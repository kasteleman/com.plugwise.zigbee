'use strict';

const { CLUSTER } = require('zigbee-clusters');
const THERMOSTAT = require('../../lib/THERMOSTAT');

class Lisa extends THERMOSTAT {

  async onNodeInit({ zclNode }) {
    this.enableDebug();
    this.printNode();

    await super.onNodeInit({ zclNode });
  }

  onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log(changedKeys);
    this.log('newSettingsObj', newSettings);
    this.log('oldSettingsObj', oldSettings);
    this.log('test: ', changedKeys.includes('temperature_Calibration'));
    // localTemperatureCalibration changed
    if (changedKeys.includes('temperature_Calibration')) {
      this.log('temperature_Calibration: ', newSettings.temperature_Calibration);
      try {
        this.zclNode.endpoints[this.getClusterEndpoint(CLUSTER.THERMOSTAT)]
          .clusters[CLUSTER.THERMOSTAT.NAME]
          .writeAttributes({ localTemperatureCalibration: newSettings.temperature_Calibration });
      } catch (err) {
        this.log('could not write localTemperatureCalibration');
        this.log(err);
      }
    }
  }

}

module.exports = Lisa;

// [ManagerDrivers] [Lisa] [0] - Battery: false
// [ManagerDrivers] [Lisa] [0] - Endpoints: 0
// [ManagerDrivers] [Lisa] [0] -- Clusters:
// [ManagerDrivers] [Lisa] [0] --- zapp
// [ManagerDrivers] [Lisa] [0] --- genBasic
// [ManagerDrivers] [Lisa] [0] ---- cid : genBasic
// [ManagerDrivers] [Lisa] [0] ---- sid : attrs
// [ManagerDrivers] [Lisa] [0] ---- zclVersion : 1
// [ManagerDrivers] [Lisa] [0] ---- appVersion : 9
// [ManagerDrivers] [Lisa] [0] ---- hwVersion : 255
// [ManagerDrivers] [Lisa] [0] ---- manufacturerName : Plugwise
// [ManagerDrivers] [Lisa] [0] ---- modelId : 158-01
// [ManagerDrivers] [Lisa] [0] ---- dateCode : ETRX3587
// [ManagerDrivers] [Lisa] [0] ---- powerSource : 4
// [ManagerDrivers] [Lisa] [0] --- genPowerCfg
// [ManagerDrivers] [Lisa] [0] ---- cid : genPowerCfg
// [ManagerDrivers] [Lisa] [0] ---- sid : attrs
// [ManagerDrivers] [Lisa] [0] ---- batteryPercentageRemaining : 200
// [ManagerDrivers] [Lisa] [0] ---- batterySize : 4
// [ManagerDrivers] [Lisa] [0] ---- batteryQuantity : 4
// [ManagerDrivers] [Lisa] [0] --- genIdentify
// [ManagerDrivers] [Lisa] [0] ---- cid : genIdentify
// [ManagerDrivers] [Lisa] [0] ---- sid : attrs
// [ManagerDrivers] [Lisa] [0] ---- identifyTime : 0
// [ManagerDrivers] [Lisa] [0] --- genGroups
// [ManagerDrivers] [Lisa] [0] ---- cid : genGroups
// [ManagerDrivers] [Lisa] [0] ---- sid : attrs
// [ManagerDrivers] [Lisa] [0] ---- nameSupport : 0
// [ManagerDrivers] [Lisa] [0] --- genScenes
// [ManagerDrivers] [Lisa] [0] ---- cid : genScenes
// [ManagerDrivers] [Lisa] [0] ---- sid : attrs
// [ManagerDrivers] [Lisa] [0] ---- count : 0
// [ManagerDrivers] [Lisa] [0] ---- currentScene : 0
// [ManagerDrivers] [Lisa] [0] ---- currentGroup : 0
// [ManagerDrivers] [Lisa] [0] ---- sceneValid : 0
// [ManagerDrivers] [Lisa] [0] ---- nameSupport : 0
// [ManagerDrivers] [Lisa] [0] --- genTime
// [ManagerDrivers] [Lisa] [0] ---- cid : genTime
// [ManagerDrivers] [Lisa] [0] ---- sid : attrs
// [ManagerDrivers] [Lisa] [0] --- genOta
// [ManagerDrivers] [Lisa] [0] ---- cid : genOta
// [ManagerDrivers] [Lisa] [0] ---- sid : attrs
// [ManagerDrivers] [Lisa] [0] --- hvacThermostat
// [ManagerDrivers] [Lisa] [0] ---- cid : hvacThermostat
// [ManagerDrivers] [Lisa] [0] ---- sid : attrs
// [ManagerDrivers] [Lisa] [0] ---- localTemp : 1850
// [ManagerDrivers] [Lisa] [0] ---- absMinHeatSetpointLimit : 0
// [ManagerDrivers] [Lisa] [0] ---- absMaxHeatSetpointLimit : 9990
// [ManagerDrivers] [Lisa] [0] ---- localTemperatureCalibration : 0
// [ManagerDrivers] [Lisa] [0] ---- occupiedHeatingSetpoint : 2100
// [ManagerDrivers] [Lisa] [0] ---- ctrlSeqeOfOper : 2
// [ManagerDrivers] [Lisa] [0] ---- systemMode : 1
// [ManagerDrivers] [Lisa] [0] ------------------------------------------

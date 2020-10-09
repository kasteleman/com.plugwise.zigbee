'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { Cluster, CLUSTER } = require('zigbee-clusters');
const ManufacturerBasicCluster = require('../../lib/ManufacturerBasicCluster');
const THERMOSTAT = require('../../lib/THERMOSTAT');

Cluster.addCluster(ManufacturerBasicCluster);

class Tom extends THERMOSTAT {

  async onNodeInit({ zclNode }) {
    this.enableDebug();
    this.printNode();

    await super.onNodeInit({ zclNode });

    try {
      const firmWare = await this.zclNode.endpoints[this.getClusterEndpoint(CLUSTER.BASIC)]
      .clusters[CLUSTER.BASIC.NAME].readAttributes('firmwareBuildID');
      this.log('Read Firmware Value: ', firmWare);
      this.setSettings({ firmWareVersion: firmWare.firmwareBuildID })
          .catch(err => {
            this.error('failed to update firmWareVersion settings', err);
          });
    } catch (err) {
      this.log('could not read firmWare');
      this.log(err);
    }

    // write programingOperMode
    /* this.node.endpoints[0].clusters.hvacThermostat.write('programingOperMode', 2)
.then(result => {
this.log('programingOperMode: ', result);
})
.catch(err => {
this.log('could not write programingOperMode');
this.log(err);
}); */

    // pIHeatingDemand that reports the % open valve
    if (this.hasCapability('heating_demand')) {
      this.registerCapability('heating_demand', CLUSTER.THERMOSTAT, {
        get: 'pIHeatingDemand',
        reportParser(value) {
          return value;
        },
        report: 'pIHeatingDemand',
        getOpts: {
          getOnLine: true,
          getOnStart: true,
        },
      });

      await this.configureAttributeReporting([
        {
          endpointId: 1,
          cluster: CLUSTER.THERMOSTAT,
          attributeName: 'pIHeatingDemand',
          minInterval: 0,
          maxInterval: 300,
          minChange: 1,
        },
      ]);

      this.pIHeatingDemandTrigger = this.homey.flow.getDeviceTriggerCard('pIHeatingDemand_changed');
      this.pIHeatingDemandTrigger
        .registerRunListener(async (args, state) => {
          return args.args.valve_number === state.valve_number;
        });
    }
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

module.exports = Tom;

// [ManagerDrivers] [Tom] [0] ZigBeeDevice has been inited
// [ManagerDrivers] [Tom] [0] ------------------------------------------
// [ManagerDrivers] [Tom] [0] Node: 1afbc4e9-3c23-454b-98a0-909d148e9253
// [ManagerDrivers] [Tom] [0] - Battery: true
// [ManagerDrivers] [Tom] [0] - Endpoints: 0
// [ManagerDrivers] [Tom] [0] -- Clusters:
// [ManagerDrivers] [Tom] [0] --- zapp
// [ManagerDrivers] [Tom] [0] --- genBasic
// [ManagerDrivers] [Tom] [0] ---- cid : genBasic
// [ManagerDrivers] [Tom] [0] ---- sid : attrs
// [ManagerDrivers] [Tom] [0] ---- zclVersion : 1
// [ManagerDrivers] [Tom] [0] ---- appVersion : 21
// [ManagerDrivers] [Tom] [0] ---- hwVersion : 1
// [ManagerDrivers] [Tom] [0] ---- manufacturerName : Plugwise
// [ManagerDrivers] [Tom] [0] ---- modelId : 106-03
// [ManagerDrivers] [Tom] [0] ---- dateCode : 28-07-2015
// [ManagerDrivers] [Tom] [0] ---- powerSource : 3
// [ManagerDrivers] [Tom] [0] --- genPowerCfg
// [ManagerDrivers] [Tom] [0] ---- cid : genPowerCfg
// [ManagerDrivers] [Tom] [0] ---- sid : attrs
// [ManagerDrivers] [Tom] [0] ---- batteryPercentageRemaining : 176
// [ManagerDrivers] [Tom] [0] ---- batterySize : 3
// [ManagerDrivers] [Tom] [0] ---- batteryQuantity : 2
// [ManagerDrivers] [Tom] [0] --- genIdentify
// [ManagerDrivers] [Tom] [0] ---- cid : genIdentify
// [ManagerDrivers] [Tom] [0] ---- sid : attrs
// [ManagerDrivers] [Tom] [0] ---- identifyTime : 0
// [ManagerDrivers] [Tom] [0] --- genGroups
// [ManagerDrivers] [Tom] [0] ---- cid : genGroups
// [ManagerDrivers] [Tom] [0] ---- sid : attrs
// [ManagerDrivers] [Tom] [0] ---- nameSupport : 0
// [ManagerDrivers] [Tom] [0] --- genScenes
// [ManagerDrivers] [Tom] [0] ---- cid : genScenes
// [ManagerDrivers] [Tom] [0] ---- sid : attrs
// [ManagerDrivers] [Tom] [0] ---- count : 0
// [ManagerDrivers] [Tom] [0] ---- currentScene : 0
// [ManagerDrivers] [Tom] [0] ---- currentGroup : 0
// [ManagerDrivers] [Tom] [0] ---- sceneValid : 0
// [ManagerDrivers] [Tom] [0] ---- nameSupport : 0
// [ManagerDrivers] [Tom] [0] --- genTime
// [ManagerDrivers] [Tom] [0] ---- cid : genTime
// [ManagerDrivers] [Tom] [0] ---- sid : attrs
// [ManagerDrivers] [Tom] [0] --- genOta
// [ManagerDrivers] [Tom] [0] ---- cid : genOta
// [ManagerDrivers] [Tom] [0] ---- sid : attrs
// [ManagerDrivers] [Tom] [0] --- hvacThermostat
// [ManagerDrivers] [Tom] [0] ---- cid : hvacThermostat
// [ManagerDrivers] [Tom] [0] ---- sid : attrs
// [ManagerDrivers] [Tom] [0] ---- localTemp : 0
// [ManagerDrivers] [Tom] [0] ---- ocupancy : 1
// [ManagerDrivers] [Tom] [0] ---- pIHeatingDemand : 93
// [ManagerDrivers] [Tom] [0] ---- localTemperatureCalibration : 0
// [ManagerDrivers] [Tom] [0] ---- occupiedHeatingSetpoint : 2300
// [ManagerDrivers] [Tom] [0] ---- unoccupiedHeatingSetpoint : 1800
// [ManagerDrivers] [Tom] [0] ---- remoteSensing : 4
// [ManagerDrivers] [Tom] [0] ---- ctrlSeqeOfOper : 2
// [ManagerDrivers] [Tom] [0] ---- systemMode : 1
// [ManagerDrivers] [Tom] [0] ---- startOfWeek : 1
// [ManagerDrivers] [Tom] [0] ---- numberOfWeeklyTrans : 42
// [ManagerDrivers] [Tom] [0] ---- numberOfDailyTrans : 6
// [ManagerDrivers] [Tom] [0] ---- programingOperMode : 0
// [ManagerDrivers] [Tom] [0] --- msTemperatureMeasurement
// [ManagerDrivers] [Tom] [0] ---- cid : msTemperatureMeasurement
// [ManagerDrivers] [Tom] [0] ---- sid : attrs
// [ManagerDrivers] [Tom] [0] --- msOccupancySensing
// [ManagerDrivers] [Tom] [0] ---- cid : msOccupancySensing
// [ManagerDrivers] [Tom] [0] ---- sid : attrs
// [ManagerDrivers] [Tom] [0] ------------------------------------------

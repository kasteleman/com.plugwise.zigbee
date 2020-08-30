'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { CLUSTER } = require('zigbee-clusters');

class Lisa extends ZigBeeDevice {

	async onNodeInit({ zclNode }) {

    this.enableDebug();
    this.printNode();

  	await super.onNodeInit({ zclNode });

		// read occupancy
		try {
		 const occupancyValue = await this.zclNode.endpoints[this.getClusterEndpoint(CLUSTER.THERMOSTAT)].clusters[CLUSTER.THERMOSTAT.NAME].readAttributes('occupancy');
			 this.heatingType = occupancyValue['ocupancy'];
			 this.log('Read occupancy Value: ', occupancyValue);
			 if (typeof this.heatingType !== 'number') {
				 this.heatingType = 1;
				 this.log('occupancyValue did not return a value!');
			 }
		 } catch (err) {
			 this.log('could not read occupancy');
			 this.log(err);
			 this.heatingType = 1;
		 }

		// Register target_temperature capability
		// Setpoint of thermostat
		if (this.hasCapability('target_temperature')) {
			this.registerCapability('target_temperature', CLUSTER.THERMOSTAT, {
				getOpts: {
					getOnStart: true,
				},
			});

			await this.configureAttributeReporting([
				{
					endpointId: 1,
					cluster: CLUSTER.THERMOSTAT,
					attributeName: 'occupiedHeatingSetpoint',
					minInterval: 0,
					maxInterval: 300,
					minChange: 10,
				},
			]);
		}

		// local temperature
		if (this.hasCapability('measure_temperature')) {
			this.registerCapability('measure_temperature', CLUSTER.THERMOSTAT, {
				get: 'localTemperature',
				reportParser(value) {
					return Math.round((value / 100) * 10) / 10;
				},
				report: 'localTemperature',
				getOpts: {
					getOnLine: true,
					getOnStart: true,
				},
			});

			await this.configureAttributeReporting([
				{
					endpointId: 1,
					cluster: CLUSTER.THERMOSTAT,
					attributeName: 'localTemperature',
					minInterval: 0,
					maxInterval: 300,
					minChange: 50,
				},
			]);
		}

		// battery reporting
		if (this.hasCapability('measure_battery')) {
			this.registerCapability('measure_battery', CLUSTER.POWER_CONFIGURATION, {
				getOpts: {
					getOnLine: true,
					getOnStart: true,
				},
			});
			await this.configureAttributeReporting([
				{
					endpointId: 1,
					cluster: CLUSTER.POWER_CONFIGURATION,
					attributeName: 'batteryPercentageRemaining',
					minInterval: 0,
					maxInterval: 3600,
					minChange: null,
				},
			]);
		}

	}

	onSettings({oldSettings, newSettings, changedKeys}) {

		this.log(changedKeys);
		this.log('newSettingsObj', newSettings);
		this.log('oldSettingsObj', oldSettings);
		this.log('test: ', changedKeys.includes('temperature_Calibration'));
		// localTemperatureCalibration changed
		if (changedKeys.includes('temperature_Calibration')) {
			this.log('temperature_Calibration: ', newSettings.temperature_Calibration);
			try {
        this.zclNode.endpoints[this.getClusterEndpoint(CLUSTER.THERMOSTAT)].clusters[CLUSTER.THERMOSTAT.NAME].writeAttributes({localTemperatureCalibration: newSettings.temperature_Calibration})
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

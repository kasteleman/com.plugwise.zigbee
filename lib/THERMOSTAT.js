'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { CLUSTER } = require('zigbee-clusters');

class THERMOSTAT extends ZigBeeDevice {

	async onNodeInit({ zclNode }) {

  	await super.onNodeInit({ zclNode });

		this.heatingTypeCluster = "occupiedHeatingSetpoint";

		// Register target_temperature capability
		// Setpoint of thermostat
		if (this.hasCapability('target_temperature')) {
			this.registerCapability('target_temperature', CLUSTER.THERMOSTAT, {
				set: 'occupiedHeatingSetpoint',
				setParser(value) {
					this.zclNode.endpoints[this.getClusterEndpoint(CLUSTER.THERMOSTAT)]
					.clusters[CLUSTER.THERMOSTAT.NAME]
					.writeAttributes({ occupiedHeatingSetpoint: Math.round((value * 1000) / 10) });
					return null;
				},

				get: 'occupiedHeatingSetpoint',
				getOpts: {
					getOnStart: true,
				},

				report: 'occupiedHeatingSetpoint',
				reportParser(value) {
					return Math.round((value / 100) * 10) / 10;
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

}

module.exports = THERMOSTAT;

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

'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { CLUSTER } = require('zigbee-clusters');

class Tom extends ZigBeeDevice {

	async onNodeInit({ zclNode }) {

    this.enableDebug();
    this.printNode();

  	await super.onNodeInit({ zclNode });

		// read ocupancy
		try {
		 const occupancyValue = await this.zclNode.endpoints[this.getClusterEndpoint(CLUSTER.THERMOSTAT)].clusters[CLUSTER.THERMOSTAT.NAME].readAttributes('occupancy');
			 this.heatingType = occupancyValue['ocupancy'];
			 this.log('Read occupancy Value: ', occupancyValue);
		 } catch (err) {
			 this.log('could not read occupancy');
			 this.log(err);
			 this.heatingType = 1;
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

		// pIHeatingDemand that reports the % open valve
		if (this.hasCapability('Heating_Demand')) {
			this.registerCapability('Heating_Demand', CLUSTER.THERMOSTAT, {
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

		//this.pIHeatingDemandTrigger = new Homey.FlowCardTriggerDevice('pIHeatingDemand_changed')
		//	.register()
		//	.registerRunListener((args, state) => {
		//		this.log(args.valve_number, state.valve_numberargs, args.valve_number === state.valve_number);
		//		return Promise.resolve(args.valve_number === state.valve_number);
		//	});

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

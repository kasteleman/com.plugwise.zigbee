'use strict';

const Homey = require('homey');

const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

class Tom extends ZigBeeDevice {

	onMeshInit() {
		this.printNode();
		this.enableDebug();
		this.heatingType = 1;

		// write programingOperMode
		this.node.endpoints[0].clusters.hvacThermostat.write('programingOperMode', 2)
			.then(result => {
				this.log('programingOperMode: ', result);
			})
			.catch(err => {
				this.log('could not write programingOperMode');
				this.log(err);
			});

		// read occupance

		this.node.endpoints[0].clusters.hvacThermostat.read('ocupancy')
			.then(result => {
				this.log('ocupancy: ', result);
				if (result === 1) {
					this.heatingType = 1;
				}
				if (result === 0) {
					this.heatingType = 0;
				}
			})
			.catch(err => {
				this.log('could not read ocupancy');
				this.log(err);
			});

		// Register target_temperature capability
		// Setpoint of thermostat
		this.registerCapability('target_temperature', 'hvacThermostat', {
			set: 'occupiedHeatingSetpoint',
			setParser(value) {
				// this.setCommandParser(value).bind(this);
				if (this.heatingType === 1) {
					this.node.endpoints[0].clusters.hvacThermostat.write('occupiedHeatingSetpoint',
						Math.round(value * 1000 / 10))
						.then(res => {
							this.log('write occupiedHeatingSetpoint: ', res);
						})
						.catch(err => {
							this.error('Error write occupiedHeatingSetpoint: ', err);
						});
					return null;
				}
				if (this.heatingType === 0) {
					this.node.endpoints[0].clusters.hvacThermostat.write('unoccupiedHeatingSetpoint',
						Math.round(value * 1000 / 10))
						.then(res => {
							this.log('write unoccupiedHeatingSetpoint: ', res);
						})
						.catch(err => {
							this.error('Error write unoccupiedHeatingSetpoint: ', err);
						});
					return null;
				}

			},
			get: 'occupiedHeatingSetpoint',
			reportParser(value) {
				return Math.round((value / 100) * 10) / 10;
			},
			report: 'occupiedHeatingSetpoint',
			getOpts: {
				getOnLine: true,
				getOnStart: true,
			},
		});

		// reportlisteners for the occupiedHeatingSetpoint
		// this is the setpoint if ocupancy is set to 1, this is per default
		// if ocupancy is set to 0, unoccupiedHeatingSetpoint is the setpoint for the Heating
		this.registerAttrReportListener('hvacThermostat', 'occupiedHeatingSetpoint', 300, 0, 10, data => {
			const parsedValue = Math.round((data / 100) * 10) / 10;
			this.log('occupiedHeatingSetpoint: ', data, parsedValue);
			if (this.heatingType === 1) this.setCapabilityValue('target_temperature', parsedValue);
		}, 0);

		this.registerAttrReportListener('hvacThermostat', 'unoccupiedHeatingSetpoint', 300, 0, 10, data => {
			const parsedValue = Math.round((data / 100) * 10) / 10;
			this.log('unoccupiedHeatingSetpoint: ', data, parsedValue);
			if (this.heatingType === 0) this.setCapabilityValue('target_temperature', parsedValue);
		}, 0);

		// local temperature
		this.registerCapability('measure_temperature', 'hvacThermostat', {
			get: 'localTemp',
			reportParser(value) {
				return Math.round((value / 100) * 10) / 10;
			},
			report: 'localTemp',
			getOpts: {
				getOnLine: true,
				getOnStart: true,
			},
		});

		this.registerAttrReportListener('hvacThermostat', 'localTemp', 1, 300, 50, value => {
			const parsedValue = Math.round((value / 100) * 10) / 10;
			this.log('hvacThermostat - localTemp: ', value, parsedValue);
			this.setCapabilityValue('measure_temperature', parsedValue);
		}, 0);

		// pIHeatingDemand that reports the % open valve
		this.registerCapability('Heating_Demand', 'hvacThermostat', {
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

		this.registerAttrReportListener('hvacThermostat', 'pIHeatingDemand', 1, 300, 1, value => {
			this.log('hvacThermostat - pIHeatingDemand: ', value);
			const test = this.getCapabilityValue('Heating_Demand');
			this.log('previous valve value :', test);
			if (value !== test) {
				this.pIHeatingDemandTrigger.trigger(this, { valve_number: value }, null)
					.then(this.log)
					.catch(this.error);
				this.setCapabilityValue('Heating_Demand', value);
			}
		}, 0);

		this.pIHeatingDemandTrigger = new Homey.FlowCardTriggerDevice('pIHeatingDemand_changed')
			.register()
			.registerRunListener((args, state) => {
				this.log(args.valve_number, state.valve_numberargs, args.valve_number === state.valve_number);
				return Promise.resolve(args.valve_number === state.valve_number);
			});

		// battery reporting
		if (this.hasCapability('measure_battery')) {
			this.registerCapability('measure_battery', 'genPowerCfg', {
				getOpts: {
					getOnLine: true,
					getOnStart: true,
				},
			});
		}

		this.registerAttrReportListener('genPowerCfg', 'batteryPercentageRemaining', 1, 3600, null, value => {
			const parsedValue = Math.round(value / 2);
			this.log('genPowerCfg - batteryPercentageRemaining: ', value, parsedValue);
			this.setCapabilityValue('measure_battery', parsedValue);
		}, 0);

	}

	onSettings(oldSettingsObj, newSettingsObj, changedKeysArr, callback) {

		this.log(changedKeysArr);
		this.log('newSettingsObj', newSettingsObj);
		this.log('oldSettingsObj', oldSettingsObj);
		this.log('test: ', changedKeysArr.includes('temperature_Calibration'));
		// localTemperatureCalibration changed
		if (changedKeysArr.includes('temperature_Calibration')) {
			this.log('temperature_Calibration: ', newSettingsObj.temperature_Calibration);
			callback(null, true);
			this.node.endpoints[0].clusters.hvacThermostat.write('localTemperatureCalibration', newSettingsObj.temperature_Calibration)
				.then(result => {
					this.log('localTemperatureCalibration: ', result);
				})
				.catch(err => {
					this.log('could not write localTemperatureCalibration');
					this.log(err);
				});
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

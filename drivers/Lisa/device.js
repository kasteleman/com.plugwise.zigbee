'use strict';

const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

class Lisa extends ZigBeeDevice {

	onMeshInit() {
		this.printNode();
		this.enableDebug();

		// Register target_temperature capability
		// Setpoint of thermostat
		this.registerCapability('target_temperature', 'hvacThermostat', {
			set: 'occupiedHeatingSetpoint',
			setParser(value) {
				this.setCommandParser(value).bind(this);
			},
			get: 'occupiedHeatingSetpoint',
			reportParser(value) {
				return Math.round((value / 100) * 10) / 10;
			},
			report: 'occupiedHeatingSetpoint',
		});

		// reportlisteners for the occupiedHeatingSetpoint
		this.registerAttrReportListener('hvacThermostat', 'occupiedHeatingSetpoint', 1, 0, 10, data => {
			const parsedValue = Math.round((data / 100) * 10) / 10;
			this.log('occupiedHeatingSetpoint: ', data, parsedValue);
			this.setCapabilityValue('target_temperature', parsedValue);
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

	setCommandParser(data) {
		this.node.endpoints[0].clusters.hvacThermostat.write('occupiedHeatingSetpoint',
			Math.round(data * 1000 / 10))
			.then(res => {
				this.log('write occupiedHeatingSetpoint: ', res);
			})
			.catch(err => {
				this.error('Error write occupiedHeatingSetpoint: ', err);
			});
		return null;
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

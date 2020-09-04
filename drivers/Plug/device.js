'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { CLUSTER } = require('zigbee-clusters');

class Plug extends ZigBeeDevice {

  async onNodeInit({ zclNode }) {

      this.enableDebug();
      this.printNode();

  		await super.onNodeInit({ zclNode });

			if (this.hasCapability('onoff')) {
        this.registerCapability('onoff', CLUSTER.ON_OFF, {
    			getOpts: {
            getOnStart: true,
    			},
    		});
        await this.configureAttributeReporting([
          {
            endpointId: 1,
            cluster: CLUSTER.ON_OFF,
            attributeName: 'onOff',
            minInterval: 0,
            maxInterval: 300,
            minChange: 1,
          },
        ]);
      }

			if (this.hasCapability('meter_power')) {
				if (typeof this.meteringFactor !== 'number') {
			    const { multiplier, divisor } = await zclNode.endpoints[
			        this.getClusterEndpoint(CLUSTER.METERING)
			      ]
			      .clusters[CLUSTER.METERING.NAME]
			      .readAttributes('multiplier', 'divisor');

			    this.meteringFactor = multiplier / divisor;
			  }
        this.registerCapability('meter_power', CLUSTER.METERING, {
          set: 'occupiedHeatingSetpoint',
          setParser(value) {
            if (this.heatingType === 1) {
              try {
                this.zclNode.endpoints[this.getClusterEndpoint(CLUSTER.THERMOSTAT)]
                  .clusters[CLUSTER.THERMOSTAT.NAME]
                  .writeAttributes({ occupiedHeatingSetpoint: Math.round((value * 1000) / 10) });
              } catch (err) {
                this.log('could not write occupiedHeatingSetpoint');
                this.log(err);
              }
            } else if (this.heatingType === 0) {
              try {
                this.zclNode.endpoints[this.getClusterEndpoint(CLUSTER.THERMOSTAT)]
                  .clusters[CLUSTER.THERMOSTAT.NAME]
                  .writeAttributes({ unoccupiedHeatingSetpoint: Math.round((value * 1000) / 10) });
              } catch (err) {
                this.log('could not write unoccupiedHeatingSetpoint');
                this.log(err);
              }
            }
            return null;
          },

          get: 'occupiedHeatingSetpoint',
          getOpts: {
            getOnStart: true,
          },
          report: 'occupiedHeatingSetpoint',
          async reportParser(value) {
            if (this.heatingType === 1) {
              try {
                const targetTemperature = await this.zclNode.endpoints[this.getClusterEndpoint(CLUSTER.THERMOSTAT)].clusters[CLUSTER.THERMOSTAT.NAME].readAttributes('occupiedHeatingSetpoint');
                this.heatingSetpoint = targetTemperature['occupiedHeatingSetpoint'];
                this.log('Read occupiedHeatingSetpoint Value: ', targetTemperature);
              } catch (err) {
                this.log('could not read occupiedHeatingSetpoint');
                this.log(err);
              }
            } else if (this.heatingType === 0) {
              try {
                const targetTemperature = await this.zclNode.endpoints[this.getClusterEndpoint(CLUSTER.THERMOSTAT)].clusters[CLUSTER.THERMOSTAT.NAME].readAttributes('unoccupiedHeatingSetpoint');
                this.heatingSetpoint = targetTemperature['unoccupiedHeatingSetpoint'];
                this.log('unoccupiedHeatingSetpoint Value: ', targetTemperature);
              } catch (err) {
                this.log('could not read unoccupiedHeatingSetpoint');
                this.log(err);
              }
            }
            return Math.round((this.heatingSetpoint / 100) * 10) / 10;
          },
          endpoint: this.getClusterEndpoint(CLUSTER.METERING),
        });
				await this.configureAttributeReporting([
					{
						endpointId: this.getClusterEndpoint(CLUSTER.METERING),
						cluster: CLUSTER.METERING,
						attributeName: 'currentSummationDelivered',
						minInterval: 0,
						maxInterval: 600, //once per ~5 min
						minChange: 1,
					}
				]);

			}

			if (this.hasCapability('measure_power')) {
        this.registerCapability('measure_power', CLUSTER.METERING, {
          get: 'instantaneousDemand',
          reportParser(value) {
            if (value < 0 && value >= -2) return;
            return value / 10;
          },
          report: 'instantaneousDemand',
          getOpts: {
            getOnStart: true,
          },
          endpoint: this.getClusterEndpoint(CLUSTER.METERING),
        });

        await this.configureAttributeReporting([
          {
            endpointId: this.getClusterEndpoint(CLUSTER.METERING),
            cluster: CLUSTER.METERING,
            attributeName: 'instantaneousDemand',
            minInterval: 0,
            maxInterval: 600, //once per ~5 min
            minChange: 10,
          }
        ]);

			}

      if (this.hasCapability('meter_received')) {
        if (typeof this.meteringFactor !== 'number') {
          const { multiplier, divisor } = await zclNode.endpoints[
              this.getClusterEndpoint(CLUSTER.METERING)
            ]
            .clusters[CLUSTER.METERING.NAME]
            .readAttributes('multiplier', 'divisor');

          this.meteringFactor = multiplier / divisor;
        }
        this.registerCapability('meter_received', CLUSTER.METERING, {
          get: 'currentSummationReceived',
          reportParser(value) {
            if (value < 0) return null;
            this.log('value: ', value);
            // return Buffer.from(value).readUIntBE(0, 2) / 10000;
            return value  * this.meteringFactor;
          },
          report: 'currentSummationReceived',
          getOpts: {
            getOnStart: true,
          },
          endpoint: this.getClusterEndpoint(CLUSTER.METERING),
        });
        await this.configureAttributeReporting([
          {
            endpointId: this.getClusterEndpoint(CLUSTER.METERING),
            cluster: CLUSTER.METERING,
            attributeName: 'currentSummationReceived',
            minInterval: 0,
            maxInterval: 600, //once per ~5 min
            minChange: 1,
          }
        ]);

        this.meter_receivedTrigger = this.homey.flow.getDeviceTriggerCard('Power_received_changed');
        this.meter_receivedTrigger
          .registerRunListener(async (args, state) => {
            return args.args.Power_received_changed === state.Power_received_changed;
          });
      }

      if (this.hasCapability('alarm_poweroverload')) {
        this.registerCapability('alarm_poweroverload', CLUSTER.ELECTRICAL_MEASUREMENT, {
          get: 'acActivePowerOverload',
          reportParser(value) {
            return value === 1;
          },
          report: 'acActivePowerOverload',
          getOpts: {
            getOnStart: true,
            pollInterval: 300000,
          },
        });

        this.power_overloadTrigger = this.homey.flow.getDeviceTriggerCard('poweroverload_changed');
        this.power_overloadTrigger
          .registerRunListener(async (args, state) => {
            return args.args.poweroverload_changed === state.poweroverload_changed;
          });
      }

		/* this.meter_receivedTrigger = new Homey.FlowCardTriggerDevice('Power_received_changed');
		this.meter_receivedTrigger
			.register(); */
		//			.registerRunListener((args, state) => {
		//				this.log(args, state);
		//				return Promise.resolve(args.meter_received_number === state.meter_received_number);
		//			});

		/* this.power_overloadTrigger = new Homey.FlowCardTriggerDevice('poweroverload_changed')
			.register()
			.registerRunListener((args, state) => {
				this.log(args, state);
				return Promise.resolve(args.poweroverload_changed === state.poweroverload_changed);
			}); */

	}

}

module.exports = Plug;


// [ManagerDrivers] [Plug] [0] ZigBeeDevice has been inited
// [ManagerDrivers] [Plug] [0] ------------------------------------------
// [ManagerDrivers] [Plug] [0] Node: 93b551bd-51ef-438f-8d33-ba7d51dc7e20
// [ManagerDrivers] [Plug] [0] - Battery: false
// [ManagerDrivers] [Plug] [0] - Endpoints: 0
// [ManagerDrivers] [Plug] [0] -- Clusters:
// [ManagerDrivers] [Plug] [0] --- zapp
// [ManagerDrivers] [Plug] [0] --- genBasic
// [ManagerDrivers] [Plug] [0] ---- cid : genBasic
// [ManagerDrivers] [Plug] [0] ---- sid : attrs
// [ManagerDrivers] [Plug] [0] ---- zclVersion : 1
// [ManagerDrivers] [Plug] [0] ---- appVersion : 4
// [ManagerDrivers] [Plug] [0] ---- manufacturerName : Plugwise
// [ManagerDrivers] [Plug] [0] ---- modelId : 160-01
// [ManagerDrivers] [Plug] [0] ---- powerSource : 1
// [ManagerDrivers] [Plug] [0] --- genIdentify
// [ManagerDrivers] [Plug] [0] ---- cid : genIdentify
// [ManagerDrivers] [Plug] [0] ---- sid : attrs
// [ManagerDrivers] [Plug] [0] ---- identifyTime : 0
// [ManagerDrivers] [Plug] [0] --- genGroups
// [ManagerDrivers] [Plug] [0] ---- cid : genGroups
// [ManagerDrivers] [Plug] [0] ---- sid : attrs
// [ManagerDrivers] [Plug] [0] ---- nameSupport : 0
// [ManagerDrivers] [Plug] [0] --- genScenes
// [ManagerDrivers] [Plug] [0] ---- cid : genScenes
// [ManagerDrivers] [Plug] [0] ---- sid : attrs
// [ManagerDrivers] [Plug] [0] ---- count : 0
// [ManagerDrivers] [Plug] [0] ---- currentScene : 0
// [ManagerDrivers] [Plug] [0] ---- currentGroup : 0
// [ManagerDrivers] [Plug] [0] ---- sceneValid : 0
// [ManagerDrivers] [Plug] [0] ---- nameSupport : 0
// [ManagerDrivers] [Plug] [0] --- genOnOff
// [ManagerDrivers] [Plug] [0] ---- cid : genOnOff
// [ManagerDrivers] [Plug] [0] ---- sid : attrs
// [ManagerDrivers] [Plug] [0] ---- onOff : 0
// [ManagerDrivers] [Plug] [0] --- genAlarms
// [ManagerDrivers] [Plug] [0] ---- cid : genAlarms
// [ManagerDrivers] [Plug] [0] ---- sid : attrs
// [ManagerDrivers] [Plug] [0] --- genTime
// [ManagerDrivers] [Plug] [0] ---- cid : genTime
// [ManagerDrivers] [Plug] [0] ---- sid : attrs
// [ManagerDrivers] [Plug] [0] --- genOta
// [ManagerDrivers] [Plug] [0] ---- cid : genOta
// [ManagerDrivers] [Plug] [0] ---- sid : attrs
// [ManagerDrivers] [Plug] [0] --- seMetering
// [ManagerDrivers] [Plug] [0] ---- cid : seMetering
// [ManagerDrivers] [Plug] [0] ---- sid : attrs
// [ManagerDrivers] [Plug] [0] ---- currentSummDelivered : [ 0, 0 ]
// [ManagerDrivers] [Plug] [0] ---- currentSummReceived : [ 0, 0 ]
// [ManagerDrivers] [Plug] [0] ---- status : 0
// [ManagerDrivers] [Plug] [0] ---- unitOfMeasure : 0
// [ManagerDrivers] [Plug] [0] ---- multiplier : 1
// [ManagerDrivers] [Plug] [0] ---- divisor : 10000
// [ManagerDrivers] [Plug] [0] ---- summaFormatting : 0
// [ManagerDrivers] [Plug] [0] ---- demandFormatting : 0
// [ManagerDrivers] [Plug] [0] ---- meteringDeviceType : 0
// [ManagerDrivers] [Plug] [0] ---- instantaneousDemand : -2
// [ManagerDrivers] [Plug] [0] --- haElectricalMeasurement
// [ManagerDrivers] [Plug] [0] ---- cid : haElectricalMeasurement
// [ManagerDrivers] [Plug] [0] ---- sid : attrs
// [ManagerDrivers] [Plug] [0] ---- measurementType : 1
// [ManagerDrivers] [Plug] [0] ---- totalActivePower : -2
// [ManagerDrivers] [Plug] [0] ---- powerMultiplier : 4294901760
// [ManagerDrivers] [Plug] [0] ---- powerDivisor : 4294967040
// [ManagerDrivers] [Plug] [0] ---- acAlarmsMask : 4
// [ManagerDrivers] [Plug] [0] ---- acActivePowerOverload : 0
// [ManagerDrivers] [Plug] [0] ------------------------------------------

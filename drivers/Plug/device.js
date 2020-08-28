'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { CLUSTER } = require('zigbee-clusters');

class Plug extends ZigBeeDevice {

  async onNodeInit({ zclNode }) {

      this.enableDebug();
      this.printNode();

      await super.onNodeInit({ zclNode });

			if (this.hasCapability('onoff')) {
        await this.configureAttributeReporting([
          {
            endpointId: 1,
            cluster: CLUSTER.ON_OFF,
            attributeName: 'onOff',
            minInterval: 0,
            maxInterval: 300,
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
				await this.configureAttributeReporting([
					{
						endpointId: this.getClusterEndpoint(CLUSTER.METERING),
						cluster: CLUSTER.METERING,
						attributeName: 'instantaneousDemand',
						minInterval: 0,
						maxInterval: 600, //once per ~5 min
						minChange: 1,
					}
				]);

			}

			if (this.hasCapability('measure_power')) {
        if (typeof this.activePowerFactor !== 'number') {
          const { acPowerMultiplier, acPowerDivisor } = await zclNode.endpoints[
              this.getClusterEndpoint(CLUSTER.ELECTRICAL_MEASUREMENT)
            ]
            .clusters[CLUSTER.ELECTRICAL_MEASUREMENT.NAME]
            .readAttributes('acPowerMultiplier', 'acPowerDivisor');

          this.activePowerFactor = acPowerMultiplier / acPowerDivisor;
        }
        await this.configureAttributeReporting([
          {
            endpointId: this.getClusterEndpoint(CLUSTER.ELECTRICAL_MEASUREMENT),
            cluster: CLUSTER.ELECTRICAL_MEASUREMENT,
            attributeName: 'activePower',
            minInterval: 0,
            maxInterval: 600, //once per ~5 min
            minChange: 10,
          }
        ]);

			}

      if (this.hasCapability('meter_received')) {
        await this.configureAttributeReporting([
          {
            endpointId: meteringEndpoint,
            cluster: CLUSTER.METERING,
            attributeName: 'currentSummReceived',
            minInterval: 0,
            maxInterval: 600, //once per ~5 min
            minChange: 1,
          }
        ]);

        zclNode.endpoints[meteringEndpoint].clusters[CLUSTER.METERING.NAME]
        .on('attr.currentSummReceived', (currentSummReceived) => {
          let watt = Math.max(currentSummReceived, 0) / 10000;
          this.log('watt: ', watt);
          this.setCapabilityValue('meter_received', watt);
        });
      }

      if (this.hasCapability('alarm_poweroverload')) {
        /*await this.configureAttributeReporting([
          {
            endpointId: meteringEndpoint,
            cluster: CLUSTER.METERING,
            attributeName: 'acActivePowerOverload',
            minInterval: 0,
            maxInterval: 600, //once per ~5 min
            minChange: 1,
          }
        ]); */

        zclNode.endpoints[meteringEndpoint].clusters[CLUSTER.METERING.NAME]
        .on('attr.currentSummReceived', (acActivePowerOverload) => {
          //let watt = Math.max(acActivePowerOverload, 0) / 10000;
          this.log('Overload: ', acActivePowerOverload);
          this.setCapabilityValue('alarm_poweroverload', acActivePowerOverload === 1);
        });
      }

		}

/*'use strict';

		if (this.hasCapability('meter_received')) {
			this.registerCapability('meter_received', 'seMetering', {
				get: 'currentSummReceived',
				reportParser(value) {
					this.log('value: ', value);
					// return Buffer.from(value).readUIntBE(0, 2) / 10000;
					return value[1] / 10000;
				},
				report: 'currentSummReceived',
				getOpts: {
					getOnStart: true,
				},
			});
		}

		if (this.hasCapability('alarm_poweroverload')) {
			this.registerCapability('alarm_poweroverload', 'haElectricalMeasurement', {
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
		}

		// meter_received
		// Report is send in 10 min. Can not be changed.
		if (this.hasCapability('meter_received')) {
			this.registerCapability('meter_received', 'seMetering', { endpoint: this.currentSummReceivedEnpoint });
			this.registerAttrReportListener('seMetering', 'currentSummReceived', 600, 600, [null, null],
				this.oncurrentSummReceived.bind(this), this.currentSummReceivedEnpoint)
				.catch(err => {
					this.error('failed to register attr report listener - seMetering/currentSummReceived', err);
				});
		}

		this.meter_receivedTrigger = new Homey.FlowCardTriggerDevice('Power_received_changed');
		this.meter_receivedTrigger
			.register();
		//			.registerRunListener((args, state) => {
		//				this.log(args, state);
		//				return Promise.resolve(args.meter_received_number === state.meter_received_number);
		//			});

		this.power_overloadTrigger = new Homey.FlowCardTriggerDevice('poweroverload_changed')
			.register()
			.registerRunListener((args, state) => {
				this.log(args, state);
				return Promise.resolve(args.poweroverload_changed === state.poweroverload_changed);
			});

	}

	oncurrentSummReceived(value) {
		// const parsedValue = Buffer.from(value).readUIntBE(0, 2) / 1000;
		const parsedValue = value[1] / 10000;
		this.log('oncurrentSummReceived', value, parsedValue);
		this.setCapabilityValue('meter_received', parsedValue);
	}*/

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

'use strict';

const { BasicCluster, ZCLDataTypes } = require('zigbee-clusters');

class ManufacturerBasicCluster extends BasicCluster {

	static get ATTRIBUTES() {
	    return {
	      ...super.ATTRIBUTES,
	      firmwareBuildID: {
	        id: 0x4000,
	        type: ZCLDataTypes.string, // not sure about this one, maybe octstr could work as well
	        manufacturerId: 0x1172,
	      },
	    };
	  }

}

module.exports = ManufacturerBasicCluster;

'use strict';

const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

class Lisa extends ZigBeeDevice {
  onMeshInit() {
  this.printNode();
  		this.enableDebug();
    }
}

module.exports = Lisa;

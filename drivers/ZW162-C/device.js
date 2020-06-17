'use strict';

const { ZwaveDevice } = require('homey-meshdriver');

const SIREN_TIMEOUT = 10 * 1000;
const TAMPER_TIMEOUT = 30 * 1000;

class AeotecDoorbellSixDevice extends ZwaveDevice {

  onMeshInit() {
    this.printNode();
    this.enableDebug();

    this.currentSiren = 1;
    this.defaultSiren = Number(this.getSetting('default_sound'));
	this.ringer_sound = Number(this.getSetting('doorbell_sound'));

    this.registerReportListener('NOTIFICATION', 'NOTIFICATION_REPORT', report => {
      if (report['Notification Type'] && report['Notification Status']) {
        if (report['Notification Type'] === 'Siren') {
          this.setCapabilityValue('onoff.siren', !!report['Notification Status (Raw)']);

          if (this.sirenTimeout) clearTimeout(this.sirenTimeout);
          this.sirenTimeout = setTimeout(() => {
            this.setCapabilityValue('onoff.siren', false);
          }, SIREN_TIMEOUT);
        }

        if (report['Notification Type'] === 'Home Security') {
          this.setCapabilityValue('alarm_tamper', !!report['Notification Status (Raw)']);

          if (this.tamperTimeout) clearTimeout(this.tamperTimeout);
          this.tamperTimeout = setTimeout(() => {
            this.setCapabilityValue('alarm_tamper', false);
          }, TAMPER_TIMEOUT);
        }
      }
    });
  }

  async setSiren({ sirenNumber = 1, sirenState }) {
    this.currentSiren = sirenNumber;
    this.log('Turning siren', sirenNumber, sirenState);
    return this.node.MultiChannelNodes[`${sirenNumber}`].CommandClass.COMMAND_CLASS_BASIC.BASIC_SET({
      Value: sirenState,
    });
  }

  async resetSiren() {
    this.setCapabilityValue('onoff.siren', false);
    return this.node.MultiChannelNodes[`${this.currentSiren}`].CommandClass.COMMAND_CLASS_BASIC.BASIC_SET({
      Value: false,
    });
  }
  
 async setVolume(node, Volume, sound) {
	     return this.node.MultiChannelNodes[`${node}`].CommandClass['COMMAND_CLASS_SOUND_SWITCH']['SOUND_SWITCH_CONFIGURATION_SET']({
		Volume: Volume,
		'Default Tone Identifier': sound
		});
 }

  async onSettings(oldSettings, newSettings, changedKeys) {
    this.log(changedKeys);
	this.log(oldSettings);
	
	// Default Sound Settings.
    if (changedKeys.includes('default_sound')) {
      if (Number(newSettings['default_sound']) < 9 && Number(newSettings['default_sound']) > 0) {
        this.log('Changing default sound');
        this.defaultSiren = newSettings['default_sound'];
		if(changedKeys.includes('Default_volume'))
			this.setVolume(1, newSettings['Default_volume'], Number(newSettings['doorbell_sound']));
		else
			this.setVolume(1, oldSettings['Default_volume'], Number(newSettings['doorbell_sound']));
      }
    }
	if (changedKeys.includes('Default_volume')) {
		this.log('Changing Volume')
		this.setVolume(1, newSettings['Default_volume'], Number(this.getSetting('doorbell_sound')))
	}
	
	// Tamper Settings
	if (changedKeys.includes('tamper_sound')) {
      if (Number(newSettings['tamper_sound']) < 18 && Number(newSettings['tamper_sound']) > 0) {
        this.log('Changing default sound');
        this.defaultSiren = newSettings['tamper_sound'];
		if(changedKeys.includes('tamper_volume'))
			this.setVolume(2, newSettings['tamper_volume'], Number(newSettings['tamper_sound']));
		else
			this.setVolume(2, oldSettings['tamper_volume'], Number(newSettings['tamper_sound']));
      }
    }
	if (changedKeys.includes('tamper_volume')) {
		this.log('Changing Volume')
		this.setVolume(2, newSettings['tamper_volume'], Number(this.getSetting('doorbell_sound')))
	}
	
	// Button 1 Settings
	if (changedKeys.includes('doorbell_sound')) {
      if (Number(newSettings['doorbell_sound']) < 9 && Number(newSettings['doorbell_sound']) > 0) {
        this.log('Changing ringer sound');
        this.ringer_sound = Number(newSettings['doorbell_sound']);
		if(changedKeys.includes('ringer_volume'))
			this.setVolume(3, newSettings['ringer_volume'], Number(newSettings['doorbell_sound']));
		else
			this.setVolume(3, oldSettings['ringer_volume'], Number(newSettings['doorbell_sound']));
      }
    }
	if (changedKeys.includes('ringer_volume')) {
		this.log('Changing Volume')
		this.setVolume(3, newSettings['ringer_volume'], Number(this.getSetting('doorbell_sound')));
	}


	

    return Promise.resolve(newSettings);
  }

}

module.exports = AeotecDoorbellSixDevice;

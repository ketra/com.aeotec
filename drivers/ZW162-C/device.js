'use strict'

const { ZwaveDevice } = require('homey-meshdriver')

const SIREN_TIMEOUT = 10 * 1000
const TAMPER_TIMEOUT = 30 * 1000

class AeotecDoorbellSixDevice extends ZwaveDevice {

  onMeshInit () {
    this.printNode()
    this.enableDebug()

    this.currentSiren = 1
    this.defaultSiren = Number(this.getSetting('default_sound'))
    this.ringer_sound = Number(this.getSetting('doorbell_sound'))

    this.registerReportListener('NOTIFICATION', 'NOTIFICATION_REPORT', report => {
      if (report['Notification Type'] && report['Notification Status']) {
        if (report['Notification Type'] === 'Siren') {
          this.setCapabilityValue('onoff.siren', !!report['Notification Status (Raw)'])

          if (this.sirenTimeout) clearTimeout(this.sirenTimeout)
          this.sirenTimeout = setTimeout(() => {
            this.setCapabilityValue('onoff.siren', false)
          }, SIREN_TIMEOUT)
        }

        if (report['Notification Type'] === 'Home Security') {
          this.setCapabilityValue('alarm_tamper', !!report['Notification Status (Raw)'])

          if (this.tamperTimeout) clearTimeout(this.tamperTimeout)
          this.tamperTimeout = setTimeout(() => {
            this.setCapabilityValue('alarm_tamper', false)
          }, TAMPER_TIMEOUT)
        }
      }
    })
  }

  async setSiren (sound, Volume) {
    this.log('Turning siren', sound)
    return this.node.MultiChannelNodes[1].CommandClass['COMMAND_CLASS_SOUND_SWITCH']['SOUND_SWITCH_TONE_PLAY_SET']({ 'Tone identifier': Number(sound) })
  }

  async setSound (node, sound) {
    var result = await this.node.MultiChannelNodes[`${node}`].CommandClass['COMMAND_CLASS_SOUND_SWITCH']['SOUND_SWITCH_CONFIGURATION_GET']()
    var Volume = Number(result['Volume'])

    return this.node.MultiChannelNodes[`${node}`].CommandClass['COMMAND_CLASS_SOUND_SWITCH']['SOUND_SWITCH_CONFIGURATION_SET']({
      Volume: Volume,
      'Default Tone Identifier': sound
    })
  }

  async resetSiren () {
    this.setCapabilityValue('onoff.siren', false)
    return this.node.MultiChannelNodes[`${this.currentSiren}`].CommandClass.COMMAND_CLASS_BASIC.BASIC_SET({
      Value: false
    })
  }

  async setVolume (node, Volume, sound) {
    var result = await this.node.MultiChannelNodes[`${node}`].CommandClass['COMMAND_CLASS_SOUND_SWITCH']['SOUND_SWITCH_CONFIGURATION_GET']()
    if (sound == 0)
      sound = Number(result['Default Tone Identifer'])
    return this.node.MultiChannelNodes[`${node}`].CommandClass['COMMAND_CLASS_SOUND_SWITCH']['SOUND_SWITCH_CONFIGURATION_SET']({
      Volume: Volume,
      'Default Tone Identifier': sound
    })
  }

  async onSettings (oldSettings, newSettings, changedKeys) {
    changedKeys.forEach(key => {
      var [type, node] = key.split('_')
      if (type == 'sound') {
        if (changedKeys.includes(`volume_${node}`))
          this.setVolume(node, newSettings[`volume_${node}`], Number(newSettings[`sound_${node}`]))
        else
          this.setVolume(node, oldSettings[`volume_${node}`], Number(newSettings[`sound_${node}`]))
      }
      if (type == 'volume') {
        this.setVolume(node, newSettings[`volume_${node}`], Number(this.getSetting(`sound_${node}`)))
      }
    })

    return Promise.resolve(newSettings)
  }

}

module.exports = AeotecDoorbellSixDevice

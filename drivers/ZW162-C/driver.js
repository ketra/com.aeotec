'use strict'

const Homey = require('homey')

class AeotecDoorbellSixDriver extends Homey.Driver {

  onInit () {
    super.onInit()

    this.alarmOnFlow = new Homey.FlowCardAction('ZW162-turn_alarm_on')
      .register()
      .registerRunListener(async (args, state) => {
        // console.log(args)
        // console.log(state)
        // if (typeof (args.sound) !== 'number') return new Error('Sound should be a number')
        var result = false
        result = args.device.setSiren(Number(args.sound), Number(args.Vomule)).then(value => {
          console.log(value); // Success!
        }, reason => {
          console.error(reason); // Error!
        })
      })
    this.alarmOffFlow = new Homey.FlowCardAction('ZW162-turn_alarm_off')
      .register()
      .registerRunListener(async (args, state) => {
        return args.device.resetSiren()
      })
    this.alarmOffFlow = new Homey.FlowCardAction('ZW162-change_volume')
      .register()
      .registerRunListener(async (args, state) => {
        return args.device.setVolume(Number(args.item), Number(args.volume), 0)
      })
    this.alarmOffFlow = new Homey.FlowCardAction('ZW162-change_Sound')
      .register()
      .registerRunListener(async (args, state) => {
        return args.device.setSound(Number(args.item), Number(args.sound))
      })
  }

}

module.exports = AeotecDoorbellSixDriver

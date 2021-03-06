/* global Module */

/* Magic Mirror
 * Module: MMM-SystemStats
 *
 * By Benjamin Roesner http://benjaminroesner.com
 * MIT Licensed.
 */

Module.register('MMM-SystemStats', {

  defaults: {
    updateInterval: 10000,
    animationSpeed: 0,
    align: 'right',
    language: config.language,
    useSyslog: false,
    thresholdCPUTemp: 70, // in celcius
    baseURLSyslog: 'http://127.0.0.1:8080/syslog'
	useTelegram: false,
	botToken: 'ENTER YOUR TOKEN HERE',
	chatID: 'ENTER YOUR CHAT-ID HERE',
  },

  // Define required scripts.
	getScripts: function () {
      return ["moment.js", "moment-duration-format.js"];
	},

  // Define required translations.
	getTranslations: function() {
	  return {
        'en': 'translations/en.json',
        'id': 'translations/id.json',
	    'de': 'translations/de.json'
      };
	},

  // Define start sequence
  start: function() {
    Log.log('Starting module: ' + this.name);

    // set locale
    moment.locale(this.config.language);

    this.stats = {};
    this.stats.cpuTemp = this.translate('LOADING').toLowerCase();
    this.stats.sysLoad = this.translate('LOADING').toLowerCase();
    this.stats.freeMem = this.translate('LOADING').toLowerCase();
    this.stats.upTime = this.translate('LOADING').toLowerCase();
	this.stats.freeSpace = this.translate('LOADING').toLowerCase();
    this.sendSocketNotification('CONFIG', this.config);
  },

  socketNotificationReceived: function(notification, payload) {
    //Log.log('MMM-SystemStats: socketNotificationReceived ' + notification);
    //Log.log(payload);
    if (notification === 'STATS') {
      this.stats.cpuTemp = payload.cpuTemp;
      //console.log("this.config.useSyslog-" + this.config.useSyslog + ', this.stats.cpuTemp-'+parseInt(this.stats.cpuTemp)+', this.config.thresholdCPUTemp-'+this.config.thresholdCPUTemp);
      if (this.config.useSyslog || this.config.useTelegram) {
        var cpuTemp = Math.ceil(parseFloat(this.stats.cpuTemp));
        //console.log('before compare (' + cpuTemp + '/' + this.config.thresholdCPUTemp + ')');
        if (cpuTemp > this.config.thresholdCPUTemp) {
          //console.log('alert for threshold violation (' + cpuTemp + '/' + this.config.thresholdCPUTemp + ')');
          if (this.config.useSyslog) {
			this.sendSocketNotification('ALERT',{
				config: this.config,
				type: 'WARNING',
				message: this.translate("TEMP_THRESHOLD_WARNING") + ' (' + this.config.thresholdCPUTemp + '°C)'
			});
		  }
		  if (this.config.useTelegram){
				this.sendSocketNotification('ALERTTG', {
					config: this.config,
					message: this.translate("TEMP_THRESHOLD_WARNING") + ' (' + this.config.thresholdCPUTemp + '°C)'
				});
			}
        }
      }
      this.stats.sysLoad = payload.sysLoad[0];
      this.stats.freeMem = Number(payload.freeMem).toFixed() + '%';
      upTime = parseInt(payload.upTime[0]);
      this.stats.upTime = moment.duration(upTime, "seconds").humanize();
	  this.stats.freeSpace = payload.freeSpace;
      this.updateDom(this.config.animationSpeed);
    }
  },

  // Override dom generator.
  getDom: function() {
    var self = this;
    var wrapper = document.createElement('table');

    wrapper.innerHTML = '<tr>' +
                        '<td class="title" style="text-align:' + self.config.align + ';">' + this.translate("CPU_TEMP") + ':&nbsp;</td>' +
						'<td style="text-align: center;"><i class="fa fa-thermometer" style="font-size:24px"></i>:&nbsp;</td>' +
                        '<td class="value" style="text-align:left;">' + this.stats.cpuTemp + '</td>' +
                        '</tr>' +
                        '<tr>' +
                        '<td class="title" style="text-align:' + self.config.align + ';">' + this.translate("SYS_LOAD") + ':&nbsp;</td>' +
						'<td style="text-align: center;"><i class="fa fa-tachometer" style="font-size:24px"></i>:&nbsp;</td>' +
                        '<td class="value" style="text-align:left;">' + this.stats.sysLoad + '</td>' +
                        '</tr>' +
                        '<tr>' +
                        '<td class="title" style="text-align:' + self.config.align + ';">' + this.translate("RAM_FREE") + ':&nbsp;</td>' +
						'<td style="text-align: center;"><i class="fa fa-microchip" style="font-size:24px"></i>:&nbsp;</td>' +
                        '<td class="value" style="text-align:left;">' + this.stats.freeMem + '</td>' +
                        '</tr>' +
                        '<tr>' +
                        '<td class="title" style="text-align:' + self.config.align + ';">' + this.translate("UPTIME") + ':&nbsp;</td>' +
						'<td style="text-align: center;"><i class="fa fa-clock-o" style="font-size:24px"></i>:&nbsp;</td>' +
                        '<td class="value" style="text-align:left;">' + this.stats.upTime + '</td>' +
                        '</tr>' +
						'<td class="title" style="text-align:' + self.config.align + ';">' + this.translate("DISK_FREE") + ':&nbsp;</td>' +
						'<td style="text-align: center;"><i class="fa fa-hdd-o" style="font-size:24px"></i>:&nbsp;</td>' + 
                        '<td class="value" style="text-align:left;">' + this.stats.freeSpace + '</td>' +
						'</tr>';

    return wrapper;
  },
});

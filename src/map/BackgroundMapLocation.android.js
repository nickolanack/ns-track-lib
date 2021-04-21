function BackgroundMapLocation() {



}



try {
	var observableModule = require("@nativescript/core").Observable;
	BackgroundMapLocation.prototype = new observableModule.Observable();
} catch (e) {
	console.error('Unable to extend Observable!!!');
}


BackgroundMapLocation.prototype.enable = function() {
	var me = this;

	var application = require("@nativescript/core").Application;

	application.on(application.suspendEvent, me._startAndroidService());
	application.on(application.exitEvent, me._startAndroidService());
	application.off(application.resumeEvent, me._stopAndroidService());

	var Permission = require('tns-mobile-data-collector').Permission;
			(new Permission()).requirePermissionFor(["backgroundlocation", "foregroundservice"]).then(function() {

			}).catch((err)=>{



			})

}


BackgroundMapLocation.prototype.disable = function() {
	var me = this;

	var application = require("@nativescript/core").Application;


	me._stopAndroidService()();

	application.off(application.suspendEvent, me._startAndroidService());
	application.off(application.exitEvent, me._startAndroidService());


}



BackgroundMapLocation.prototype._startAndroidService = function() {

	var me = this;
	if (!me._startAS) {
		me._startAS = (args) => {
			var Permission = require('tns-mobile-data-collector').Permission;
			(new Permission()).requirePermissionFor(["backgroundlocation", "foregroundservice"]).then(function() {

				require('../LocationIntentService');
				var application = require("@nativescript/core").Application;
				const context = application.android.context;
				const intent = new android.content.Intent(context, com.my.LocationIntentService.class);
				context.startForegroundService(intent);
				console.log("subscribed");


				application.on(application.resumeEvent, me._stopAndroidService());


			}).catch(console.error);
		};
	}

	return me._startAS;
}

BackgroundMapLocation.prototype._stopAndroidService = function() {
	var me = this;
	if (!me._stopAS) {
		me._stopAS = (args) => {
			try {

				require('../LocationIntentService');
				var application = require("@nativescript/core").Application;
				const context = application.android.context;
				const intent = new android.content.Intent(context, com.my.LocationIntentService.class);
				context.stopService(intent);
				console.log("stopped service");
			} catch (e) {
				console.error(e);
			}


			var fs = require("file-system");
			var folder = fs.knownFolders.temp();
			var path = fs.path.join(folder.path, "_mytrack.json");
			if (fs.File.exists(path)) {
				var file = fs.File.fromPath(path);
				file.readText().then(function(content) {
					console.log("read stored path");
					var locations = JSON.parse(content);
					if (_isArray(locations) && location.length > 0) {
						locations.forEach(me._addPointToTrack);
					}
					file.writeText('[]');
				});
			}


		};
	}

	return me._stopAS;

}


module.exports = BackgroundMapLocation;
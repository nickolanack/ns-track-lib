// I'm using toast to check that the service restarts once I close the app
const LocationResult = com.google.android.gms.location.LocationResult;


//com.pip3r4o.android.app.IntentService.extend("com.my.LocationIntentService", {
android.app.Service.extend("com.my.LocationIntentService", {

	onDestroy: function() {
		console.log('getting destroyed');
	},

	onCreate() {



		const mLocationRequest = new com.google.android.gms.location.LocationRequest();
		mLocationRequest.setInterval(10000);
		mLocationRequest.setFastestInterval(5000);
		mLocationRequest.setPriority(com.google.android.gms.location.LocationRequest.PRIORITY_HIGH_ACCURACY);

		mLocationRequest.setMaxWaitTime(60000);

		const channelId = "tracker_location";
		if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            let chan = new android.app.NotificationChannel(
            	channelId,
            	"Tracker App - Background Tracking", 
            	android.app.NotificationManager.IMPORTANCE_LOW);
		    let serviceManager = this.getSystemService(android.content.Context.NOTIFICATION_SERVICE);
		    serviceManager.createNotificationChannel(chan);
        } 



		const client = com.google.android.gms.location.LocationServices.getFusedLocationProviderClient(this);
		
		const builder = new android.app.Notification.Builder(this, channelId);
		let counter = 0;
		let points = 0;



		client.requestLocationUpdates(mLocationRequest, new(com.google.android.gms.location.LocationCallback.extend({
			onLocationResult: (locationResult) => {
				try {

					if (locationResult) {
						const list = locationResult.getLocations();
						points = points + list.size();
						let locations = [];



						for (let i = 0; i < list.size(); i++) {
							const loc = list.get(i);
							locations.push([
								loc.getLatitude(),
								loc.getLongitude(),
								loc.getAltitude(), {
									"speed": loc.getSpeed(),
									"timestamp": loc.getTime(),
									"direction": loc.getBearing(),
									"accuracy": {
										"horizonal": loc.getAccuracy(),
										"vertical": loc.getVerticalAccuracyMeters()
									}

								}
							])

						}



						this.updateNotification(builder, (points) + " Locations Tracked (" + (++counter) + ")");


						try {


							var knownFolders = require("@nativescript/core").knownFolders;
							var path = require("@nativescript/core").path;
							var File = require("@nativescript/core").File;


							var folder = knownFolders.temp();
							var pathName = path.join(folder.path, "_mytrack.json");
							var file = File.fromPath(pathName);
							file.writeText(JSON.stringify(locations));
						} catch (e) {
							console.error(e);
						}


						return;
					}


					this.updateNotification(builder, (counter++) + "");
				} catch (e) {
					console.error(e);
				}
			}
		})), null);



		this.setNotification(builder, "Recording locations in the background");



	},
	updateNotification: function(builder, msg) {
		builder.setContentText(msg);
		this.startForeground(1, builder.build());
	},
	setNotification: function(builder, msg) {
		const name = "Tracker App - Background Tracking";

		builder.setContentTitle("Your Track")
			.setAutoCancel(true)
			.setColor(android.R.color.holo_purple) //getResources().getColor(R.color.colorAccent))
			.setContentText(msg)
			.setVibrate([100, 200, 100])
			.setSmallIcon(android.R.drawable.ic_menu_mylocation);


		this.startForeground(1, builder.build());

	},
	onStartCommand: function(intent, flags, startId) {

		android.widget.Toast.makeText(this, "service starting", android.widget.Toast.LENGTH_SHORT).show();


		return android.app.Service.START_STICKY;
	},

	
})

module.exports = {}
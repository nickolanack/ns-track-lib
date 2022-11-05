onmessage = function(msg) {
    console.log("Received this message from the main thread: " + msg.data);



	const KmlReader=require('js-simplekml/KmlReader.js');
	const DOMParser=require('@xmldom/xmldom').DOMParser;


	(new (require('./KmlLoader').KmlLoader)()).fromPathOrUrl(msg.data).then((kmlContent) => {

					
		let jsonData=[];

		(new KmlReader(new DOMParser().parseFromString(kmlContent)))
		  .parseMarkers((point)=>{    
		  		point.type="marker";  
		        postMessage(point)
		  }).parseLines((line)=>{
		        postMessage(line);       
		  }).parsePolygons((poly)=>{
		        postMessage(poly);        
		  }).parseNetworklinks((link)=>{
		                
		  }).parseGroundOverlays((overlay)=>{
		                
		  });

		
	   // postMessage(jsonData);

	    close();

    }).catch((e) => {
		console.error("failed to parse kml");
		console.error(e);
	});

}


onerror = function(e) {
    console.log("Oh no! Worker thread error: " + e);
    return true;
}
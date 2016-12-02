var mc = require('mongodb').MongoClient;

mc.connect('mongodb://localhost/persistent-notes', function(err, db) {
	
var count = 0; //variable to keep track of criteria and/or projection
var fs = require("fs");

//to make sure not mare than 7 arguments are passed in
if (process.argv.length > 7) {
	console.log("Error: Too many arguments passed in");
	db.close();
	return;
}

//for loop retrieves respective arguments from command line
for (var i=0; i<process.argv.length; i++) {
	if (process.argv[i].indexOf("--o") > -1) { //cheking if output file name exits
		var outFile = process.argv[i]; //making variable and assigning argument passed in
		var fileSplit = outFile.split("="); //spliting the argument into an array
		var file = fileSplit[1]; //using the first element in the array as the file name
	}
	if (process.argv[i].indexOf("--m") > -1) {
		var maxCount = process.argv[i]; //done same as for file  
		var maxSplit = maxCount.split("="); //done same as for file
		var maxLimit = parseInt(maxSplit[1], 10); //done same as for file and parse to an integer for maxLimit
	}
	if (process.argv[i].indexOf(":") > -1) {
		count++; //incrementing count if criteria and/or projection are retrieved
	}
}

//if no criteria and projection are passed in...atleast criteria required
if (count == 0) {
	console.log("Error: either no arguments or criteria is not specified!");
	db.close();
	return;
} else if (count == 1) {  //if only criteria is passed in
	var criteria = process.argv[process.argv.length-1];  //making criteria variable from argument passed in
} else if (count == 2) {  //if both criteria and projection are passed in
	var criteria = process.argv[process.argv.length-2];  //done same as above
	var projection = process.argv[process.argv.length-1];  //done same as above for projection
} else { //if more than one criteria and projections are passed in
	console.log("Error: Pass either criteria and projection (optinal)");
	db.close();
	return;
}

	
var openBraces = "{";  
var closeBraces = "}"; 

/* below we add open and close braces if they are missing in the arguments passed in */
if (criteria[0] != openBraces) {		
	criteria = openBraces.concat(criteria);	
}

if (criteria[criteria.length-1] != closeBraces) {	
	criteria = criteria.concat(closeBraces);
}
if (projection != undefined) { //only if projection is defined we add braces
	if (projection[0] != openBraces) {	
		projection = openBraces.concat(projection);
	}
	if (projection[projection.length-1] != closeBraces) {		
	    projection = projection.concat(closeBraces);	
	}
}				

/*call-back function to write results to file or on the console if file name is not passed in*/
var addToFile = function(error, queryCollection) {
	if (error) {
	    console.log("Error..." + error);
	} else {
		if (queryCollection.length != 0) { //if array is empty (searching for something that doesn't exist
			for (i = 0; i < queryCollection.length; i++) {  //looping over array
				var data = JSON.stringify(queryCollection[i]) + "\n"; //converting elements of array into strings
				if (file == undefined) {  //if file name is not mentioned
					console.log(data);  // results are standard out to console
				} else {
					fs.appendFile(file, data, function (err) { //otherwise we write to file being passed in
						if (err) {
							console.log("Error..." + err);
						} else {
							console.log("Notes successfully added to: " + file);
						}
					});
				}
			}
		} else {
			console.log("Criteria: " + criteria  + " does not exist"); //for something that does not exist in notes database
		}
		db.close();
	}
}

var jsonCriteria = JSON.parse(criteria); //making criteria JSON object

//if max id not defined
 if (maxLimit == undefined ){
	 if(projection == undefined){ //if projection is also not passed in
		  var queryCollection = db.collection('notes').find(jsonCriteria).toArray(addToFile); //finding and passing in array w/o max and projection
	  } else {
		  var jsonProjection = JSON.parse(projection); //making projection JSON object
		  var queryCollection = db.collection('notes').find(jsonCriteria, jsonProjection).toArray(addToFile); //finding and passing in array w/o max only
	  }
	  //else doing the same as above for if max is defined
  } else {
	  if(projection == undefined){
		  var queryCollection = db.collection('notes').find(jsonCriteria).limit(maxLimit).toArray(addToFile);
	  } else {
		  var jsonProjection = JSON.parse(projection);
		  var queryCollection = db.collection('notes').find(jsonCriteria, jsonProjection).limit(maxLimit).toArray(addToFile);
	  }
  }
 
 });

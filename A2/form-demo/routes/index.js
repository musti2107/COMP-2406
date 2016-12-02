var express = require('express');
var router = express.Router();

var state = [];
var matcharr = [];   //array for the matches found
var debug = require('debug')('worker');   //debug from TUT#2

router.get('/', function(req, res, next) {
	debug('Rendering the main page');   //debug from TUT#2
 res.render('index', { title: 'COMP 2406 Simple form demo' });
});

router.post('/add', function(req, res) {
    var obj = { name: req.body.name,
		city: req.body.city,
                country: req.body.country,
                birthday: req.body.birthday,
                email: req.body.email, 
                phone: req.body.phone   //Part3. Phone object added to the form
                };
    state.push(obj);
    res.render('add', { title: 'Person just added', item: obj });
});

router.get('/list', function(req, res) {
    res.render('list', { title: 'People Listing',  items: state});
});

//for query
router.get('/query', function(req, res) {
    res.render('query', { title: 'What would you like to search for?'});
});

//for doquery
router.post('/doquery', function(req, res) {
/*ALL THE LOGIC NEEDED FOR PART4 */
	
	var search = (req.body.input).toLowerCase();   //search variable assigned to the text being input and beign searched for
	
		for (var i=0 ; i < state.length; i++){   //for loop going over the state array 
			for (var object in state[i]){   //for-each loop going over every object within the state array 
				
				//check variable assigned to every object being accessed in the state array
				//each object is converted to strings
				//each object-string and search-input is lowercased so that the search is case insensitive
				//indexOf will search all complete and partial substring being looked up
				
				var check = (JSON.stringify(state[i][object])).toLowerCase(); 
				
				if (check.indexOf(search) > -1){   //if the object-string completely or partially matches with search input				
					matcharr.push(state[i]);   //that specific item in state in pushed to the matcharr
					break;   //breaks and goes to the next item so that there is no repetition of results if more than one object matches in the same item
				};
			};
		};
		
    res.render('doquery', { title: 'Search Result for: ' + '"'+search+'"', items: matcharr }); //prints and represents the matcharr of results
    matcharr = [];   //match array is emptied after each result is printed so that old results are not mixed new results
});

module.exports = router;

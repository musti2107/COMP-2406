var express = require('express');
var router = express.Router();
var mongodb = require('mongodb');
var mc = mongodb.MongoClient;
var ObjectID = mongodb.ObjectID;

var notesCollection;

var connectToDBs = function(callback) {
    mc.connect('mongodb://localhost/persistent-notes', function(err, db) {
	if (err) {
	    throw err;
	}
	
	notesCollection = db.collection('notes');

	if (callback) {
	    callback();
	}
    });
}

// connect to DB when file is loaded
connectToDBs();

router.get('/', function(req, res) {
    if (req.session.username) {
        res.redirect("/notes");
    } else {
	res.render('index', { title: 'COMP 2406 Persistent Notes Demo', 
			      error: req.query.error });
    }
});

router.get('/notes', function(req, res) {
    var username = req.session.username;

    var renderNotes = function(err, notes) {
	if (err) {
	    notes = [];
	}
	res.render("notes.jade", {username: username,
				  title: username +"'s Notes",
				  userNotes: notes,
				  error: req.query.error});
    }
    
    if (username) {
	notesCollection.find({owner: username}).toArray(renderNotes);
    } else {
	res.redirect("/?error=Not Logged In");
    }
});

router.post('/login', function(req, res) {
    var username = req.body.username;
    req.session.username = username;

    res.redirect("/notes")
});

router.post('/logout', function(req, res) {
    req.session.destroy(function(err){
        if (err) {
            console.log("Error: %s", err);
        }
    });
    res.redirect("/");
});

router.get('/edit/:id', function(req, res) {
    var username = req.session.username;
    var id = ObjectID(req.params.id);
    var note;

    var renderEditor = function(err, note) {
	if (err) {
	    res.redirect("/notes?error=Unknown Note to Edit");
	} else {
	    res.render("edit.jade", {title: "Edit Note",
				     note: note});
	}
    }
     
    if (username) {
	notesCollection.findOne({_id: id}, renderEditor)
    } else {
	res.redirect("/?error=Not Logged In");
    }
});

//Q3. Delete note
router.get('/delete/:id', function(req, res) {
    var username = req.session.username;
    var id = ObjectID(req.params.id);
    var note;

    var confirmDelete = function(err, note) {
	if (err) {
	    res.redirect("/notes?error=Unknown Note to Edit");
	} else {
	    res.render("delete.jade", {title: "Do you wish this note deleted?  ",
				     note: note});
	  }
    }
    if (username) {
	  notesCollection.findOne({_id: id}, confirmDelete)
    } else {
	res.redirect("/?error=Not Logged In");
    }
});

//Q3. Delete note
router.post('/delete/:id', function(req, res) {
    var username = req.session.username;
    var id = ObjectID(req.params.id);
    var done;

    var checkSuccess = function(err, note) {
		if (err) {
			done = false;
			res.redirect("success.jade", {title: "Delete Failed", done: done});

		} else {
			done = true;
			res.render("success.jade", {title: "Delete Successful", done: done});
		}
    }
     
    if (username) {
		notesCollection.remove({_id: id}, checkSuccess)
	} else {
		res.redirect("/?error=Not Logged In");
    }
});

//Q5. changeusername
router.get('/changeusername', function(req, res) {
    var username = req.session.username;
    var note;

	    res.render("changeusername.jade", {title: "What is your new username? ",
				     error: req.query.error});
});

//Q5. changeusername
router.post('/changeusername', function(req, res) {
    var username = req.session.username;
    var newUsername = req.body.username;
    var done;

    var newName = notesCollection.find({owner: newUsername}).count(function(err, newName) {
		if (err) {
			done = false;
			res.redirect("success.jade", {title: "Change username Failed", done: done});
		} else {
			if (newName === 0) {
				var n = notesCollection.find({owner: username}).count(function(err, count) {
					for (i = 0; i < count; i++) {
						notesCollection.update({owner : username}, { $set: {owner : newUsername} }, {w : 0})
					}
				});
				req.session.username = req.body.username;
				done = true;
				res.render("success.jade", {title: "Change username Successful", done: done});
			}
			else {
				res.render("success.jade");
			}
		}
	});
});

router.post('/update', function(req, res) {
    var username = req.session.username;
    var id = ObjectID(req.body.id);
    var noteTitle = req.body.title;
    var content = req.body.content;
    
    var resultsPage = function(status) {
	res.render("updated.jade", {title: status,
				    noteTitle: noteTitle});	
    }

    var checkUpdate = function(err, result) {
	if (err) {
	    resultsPage("Update Failed");
	} else {
	    resultsPage("Update Succeded");
	}
    }
    
    if (username) {
	notesCollection.update({_id: id},
			       {$set: {title: noteTitle,
				       content: content}},
			       checkUpdate);
    } else {
	res.redirect("/?error=Not Logged In");
    }
});

router.post('/new', function(req, res) {
    var username = req.session.username;
    var nextNote, note;

    var reportInserted = function(err, notesInserted) {
	if (err) {
	    res.redirect("/notes?error=Could not create a new note");
	} else {
	    res.redirect("/edit/" + notesInserted[0]._id);
	}
    }

    if (username) {
	newNote = {title: "Untitled",
		   owner: username,
		   content: "No content"};

	notesCollection.insert(newNote, reportInserted);
    } else {
	res.redirect("/?error=Not Logged In");
    }
});

module.exports = router;

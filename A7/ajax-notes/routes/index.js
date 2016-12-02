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
        res.render('index', { title: 'COMP 2406 AJAX Notes Demo', 
                              error: req.query.error });
    }
});

router.get('/notes', function(req, res) {
    var username = req.session.username;

    if (username) {
        res.render("notes.jade", {username: username,
                                  title: username +"'s Notes"});
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

router.get('/getNotes', function(req, res) {
    var username = req.session.username;

    var renderNotes = function(err, notes) {
        if (err) {
            notes = [{"title": "Couldn't get notes",
                      "owner": username,
                      "content": "Error fetching notes!"}];
        }
        res.send(notes);
    }
    
    if (username) {
        notesCollection.find({owner: username}).toArray(renderNotes);
    } else {
        res.send([{"title": "Not Logged In",
                   "owner": "None",
                   "content": "Nobody seems to be logged in!"}]);
    }    
});

router.post('/updateNote', function(req, res) {
    var username = req.session.username;
    var id = req.body.id;
    var title = req.body.title;
    var content = req.body.content;
    
    var checkUpdate = function(err, result) {
        if (err) {
            res.send("ERROR: update failed");
        } else {
            res.send("update succeeded");
        }
    }
    
    if (username) {
        if (id && title && content) {
            // should get note and check 
            // if it really belongs to the current user
            notesCollection.update({_id: ObjectID(id)},
                                   {$set: {title: title,
                                           content: content}},
                                   checkUpdate);
        } else {
            res.send("ERROR: bad parameters");
        }
    } else {
        res.send("ERROR: not logged in");
    }
});

//Delete note Q1.

router.post('/deleteNote', function(req, res) {
    var username = req.session.username;
    var id = ObjectID(req.body.id);
    
    var checkDelete = function(err, result) {
        if (err) {
            res.send("ERROR: note not deleted");
        } else {
            res.send("note deleted");
        }
    }
    
    if (username) {
        if (id) {
            notesCollection.remove({_id: id}, checkDelete);
        } else {
            res.send("ERROR: bad parameters");
        }
    } else {
        res.send("ERROR: not logged in");
    }
});

//Change username Q3.

router.post('/changeusername', function(req, res) {
    var oldUsername = req.session.username;
	var newUsername = req.body.newUsername;
	
    var confirmName = function(err, result) {
		if (err) {
			res.send("ERROR: Change failed");
		} else {
			if (result){
				res.send("ERROR: username already taken");
			}
			else{
				notesCollection.update(
						{owner: oldUsername},
						{$set: {owner: newUsername}},
						{ multi: true },
						confirmUpdate);
			}	
		}
    }    
    
    var confirmUpdate = function(err, result) {
		if (err) {
			res.send("ERROR: Change failed");
		} else {
			req.session.username = newUsername;
			res.send("username changed");
		}
    }
    
    if (oldUsername) {
		notesCollection.findOne({owner: newUsername}, confirmName);
    } else {
		res.send("ERROR: not logged in");
    }    
});

router.post('/newNote', function(req, res) {
    var username = req.session.username;
    var newNote;

    var reportInserted = function(err, notesInserted) {
        if (err) {
            res.send("ERROR: Could not create a new note");
        } else {
            res.send(notesInserted[0]._id);
        }
    }

    if (username) {
        newNote = {title: "Untitled",
                   owner: username,
                   content: "No content"};

        notesCollection.insert(newNote, reportInserted);
    } else {
        res.send("ERROR: Not Logged In");
    }
});


module.exports = router;

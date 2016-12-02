$(function() {
	
    var insertNotesIntoDOM = function(userNotes) {
        var i;

        $(".notes").remove();
        for (var i=0; i < userNotes.length; i++) {
			//calling function to escape html tags and make links
			var content = escapeStuff(userNotes[i].content);
			
            console.log("Adding note " + i);
            $("#notesList").append('<li class="notes"> <div>' + 
                                   userNotes[i].title + ": " +
                                   '<button type="button" class="editButton"' +
				   'id="edit' + i + '">' + '[edit]</button>' +
                                   '<p>' + content + '</p>' +
                                   "</li>");
            $("#edit" + i).click(userNotes[i], editNote);
        }
        
			
    }

    var getAndListNotes = function() {
        $.getJSON("/getNotes", insertNotesIntoDOM);
    }
    
    //change username Q3. - makes changes on the pages
    var updateUsernameOnPages = function(result){
		if(result.substring(0,5) != "ERROR"){
			var newUsername = $("#username").val(); 
			$("#header").replaceWith("<h1 id='header'>"+ newUsername +"'s Account</h1>");
			$("#welcome").replaceWith("<p id='welcome'>Welcome "+ newUsername +"</p>");
			$("#title").replaceWith("<title id='title'>"+ newUsername +"'s notes</title>");
			noteListing();
		}else{
			$(".error").replaceWith("<p class='error'>"+result+"</p>");
			noteListing();
		}
	}
	
	//change username Q3. - changes on the database
    var changeUsernameOnServer = function(){
		var newUsername = $("#username").val(); 
		$.post("/changeusername",
               {"newUsername": newUsername},
               updateUsernameOnPages);       
	}
	
	//function to escape html tags and make links Q1.
	var escapeStuff = function (str) {
		var c = String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/, '&quot;');	
		if (c.indexOf("[") > -1) {
			var result ="";
			for (var i = 0; i < c.length; i++) {
				if (c[i] == "[") {
					var open = i;
					var close = c.indexOf(']',i);
					var url = c.substring(open+1, close);
					var array = url.split(" ");
					var link = array[0];
					if (array.length > 2) {
						var label = array.splice(1).join(" ");
						result = '<a href="' + link + '"> ' + label + "</a>";
						i = close;
					} else if (array.length == 2) {
						var label = array[1]
						result = '<a href="' + link + '"> ' + label + "</a>";
						i = close;
					} else {
						result = '<a href="' + link + '"> ' + link + "</a>";
						i = close;
					}
				}
				else if (c.indexOf('[', i) > -1) {
					var open = c.indexOf('[', i);
					var close = c.indexOf(']', i);
					var text = c.substring(i, open);
					result += text;
					var url = c.substring(open+1, close);
					var array = url.split(" ");
					var link = array[0];
					if (array.length > 2) {
						var label = array.splice(1).join(" ");
						result += '<a href="' + link + '"> ' + label + "</a>";
						i = close;
					} else if (array.length == 2) {
						var label = array[1]
						result += '<a href="' + link + '"> ' + label + "</a>";
						i = close;
					} else {
						result += '<a href="' + link + '"> ' + link + "</a>";
						i = close;
					}
				}
				else {
					var text = c.substring(i, c.length);
					result+=text;
					break;
				}
				if (i >= c.length-1) {
					break;
				}
			}
			return result;
		}
		else {
			return c;
		}
	}
		

    var updateNoteOnServer = function(event) {
        var theNote = event.data;
        theNote.title = $("#noteTitle").val();
        theNote.content = $("#noteContent").val();
        noteListing();
        $.post("/updateNote",
               {"id": theNote._id,
                "title": theNote.title,
                "content": theNote.content},
               getAndListNotes);
    }
    
    //delete note Q1.    
    var deleteNoteOnServer = function(event) {
		var theNote = event.data;
        theNote.title = $("#noteTitle").val();
        //confirmation with id on it
        if (window.confirm("Delete note: " + theNote.title + " ?")) {
          $.post("/deleteNote",
               {"id": theNote._id},                
               getAndListNotes);
		}
		   		   
		noteListing();
    }
    
    var editNote = function(event) {
        var theNote = event.data;

        $(".notesArea").replaceWith('<div class="notesArea" ' +
                                    'id="editNoteDiv"></div>');
        $("#editNoteDiv").append('<h2>Edit Note</h2>');

        $("#editNoteDiv").append('<div><input type="text" ' +
                                 'id="noteTitle"></input></div>');
        $("#noteTitle").val(theNote.title);

        $("#editNoteDiv").append('<div><textarea cols="40" rows="5" ' +
                                 'id="noteContent" wrap="virtual">' +
                                 '</textarea></div>');
        $("#noteContent").val(theNote.content);


        $("#editNoteDiv").append('<button type="button" id="updateNote">' +
                                 'Update</button>')
        $("#updateNote").click(theNote, updateNoteOnServer);

        $("#editNoteDiv").append('<button type="button" id="cancelUpdate">' +
                                 'Cancel</button>')
        $("#cancelUpdate").click(noteListing);
        
        //delete note button with id=delete
        $("#editNoteDiv").append('<button type="button" id="delete">' +
                                 'Delete</button>')
        $("#delete").click(theNote, deleteNoteOnServer);
    }
    
    var editNewNote = function(result) {
        var theNote = {"title": "",
                       "content": ""};

        if (result.indexOf("ERROR") == -1) {
            theNote._id = result;
            editNote({data: theNote});  //faking event object
        } else {
            // report that we couldn't create a note        
            noteListing();
        }
    }

    var newNote = function() {
        $.post("/newNote", editNewNote);
    }
    
    //How the name change looks with buttons with respective id's
    var editName = function(event) {
                
        $(".notesArea").replaceWith('<div class="notesArea" ' +
                                    'id="changeName"></div>');
        $("#changeName").append('<h2>Please type in a new username :</h2>');

        $("#changeName").append('<div><input type="text" ' +
                                 'id="username"></input></div>');                                 

        $("#changeName").append('<button type="button" id="doChangeUsername">' +
                                 'Change Username</button>')
        $("#doChangeUsername").click(changeUsernameOnServer);

        $("#changeName").append('<button type="button" id="cancelUsernameChange">' +
                                 'Cancel</button>')
        $("#cancelUsernameChange").click(noteListing);
        
    }
    
    var noteListing = function() {
        $(".notesArea").replaceWith('<div class="notesArea" ' +
                                    'id="listNotesDiv">');

        $("#listNotesDiv").append('<h2>Notes</h2>');
        $("#listNotesDiv").append('<ul id="notesList">' +
                                  '<li class="notes">Loading Notes...</li>' +
                                  '</ul>');

        $("#listNotesDiv").append('<button id="newNote" type="button">' +
                                  'New Note</button>');
        $("#newNote").click(newNote);

        $("#listNotesDiv").append('<button id="refreshNotes" type="button">' +
                                  'Refresh</button>');
        $("#refreshNotes").click(getAndListNotes);
        
        //changeusername button        
        $("#listNotesDiv").append('<button id="changeusername" type="button">' +
                                  'Change Username</button>');
        $("#changeusername").click(editName);
        
        

        getAndListNotes();
    }

    noteListing();
});

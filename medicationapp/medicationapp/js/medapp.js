var db = window.openDatabase("MedicationDB", "", "Medication Database", 1024 * 1000);
var NULL = "NULL";
var testingInBrowser = false;  // set to true if testing in browser to avoid using cordova (phone only)
var deleteOldTables = false;   // set to true to start with a new database

$(document).bind('mobileinit', function() {  // this just avoids an error when building app
    $.mobile.pushStateEnabled = false;
});

/// Initialize database tables, popups, and buttons
function init() {

    createDBTables();   // creates the SQL databases if they do not exist

    // load XML data into SQL databases. 
    // This function first checks if count!=0 before loading data
    // to avoid filling the tables if they already exist.
    loadXMLData("Drugs", checkIfTableFilled);
 	loadXMLData("DrugBrand", checkIfTableFilled); 	
 	loadXMLData("Interaction", checkIfTableFilled);

    loadTable();
    $("#AddMedicationWindow").popup();
    $("#AddMedicationWindow").popup("option", "dismissible", false);
    $("#AddMedicationWindow").popup("option", "transition", "pop");
    $("#EditMedicationWindow").popup();
    $("#EditMedicationWindow").popup("option", "dismissible", false);
    $("#EditMedicationWindow").popup("option", "transition", "pop");
    $("#MedicationInfoWindow").popup();
    $("#MedicationInfoWindow").popup("option", "dismissible", false);
    $("#MedicationInfoWindow").popup("option", "transition", "pop");

    $("#addMedButton").on("click", function() {
        displayDialog('AddMedicationWindow', null);
    });
    $("#SubmitMedButton").on("click", function() {
        closeDialog('AddMedicationWindow');
    });
    $("#SubmitMedEditButton").on("click", function() {
        closeDialog('EditMedicationWindow');
    });
    $("#InfoDoneButton").on("click", function(){
    	closeDialog('MedicationInfoWindow');
    });

}

// load the table that the user sees on the home screen
function loadTable() {
    db.transaction(function(tx) {
        tx.executeSql("SELECT * FROM Prescription", [], function(tx, rs) {
            var medName;
            var scriptNumber;
            var medDose;
            var time;
            var frequencyNumber;
            var frequencyUnits;
            var frequency;
            for (var i = 0; i < rs.rows.length; i++) {
                // Parse info
                medName = rs.rows[i].DrugName;
                scriptNumber = rs.rows[i].PrescriptionNumber;
                medDose = rs.rows[i].Dose;
                time = rs.rows[i].Time;
                frequencyNumber = rs.rows[i].FrequencyNumber;
                frequencyUnits = rs.rows[i].FrequencyUnit;
                addMedToTable('MedicationListTable', scriptNumber, medName, medDose, frequencyNumber, frequencyUnits);
                addNewNotification(scriptNumber, medName, medDose, time, frequencyNumber, frequencyUnits);
            }
        }, function(tx, error) {
            alert(error.message);
        });
    });
}

// ----- FUNCTIONS FOR CREATING AND FILLING DATABASE TABLES -----//

function createDBTables() { // create database tables if they do not already exist
    db.transaction(function(tx) {
        if (deleteOldTables) {
            tx.executeSql("DROP TABLE Users;");
            tx.executeSql("DROP TABLE Pharmacy;");
            tx.executeSql("DROP TABLE Drugs;");
            tx.executeSql("DROP TABLE Prescription;");
        }
        
        tx.executeSql("CREATE TABLE IF NOT EXISTS Pharmacy (PharmacyID VARCHAR(15) NOT NULL PRIMARY KEY, Name VARCHAR(256) NOT NULL, Phone VARCHAR(15) NOT NULL, Address VARCHAR(256));");
        tx.executeSql("CREATE TABLE IF NOT EXISTS Prescription (PrescriptionNumber VARCHAR(20) NOT NULL PRIMARY KEY, DrugName VARCHAR(100) NOT NULL REFERENCES Drugs(Name), FilledAt VARCHAR(15), Dose VARCHAR(10) NOT NULL, Time, FrequencyNumber VARCHAR(10), FrequencyUnit VARCHAR(10), RefillDate VARCHAR(50), RefillsLeft INTEGER, ConflictsWith VARCHAR(100));");
        
        tx.executeSql("CREATE TABLE IF NOT EXISTS Drugs (drugID VARCHAR(7) NOT NULL PRIMARY KEY, drugName VARCHAR(50) NOT NULL UNIQUE, drugDescription VARCHAR(5000), toxicity VARCHAR(7000));",[], function(tx,rs){}, function(tx,error){
        	alert(error.message);
        });
        tx.executeSql("CREATE TABLE IF NOT EXISTS DrugBrand (brandName VARCHAR(50) NOT NULL PRIMARY KEY, genericName VARCHAR(50) REFERENCES Drugs(drugName));");
        tx.executeSql("CREATE TABLE IF NOT EXISTS Interaction(drugName VARCHAR(50) NOT NULL REFERENCES Drugs(drugName), Interaction_drugName VARCHAR(50) NOT NULL REFERENCES Drugs(drugName), interactionDescription VARCHAR(5000), PRIMARY KEY(drugName, Interaction_drugName));",[],function(tx,rs){},function(tx,error){alert(error.message);});

    });
}

function loadXMLData(table, callback){   // count how many entries already in table, send to callback function to process
	db.transaction(function(tx){
		tx.executeSql("SELECT COUNT(*) AS count FROM "+table, [], function(tx, rs){
			count = rs.rows[0].count;
			callback(table, count);
		}, function(tx, error){
			alert(error.message);
		});
	});
}

function checkIfTableFilled(table, count){  // receive table and count from loadXML data. If table was empty, load with XML data
	if(count==0){
		switch (table){
			case "DrugBrand":
				loadDrugBrand();
				break;
			case "Drugs":
				loadDrugs();
				break;
			case "Interaction":
				loadInteraction();
				break;
			default:
				break;
		}
	}

}


function loadDrugBrand(){   // load XML data into DrugBrand table

	var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            var xmlDoc = xhttp.responseXML;
            var brandName = xmlDoc.getElementsByTagName('brandName');
            var genericName = xmlDoc.getElementsByTagName('genericName');

            var alreadyExists = false;
            db.transaction(function(tx){
            	for (i = 0; i< brandName.length; i++){
            		var b = brandName[i].childNodes[0].nodeValue;
            		
            		tx.executeSql("SELECT brandName FROM DrugBrand WHERE brandName = ?", [brandName[i].childNodes[0].nodeValue], function(tx,rs){
            			if(rs.rows.length>0){
            				alreadyExists = true;
            			}else{
            				alreadyExists = false;
            			}
            		}, function(tx,error){
            			alert(error.message);
            		});
            		if(alreadyExists==false){

			             tx.executeSql("INSERT INTO DrugBrand VALUES (?, ?)", [brandName[i].childNodes[0].nodeValue, genericName[i].childNodes[0].nodeValue], function(tx,rs){}, function(tx,error){
			              	         	
			              });
			        }
	            }
            });
        }
    };
    
    xhttp.open("GET", "js/data/DrugbBrand_table2.xml", true);  // location of xml data for DrugBrand
    xhttp.send();
}

   function loadDrugs(){    // load XML data for Drugs table
   		var xhttp = new XMLHttpRequest();
       	xhttp.onreadystatechange = function() {
           if (xhttp.readyState == 4 && xhttp.status == 200) {
               var xmlDoc = xhttp.responseXML;
               var drugID = xmlDoc.getElementsByTagName('drugID');
               var drugName = xmlDoc.getElementsByTagName('drugName');
               var drugDescription = xmlDoc.getElementsByTagName('drugDescription');
               var toxicity = xmlDoc.getElementsByTagName('toxicity');

               var toxicity_i;
               var drugDescription_i;

               db.transaction(function(tx){
	               for (i = 0; i < drugID.length; i++){
	               		if(toxicity[i].childNodes[0]!=null){
	               			toxicity_i = toxicity[i].childNodes[0].nodeValue;
	               		}else{
	               			toxicity_i = NULL;
	               		}

	               		if(drugDescription[i].childNodes[0]!=null){
	               			drugDescription_i = drugDescription[i].childNodes[0].nodeValue;
	               		}else{
	               			drugDescription_i = NULL;
	               		}

	                   tx.executeSql("INSERT INTO Drugs VALUES (?, ?, ?, ?);", [drugID[i].childNodes[0].nodeValue, drugName[i].childNodes[0].nodeValue, drugDescription_i, toxicity_i]);
	               }
	           });
           }
        };
       
       xhttp.open("GET", "js/data/Drugs_table.xml", true);  // location of xml data for Drugs
       xhttp.send();
   }

    function loadInteraction(){   // load XML data for Interaction table
    	var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
           if (xhttp.readyState == 4 && xhttp.status == 200) {
               var xmlDoc = xhttp.responseXML;
               var drugName = xmlDoc.getElementsByTagName('drugName');
               var Interaction_drugName = xmlDoc.getElementsByTagName('Interaction_drugName');
               var interactionDescription = xmlDoc.getElementsByTagName('interactionDescription');

               db.transaction(function(tx){
	               for (i = 0; i < drugName.length; i++){
	               		var name = drugName[i].childNodes[0].nodeValue;
	               		var interactionName = Interaction_drugName[i].childNodes[0].nodeValue;
	               		var description = interactionDescription[i].childNodes[0].nodeValue;
	          
	                   tx.executeSql("INSERT INTO Interaction VALUES (?, ?, ?);", [name, interactionName, description], function(tx, rs){
	                 
	                   }, function(tx, error){
	                   		//alert(error.message);
	                   });
	               }
	            });
           }
       	};
       
       xhttp.open("GET", "js/data/Interaction_table.xml", true);  // location of xml data for Interaction
       xhttp.send();
   }

// ----- FUNCTIONS TO FILL, DISPLAY, AND CLEAR DIALOGS/POPUPS -----//

function displayDialog(dialog, scriptNumber) {  // Display the given dialog, filled with info for the script number (if applicable)
	fillDialog(dialog, scriptNumber);
    $("#" + dialog).popup("open");
}

function closeDialog(dialog) {   // Handle input that was entered into dialog, close it, and clear the data for next time
    handleInput(dialog);
    $("#" + dialog).popup("close");
    clear(dialog);
}

function fillDialog(dialog, scriptNumber){  // fill the given dialog with the info for the given script number
	switch (dialog){
		case 'EditMedicationWindow':
			db.transaction(function(tx) {
				tx.executeSql("SELECT * FROM Prescription WHERE PrescriptionNumber = ?", [scriptNumber], function(tx, rs) {
		            var medName;
		            var medDose;
		            var time;
		            var frequencyNumber;
		            var frequencyUnits;
		            var frequency;
		            var refillDate;
		        
		            // Parse info
		            medName = rs.rows[0].DrugName;
		            medDose = rs.rows[0].Dose;
		            time = rs.rows[0].Time;
		            frequencyNumber = rs.rows[0].FrequencyNumber;
		            frequencyUnits = rs.rows[0].FrequencyUnit;
		            refillDate = rs.rows[0].RefillDate;

		            $("#editMedName").val(medName);
					$("#editPrescriptionNumber").val(scriptNumber); 
					$("#editMedDose").val(medDose);
					$("#edit_Frequency_Number").val(frequencyNumber);
					/*$("#edit_Frequency_TimeUnit").selected(frequencyUnits);*/  // this was causing an error
					$("#editStartTime").val(time); 
					$("#editRefillDate").val(refillDate);              

		        }, function(tx, error) {
		            alert(error.message);
		        });
		    });
			break;

		case 'MedicationInfoWindow':   // display all the info we have
			var medName;
			var medDose;
            var time;
            var frequencyNumber;
            var frequencyUnits;
            var frequency;
            var genericName;
            var sideEffects = "";
            var interactions = "";
		        
			db.transaction(function(tx) {   // get prescription info for given prescription number
				tx.executeSql("SELECT * FROM Prescription WHERE PrescriptionNumber = ?", [scriptNumber], function(tx, rs) {
		            
		            // Parse info
		            medName = rs.rows[0].DrugName;
		            medDose = rs.rows[0].Dose;
		            time = rs.rows[0].Time;
		            frequencyNumber = rs.rows[0].FrequencyNumber;
		            frequencyUnits = rs.rows[0].FrequencyUnit;
		            refillDate = rs.rows[0].RefillDate;


		            $("#info_medNameHeading").html(medName);
		            $("#info_name").html(medName);
		            $("#info_genericName").html("");
					$("#info_scriptNumber").html(scriptNumber); 
					$("#info_dose").html(medDose);
					$("#info_frequency").html("Every " + frequencyNumber + " " + frequencyUnits);
					$("#info_startTime").html(time);
					$("#info_refillDate").html(refillDate);   
					
				});
			});
			db.transaction(function(tx){  // get generic name from given brand name (needed to look up drug info)
				tx.executeSql("SELECT genericName FROM DrugBrand WHERE brandName = ?", [medName], function(tx, rs) {
		           
		            // Parse info
		            if(rs.rows.length>0)
		            	genericName = rs.rows[0].genericName;
		           	else
		           		genericName = medName;
		           	$("#info_genericName").html(genericName);
		        }, 
		        function(tx, error) {
		            alert(error.message);
		        });
		       
		    });

		    db.transaction(function(tx){  // get toxicity (side effects) about drug
		    	tx.executeSql("SELECT toxicity FROM Drugs WHERE drugName = ?", [genericName], function(tx,rs){
		    		
		    		if(rs.rows.length>0){
		    			sideEffects = rs.rows[0].toxicity;
		    		}

		    		$("#info_sideEffects").html(sideEffects);

		    	},
		    	function(tx, error){
		    		alert(error.message);
		    	});
		    });

		    db.transaction(function(tx){  // get interactions for this drug

		    	tx.executeSql("SELECT Interaction_drugName FROM Interaction WHERE drugName = ?", [genericName], function(tx,rs){

		    		for(var i=0; i<rs.rows.length; i++){
		    			interactions = interactions + (rs.rows[i].Interaction_drugName);
		    			if(i < rs.rows.length-1){
		    				interactions = interactions + ", ";
		    			}
		    		}
		    		$("#info_interactions").html(interactions); 

		    	}, function(tx, error){
		    		alert(error.message);
		    	});
		    });
			break;
		case 'AddMedicationWindow':   // we want this to be empty so that the user can add new info
		default:
			break;
	}
}

function clear(dialog) {  // clear fields or reset to base values
    switch (dialog) {
        case 'AddMedicationWindow':
            $('.addMedInput').val("");
            $('#Frequency_Number').val("1");
            $("#Frequency_Day").attr("selected", true);
            document.getElementById("Frequency_Day").selected = "selected";
            break;
        case 'EditMedicationWindow':
            $('.editMedInput').val("");
            $('#edit_Frequency_Number').val("1");
            $("#edit_Frequency_Day").attr("selected", true);
            document.getElementById("edit_Frequency_Day").selected = "selected";
            break;
        default:
            break;
    }
}

function handleInput(dialog) {  // take info from dialog and send it to appropriate functions
    switch (dialog) {
        case 'AddMedicationWindow':
            var medName = document.getElementById('newMedName').value;
            var medDose = document.getElementById('newMedDose').value;
            var medScriptNumber = document.getElementById('newPrescriptionNumber').value;
            var medFreqNumber = document.getElementById('Frequency_Number').value;
            var medFreqUnits = document.getElementById('Frequency_TimeUnit').value;
            var time = document.getElementById('newMedStartTime').value;
            var refillDate = document.getElementById('newMedRefillDate').value;

            addMedToTable('MedicationListTable', medScriptNumber, medName, medDose, medFreqNumber, medFreqUnits);
            addMedToDatabase(medScriptNumber, medName, medDose, time, medFreqNumber, medFreqUnits, refillDate);
            addNewNotification(medScriptNumber, medName, medDose, time, medFreqNumber, medFreqUnits, refillDate);
            break;

        case 'EditMedicationWindow':
            var medName = document.getElementById('editMedName').value;
            var medDose = document.getElementById('editMedDose').value;
            var medScriptNumber = document.getElementById('editPrescriptionNumber').value;
            var medFreqNumber = document.getElementById('edit_Frequency_Number').value;
            var medFreqUnits = document.getElementById('edit_Frequency_TimeUnit').value;
            var time = document.getElementById('editStartTime').value;
            var refillDate = document.getElementById('newMedRefillDate').value;
            editMedTable('MedicationListTable', medScriptNumber, medName, medDose, medFreqNumber, medFreqUnits);
            editMedInDatabase(medScriptNumber, medName, medDose, time, medFreqNumber, medFreqUnits, refillDate);
            editNotification(medScriptNumber, medName, medDose, time, medFreqNumber, medFreqUnits, refillDate);
            break;

        default:
            break;
    }
}


function deleteMedication(scriptNumber){ // call all functions necessary to delete prescription
	deleteMedFromDatabase(scriptNumber);
	deleteMedFromTable(scriptNumber);
	deleteNotification(scriptNumber);
}

// ----- FUNCTIONS TO ADD, UPDATE, OR DELETE FROM DATABASE ----- //

// NOTE: A few values are still hard-coded because their functions have not yet been implemented
function addMedToDatabase(medScriptNumber, medName, medDose, time, medFreqNumber, medFreqUnits, refillDate) {
    db.transaction(function(tx) {
        tx.executeSql("INSERT INTO Prescription VALUES (?,?,?,?,?,?,?,?,?,?);", [medScriptNumber, medName, '1234', medDose, time, medFreqNumber, medFreqUnits, refillDate, '2', 'Alcohol'], function(tx,rs){}, function(tx,error){
        	alert(error.message);
        });
    });
}

function editMedInDatabase(medScriptNumber, medName, medDose, time, medFreqNumber, medFreqUnits, refillDate) { // THIS DOESN'T WORK. Bad SQL. Need to determine how to handle updates.
    db.transaction(function(tx) {
        tx.executeSql("UPDATE Prescription SET DrugName=?, FilledAt=?, Dose=?, Time=?, FrequencyNumber=?, FrequencyUnit=?, RefillDate=?, RefillsLeft=?, ConflictsWith=? WHERE PrescriptionNumber = ?;", [medName, '1234', medDose, time, medFreqNumber, medFreqUnits, refillDate, '2', 'Alcohol', medScriptNumber], function(tx, rs) {}, function(tx, error) {
            alert(error.message);
        });
    });
}

function deleteMedFromDatabase(scriptNumber){
	db.transaction(function(tx) {
		tx.executeSql("DELETE FROM Prescription WHERE PrescriptionNumber = ?", [scriptNumber], function(tx, rs) {}, function(tx, error) {
            alert(error.message);
        });
	});
}


// ----- FUNCTIONS TO ADD, EDIT, OR DELETE INFO IN THE TABLE THE USER SEES IN THE APP ----- //

function addMedToTable(tableBody, scriptNumber, medName, medDose, medFreqNumber, medFreqUnits) {
    var table = document.getElementById(tableBody);
    var newRow = document.createElement('tr');
    newRow.id = "row_" + scriptNumber;
    table.appendChild(newRow);

    var medInfoCell = document.createElement('td');
    var newInfoButton = document.createElement('a');
    newInfoButton.id = "info" + scriptNumber;
   $(newInfoButton).buttonMarkup({
        icon: "info",
        inline: true,
        iconpos: "notext"
    });
    $(newInfoButton).on("click", function() {
        var button = this.id;
        var scriptNumber = button.substring(4);
        displayDialog('MedicationInfoWindow', scriptNumber);
    });
    medInfoCell.appendChild(newInfoButton);
	$(medInfoCell).css("width", "10%");
    newRow.appendChild(medInfoCell);

    var medEditCell = document.createElement('td');
    var newEditButton = document.createElement('a');
    newEditButton.id = "edit" + scriptNumber;
    $(newEditButton).buttonMarkup({
        icon: "edit",
        inline: true,
        iconpos: "notext"
    });
    $(newEditButton).on("click", function() {
        var button = this.id;
        var scriptNumber = button.substring(4);
        displayDialog('EditMedicationWindow', scriptNumber);
    });
    medEditCell.appendChild(newEditButton);
    $(medEditCell).css("width", "10%");
    newRow.appendChild(medEditCell);

    var medDeleteCell = document.createElement('td');
    var newDeleteButton = document.createElement('a');
    newDeleteButton.id = "delete" + scriptNumber;
    $(newDeleteButton).buttonMarkup({
        icon: "delete",
        inline: true,
        iconpos: "notext"
    });
    $(newDeleteButton).on("click", function() {
        var button = this.id;
        var scriptNumber = button.substring(6);
        deleteMedication(scriptNumber);
    });
    medDeleteCell.appendChild(newDeleteButton);
    $(medDeleteCell).css("width", "10%");
    newRow.appendChild(medDeleteCell);

    
    var medNameCell = document.createElement('td');
    $(medNameCell).css("width", "70%");
    medNameCell.innerHTML = medName;
    newRow.appendChild(medNameCell);
}

function editMedTable(tableBody, scriptNumber, medName, medDose, medFreqNumber, medFreqUnits) {
    var table = document.getElementById(tableBody);
    var editRow = document.getElementById("row_" + scriptNumber);
    editRow.innerHTML = ""; //clear old contents

    var medInfoCell = document.createElement('td');    
    var newInfoButton = document.createElement('a');
    newInfoButton.id = "info" + scriptNumber;
   $(newInfoButton).buttonMarkup({
        icon: "info",
        inline: true,
        iconpos: "notext"
    });
    $(newInfoButton).on("click", function() {
        var button = this.id;
        var scriptNumber = button.substring(4);
        displayDialog('MedicationInfoWindow', scriptNumber);
    });
    medInfoCell.appendChild(newInfoButton);
    $(medInfoCell).css("width", "10%");
    editRow.appendChild(medInfoCell);

    var medEditCell = document.createElement('td');
    var newEditButton = document.createElement('a');
    newEditButton.id = "edit" + scriptNumber;
    $(newEditButton).buttonMarkup({
        icon: "edit",
        inline: true,
        iconpos: "notext"
    });
    $(newEditButton).on("click", function() {
        var button = this.id;
        var scriptNumber = button.substring(4);
        displayDialog('EditMedicationWindow', scriptNumber);
    });
    medEditCell.appendChild(newEditButton);
    $(medEditCell).css("width", "10%");
    editRow.appendChild(medEditCell);

    var medDeleteCell = document.createElement('td');
    var newDeleteButton = document.createElement('a');
    newDeleteButton.id = "delete" + scriptNumber;
    $(newDeleteButton).buttonMarkup({
        icon: "delete",
        inline: true,
        iconpos: "notext"
    });
    $(newDeleteButton).on("click", function() {
        var button = this.id;
        var scriptNumber = button.substring(6);
        deleteMedication(scriptNumber);
    });
    medDeleteCell.appendChild(newDeleteButton);
    $(medDeleteCell).css("width", "10%");
    editRow.appendChild(medDeleteCell);

    var medNameCell = document.createElement('td');
    $(medNameCell).css("width", "10%");
    medNameCell.innerHTML = medName;
    editRow.appendChild(medNameCell);

}


function deleteMedFromTable(scriptNumber){
	var row = document.getElementById("row_"+scriptNumber);
	var rowIndex = row.rowIndex;
	var table = document.getElementById("MedicationListTable");
	table.deleteRow(rowIndex);
}


// ----- FUNCTIONS TO ADD, EDIT, OR DELETE NOTIFICATIONS ----- //

function addNewNotification(scriptNumber, medName, medDose, time, frequencyNumber, frequencyUnits, refillDate) {
    var startDate = new Date();
    startDate.setHours(parseInt(time.substring(0, 2)));
    startDate.setMinutes(parseInt(time.substring(3, 5)));

    // Convert frequency to minutes
    var medFreqInMin = 0;
    frequencyNumber = parseInt(frequencyNumber);
    switch (frequencyUnits) {
        case "Minute(s)":
            medFreqInMin = frequencyNumber * 1;
            break;
        case "Hour(s)":
            medFreqInMin = frequencyNumber * 60;
            break;
        case "Day(s)":
            medFreqInMin = frequencyNumber * 60 * 24;
            break;
        case "Week(s)":
            medFreqInMin = frequencyNumber * 60 * 24 * 7;
            break;
        default:
            break;
    }

    var refillDateObject = new Date(refillDate);

    if(!testingInBrowser){  // Don't use cordova if in browser, as it's inserted by PhoneGap

	    //Schedule first notification
	    cordova.plugins.notification.local.schedule({
	        id: scriptNumber,
	        title: "Take Medicine!",
	        text: medName + " " + medDose,
	        firstAt: startDate,
	        every: medFreqInMin 
	    });

	    // Schedule refill notification
	    cordova.plugins.notification.local.schedule({
	    	id: "refill_"+scriptNumber,
	    	title: "Time for a Refill!",
	    	text: medName + " " + medDose,
	    	firstAt: refillDateObject,
	    	every: 43200 //30 days
	    }); 
	}
}

function editNotification(scriptNumber, medName, medDose, time, frequencyNumber, frequencyUnits, refillDate) {

	var startDate = new Date();
    startDate.setHours(parseInt(time.substring(0, 2)));
    startDate.setMinutes(parseInt(time.substring(3, 5)));

    // Convert frequency to minutes
    var medFreqInMin = 0;
    frequencyNumber = parseInt(frequencyNumber);
    switch (frequencyUnits) {
        case "Minute(s)":
            medFreqInMin = frequencyNumber * 1;
            break;
        case "Hour(s)":
            medFreqInMin = frequencyNumber * 60;
            break;
        case "Day(s)":
            medFreqInMin = frequencyNumber * 60 * 24;
            break;
        case "Week(s)":
            medFreqInMin = frequencyNumber * 60 * 24 * 7;
            break;
        default:
            break;
    }

    var refillDateObject = new Date(refillDate);

    if(!testingInBrowser){  // Don't use cordova if in browser, as it's inserted by PhoneGap

	    // Schedule med reminder notification
		cordova.plugins.notification.local.update({
		    id: scriptNumber,
		    text: medName + " " + medDose,
	        firstAt: startDate,
	        every: medFreqInMin 
		});

		// Schedule refill notification
		cordova.plugins.notification.local.update({
			id: "refill_" + scriptNumber,
			text: medName + " " + medDose,
			firstAt: refillDateObject,
			every: 43200 // 30 days
		});
	}

}



function deleteNotification(scriptNumber){
	if(!testingInBrowser){  // Don't use cordova if in browser, as it's inserted by PhoneGap
		cordova.plugins.notification.local.cancel(scriptNumber, function(){});
		cordova.plugins.notification.local.cancel("refill_" + scriptNumber, function(){});
	}
}


// ----- MISC. FUNCTIONS -----//
function getAvailableDrugs(){   // this was our attempt to make the drugs autocomplete. It is not yet working
	var availableDrugs = [];
	db.transaction(function(tx){
		tx.executeSql("SELECT name FROM Drugs", [], function(tx, rs){
			for(var i=0; i<rs.rows.length; i++){
				availableDrugs[i] = rs.rows[i].name;
			}
			$("#newMedName").autocomplete({source:availableDrugs});
		  
		},
		function(tx, error){
			alert(error.message);
		}) 
	});	
}

function test() {  // test values used
    db.transaction(function(tx) {
        //tx.executeSql("INSERT INTO Users VALUES (?,?,?);", ['Amanda', '586-744-0877', '23']);
        tx.executeSql("INSERT INTO Pharmacy VALUES ('1234', 'Rite Aid Durham', '555-555-5555', '12345 Main Street');")
       /* tx.executeSql("INSERT INTO Drugs VALUES ('Penicillin', 'Rash', 'Alcohol');");
        tx.executeSql("INSERT INTO Drugs VALUES ('Advil', 'Rash', 'Alcohol');");
        tx.executeSql("INSERT INTO Drugs VALUES ('Vicodin', 'Nausea', 'Alcohol');");
        tx.executeSql("INSERT INTO Drugs VALUES ('Aleve', 'Headache', 'Alcohol');"); */
    });
}
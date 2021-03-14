const { access } = require('fs');
const html2canvas = require('html2canvas');

const path = require('path');
const cfvdb = path.resolve(__dirname, '../db/cfv.db');
const profilesdb = path.resolve(__dirname, '../db/Profiles.db');

//Global Variables
var deckList;

//Clean Deck Name for Table Usage
function cleanName(str){
    str = str.replace(/'/g, "");
    str = str.split(" ").join("_");
    return str;
}

//For Displaying Deck Name
function displayName(str){
    str = str.replace(/_/g, " ");
    return str;
}

//Updates List of Deck Lists
function getProfiles(){
    const db = require('better-sqlite3')(profilesdb);

    var selection = document.getElementById("viewLoadList");

    //reset selection before adding new ones

    selection.options.length = 0;
    selection.options[selection.options.length] = new Option("---Select a List---", "");

    let stmt = db.prepare("SELECT DeckName FROM MasterDeckList;");

    i = 1;
    for (let row of stmt.iterate()) {
        selection.options[i] = new Option(displayName(row.DeckName), row.DeckName);
        i = i + 1;
    }
   
    process.on('exit', () => db.close());
    process.setMaxListeners(0);
    return;
}

//Clear Table & Set Table Headers
function clearTables(selector){
    process.setMaxListeners(0);
    var Parent;
    if (selector == "results"){
        process.setMaxListeners(0);
        Parent = document.getElementById("cardResults");
        while(Parent.hasChildNodes())
        {
        Parent.removeChild(Parent.firstChild);
        }
    }

    if (selector == "access"){
        Parent = document.getElementById("deckList");
        while(Parent.hasChildNodes())
        {
        Parent.removeChild(Parent.firstChild);
        }
    }
    return;
}

//Show Card Preview
function showCard(card){ 
    const db = require('better-sqlite3')(cfvdb);
    var sql = 'SELECT * FROM "MasterStandardList" WHERE CardNumber=?';
    const row = db.prepare(sql).get(card);
    let picture = "../img/"+row.CardNumber.substring(0, 6)+"/"+row.CardNumber+".jpg";
    document.getElementById("cardPicture").src=picture;
    document.getElementById("cardName").innerHTML = "Name: " + row.Name;
    document.getElementById("cardGrade").innerHTML = "Grade: " + row.Grade;
    document.getElementById("cardPower").innerHTML = "Power: " + row.Power;
    document.getElementById("cardShield").innerHTML = "Shield: " + row.Shield;
    document.getElementById("cardCritical").innerHTML = "Critical: " + row.Critical;
    document.getElementById("cardType").innerHTML = "Type: " + row.Type;
    document.getElementById("cardRace").innerHTML = "Race: " + row.Race;

    let cleanEffect = row.Effect.replace(/<br[/]>/g, "*"); //Turns Breaktags into a temporary symbol to not be effected by the change
    cleanEffect = cleanEffect.replace(/</g, "&lt"); // Turns Less than Signs to literals
    cleanEffect = cleanEffect.replace(/>/g, "&gt"); // Turns Greater than Signs into Literals
    cleanEffect = cleanEffect.replace(/[*]/g, "<br/>"); //Turns Temporary Symbol into 2 Break Tags

    document.getElementById("cardEffect").innerHTML = cleanEffect;


    process.on('exit', () => db.close());
    process.setMaxListeners(0);
    return;
}

//Accessing List
function accessList(){
    let sql = "SELECT * FROM "+ deckList + " ORDER BY Grade DESC, Power DESC, Shield ASC, Name ASC, Type ASC;";
    let t = 0;
    let db = require('better-sqlite3')(profilesdb);
    let stmt = db.prepare(sql);
    clearTables("access");
    for (const info of stmt.iterate()) {   
        listTable(info, t);
        t = t +1;
        deckLimit = t;

    }
    process.on('exit', () => db.close());
    process.setMaxListeners(0);
    return;

}


//Display List
function listTable(result, t){
    var table = document.getElementById("deckList");
    var tablerow;

    if (t%10 == 0){
        tablerow = table.insertRow(t%9);
        for (i = 0; i < 10; i++) {
            let cell = tablerow.insertCell(i);
        }
    }
    else{
        if (t >= 0){
            tablerow = document.getElementById("deckList").rows[0];
        }
        if (t >= 10){
            tablerow = document.getElementById("deckList").rows[1];
        }
        if (t >= 20){
            tablerow = document.getElementById("deckList").rows[2];
        }
        if (t >= 30){
            tablerow = document.getElementById("deckList").rows[3];
        }
        if (t >= 40){
            tablerow = document.getElementById("deckList").rows[4];
        }       
    }
    


    let picture = "../img/"+result.Number.substring(0, 6)+"/"+result.Number+".jpg";
    //document.getElementById("cardPicture").src=picture
    var link = document.createElement("a");
    link.href = "#";
    var x = document.createElement("IMG");
    x.src=picture;
    x.onmouseover = function() {showCard(result.Number)};
    //x.onclick = function() {deleteCard(result.id)};
    x.height = "155";
    x.width = "100";
    link.appendChild(x);
    switch(t%10){
        case 0:
            tablerow.cells[0].appendChild(link);
            break;
        case 1:
            tablerow.cells[1].appendChild(link);
            break;
        case 2:
            tablerow.cells[2].appendChild(link);
            break;
        case 3:
            tablerow.cells[3].appendChild(link);
            break;
        case 4:
            tablerow.cells[4].appendChild(link);
            break;
        case 5:
            tablerow.cells[5].appendChild(link);
            break;
        case 6:
            tablerow.cells[6].appendChild(link);
            break;
        case 7:
            tablerow.cells[7].appendChild(link);
            break;
        case 8:
            tablerow.cells[8].appendChild(link);
            break;
        case 9:
            tablerow.cells[9].appendChild(link);
            break;
    }
    return;

}

//Load List
function loadList(){
    deckList =  document.getElementById("viewLoadList").value;
    document.getElementById('deckName').innerHTML = "Decklist: " + displayName(deckList);

    accessList();
    process.setMaxListeners(0);
    return;
}

function Screenshot(){
    console.log('now printing');
    var container = document.getElementById("deckList");; // full page 
		html2canvas(container,{allowTaint : true}).then(function(canvas) {
		
			var link = document.createElement("a");
            document.body.appendChild(link);
            fname =(deckList+".png")
			link.download = fname;
			link.href = canvas.toDataURL("image/png");
			link.target = '_blank';
			link.click();
		});
}
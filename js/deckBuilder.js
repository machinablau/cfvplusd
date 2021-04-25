const { access } = require('fs');
const Dialogs = require('dialogs');
const html2canvas = require('html2canvas');

const path = require('path');
const cfvdb = path.resolve(__dirname, '../db/cfv.db');
const profilesdb = path.resolve(__dirname, '../db/Profiles.db');

//Global Variables
var searchNation;
var deckList;
var deckLimit;

//Clean Deck Name for Table Usage
function cleanName(str){
    str = str.replace(/'/g, "");
    str = str.split(" ").join("_");
    process.setMaxListeners(0);
    return str;
    
}

//For Displaying Deck Name
function displayName(str){
    str = str.replace(/_/g, " ");
    process.setMaxListeners(0);
    return str;
}

//Create Deck List
function createList(){
    const dialogs = Dialogs();
    if ( document.getElementById("newList").value == ""){
        dialogs.alert("The List you created must have a name.");
        process.setMaxListeners(0);
        return;
    }
    if (!(document.getElementById("newList").value.match(/^[a-zA-Z\s]*$/))){
        dialogs.alert("Lists must only contain letters and spaces.");
        document.getElementById("newList").value = "";
        process.setMaxListeners(0);
        return;
    }
    if ( document.getElementById('searchNation').value == ""){
        dialogs.alert("You must select a Nation!");
        process.setMaxListeners(0);
        return;
    }
    var db = require('better-sqlite3')(profilesdb);
    deckList = cleanName(document.getElementById("newList").value);
    try{
        var stmt = db.prepare('CREATE TABLE ' + deckList + '_Ride_Deck (id INTEGER PRIMARY KEY AUTOINCREMENT, Number TEXT NOT NULL, Name TEXT NOT NULL, Grade INTEGER NOT NULL, Type Text NOT NULL, Power INTEGER NOT NULL, Shield INTEGER NOT NULL, Special Text NOT NULL)');
        var info = stmt.run();
        var stmt = db.prepare('CREATE TABLE ' + deckList + '_Main_Deck (id INTEGER PRIMARY KEY AUTOINCREMENT, Number TEXT NOT NULL, Name TEXT NOT NULL, Grade INTEGER NOT NULL, Type Text NOT NULL, Power INTEGER NOT NULL, Shield INTEGER NOT NULL, Special Text NOT NULL)');
        var info = stmt.run();
        var stmt = db.prepare('CREATE TABLE ' + deckList + '_Triggers (id INTEGER PRIMARY KEY AUTOINCREMENT, Number TEXT NOT NULL, Name TEXT NOT NULL, Grade INTEGER NOT NULL, Type Text NOT NULL, Power INTEGER NOT NULL, Shield INTEGER NOT NULL, Special Text NOT NULL)');
        var info = stmt.run();
        dialogs.alert("You have created the list: " + displayName(deckList));
    }
    catch(error){
        console.log(info);
        console.log(error);
        dialogs.alert("The List you are trying to create already exists!");
        process.setMaxListeners(0);
        return;
    }

    searchNation = "'"+ document.getElementById('searchNation').value +"'";
    document.getElementById('deckName').innerHTML = "Decklist: " + displayName(deckList);
    
    try{
        var stmt= db.prepare('INSERT INTO MasterDeckList (DeckName, Nation) VALUES (?,?)');
        var info = stmt.run(deckList, document.getElementById('searchNation').value);
    }
    catch(error){
        console.log(info);
        console.log(error);
        dialogs.alert("Error Occurred in Master Deck List.");
        process.setMaxListeners(0);
        return;
    }
    
    //console.log();
    clearTables("access");
    process.on('exit', () => db.close());
    process.setMaxListeners(0);
    deckLimit = 0;
    getResults();
    getProfiles();
    process.setMaxListeners(0);
    return;
}

//Updates List of Deck Lists
function getProfiles(){
    const db = require('better-sqlite3')(profilesdb);

    var selection1 = document.getElementById("viewDeleteList");
    var selection2 = document.getElementById("viewLoadList");

    //reset selection before adding new ones
    selection1.options.length = 0;
    selection1.options[selection1.options.length] = new Option("---Select a List---", "");

    selection2.options.length = 0;
    selection2.options[selection2.options.length] = new Option("---Select a List---", "");

    let stmt = db.prepare("SELECT DeckName FROM MasterDeckList;");

    i = 1;
    for (let row of stmt.iterate()) {
        
        selection1.options[i] = new Option(displayName(row.DeckName), row.DeckName);
        selection2.options[i] = new Option(displayName(row.DeckName), row.DeckName);
        i = i + 1;
    }
   
    process.on('exit', () => db.close());
    process.setMaxListeners(0);
    return;
}

//Delete Deck List
function deleteList(){
    const dialogs = Dialogs();
    if ( document.getElementById("viewDeleteList").value == ""){
        dialogs.alert("Choose a list to delete." );
        process.setMaxListeners(0);
        return;
    }
    let deleteTable = document.getElementById("viewDeleteList").value;


    var db = require('better-sqlite3')(profilesdb);
    var stmt = db.prepare('DROP TABLE ' + deleteTable + '_Ride_Deck');
    stmt.run();
    stmt = db.prepare('DROP TABLE ' + deleteTable +'_Main_Deck');
    stmt.run();
    stmt = db.prepare('DROP TABLE ' + deleteTable + '_Triggers');
    stmt.run();
    dialogs.alert("You have deleted decklist:" + displayName(deleteTable) + ".");

    process.on('exit', () => db.close());
    process.setMaxListeners(0);

    deleteFromMaster(deleteTable);

    clearTables("results");
    clearTables("access");
    searchNation = "";
    document.getElementById('deckName').innerHTML = "Decklist: ";
    getProfiles();
    process.setMaxListeners(0);
    return;
}

function deleteFromMaster(deleteTable){
    const dialogs = Dialogs();
    try{
        let db = require('better-sqlite3')(profilesdb);
        let sql = "DELETE FROM MasterDeckList WHERE DeckName = '" +deleteTable+"';";
        stmt = db.prepare(sql);
        let info = stmt.run();
    }
    catch (error){
        dialogs.alert("Failed to Delete From Master" );
        return;
    }
    process.on('exit', () => db.close());
    process.setMaxListeners(0);
    return;
}


//Checkbox for how many values checked

function getCheckVals(checks, x){
    var arr = [];
    let i;
    for ( i = 0; i < x; i++) {
        if ( checks[i].checked) {
            arr.push(checks[i].value)
        }
    }
    return arr;
}


//Updates search for cards in Database
function getResults(){
    //Gathering Information from Search Form
    var searchName = document.getElementById('searchName').value;
    var searchGrade = getCheckVals(document.getElementsByClassName('searchGrade'), 6);
    var searchType = getCheckVals(document.getElementsByClassName('searchType'), 3);
    var searchLowPower = document.getElementById('searchLowPower').value;
    var searchHighPower = document.getElementById('searchHighPower').value;
    var searchLowShield = document.getElementById('searchLowShield').value;
    var searchHighShield = document.getElementById('searchHighShield').value;

    //SQL Statement Start
    let sql;
    let db = require('better-sqlite3')(cfvdb);
    sql = 'SELECT * FROM "MasterStandardList"';
    sql += ' WHERE (Nation =';
    sql += searchNation;
    sql += " OR Nation = 'Cray Elemental' OR Nation = 'Order')";

    //SQL Statement Add-Ons
    if (searchLowShield !='' ||searchHighShield !=''||searchLowPower !='' ||searchHighPower !=''||searchName !='' ||searchGrade !=''||searchType !=''){
        sql += ' AND ';
        
        //Search by Keyword
        if (searchName !=''){
            
            sql += "(Name LIKE '%";
            sql += searchName;
            sql += "%' OR Effect LIKE '%";
            sql += searchName;
            sql += "%' OR Race LIKE '%";
            sql += searchName;
            sql += "%')";
            if (searchLowShield !='' ||searchHighShield !=''||searchLowPower !='' ||searchHighPower !=''||searchGrade !=''||searchType !=''){
                sql += ' AND ';
            }
        }

        //Search by Grade
        if (searchGrade !=''){
            sql += "(";
            let gradeAddOn ="";
            searchGrade.forEach(function(element) {
                gradeAddOn += "Grade = ";
                gradeAddOn += element;
                if (searchGrade.length > 1 && element != searchGrade[searchGrade.length-1]){
                    gradeAddOn += " OR ";
                }
            });

            gradeAddOn += ")";
            sql += gradeAddOn;

            if (searchLowShield !='' ||searchHighShield !=''||searchLowPower !='' ||searchHighPower !=''||searchType !=''){
                sql += ' AND ';
            }
        }

        //Search by Type
        if (searchType !=''){
            sql += "(";
            let typeAddOn ="";
            searchType.forEach(function(element) {
                typeAddOn += "Type = ";
                typeAddOn += element;
                if (searchType.length > 1 && element != searchType[searchType.length-1]){
                    typeAddOn += " OR ";
                }
            });

            typeAddOn += ")";
            sql += typeAddOn;

            if(searchLowShield !='' ||searchHighShield !=''||searchLowPower !='' ||searchHighPower !=''){
                sql += ' AND ';
            }
        }

        //Search by Power
        if(searchLowPower !='' ||searchHighPower !=''){
            
            if(searchLowPower !=''){
                if(searchHighPower !=''){
                    sql += "(";
                }
                sql +="Power >= ";
                sql +=searchLowPower;
            }
            if(searchHighPower !=''){
                if(searchLowPower !=''){
                    sql += ' AND ';
                }
                sql +="Power <= ";
                sql +=searchHighPower;
                if(searchLowPower !=''){
                    sql += ')';
                }
            }

            if(searchLowShield !='' ||searchHighShield !=''){
                sql += ' AND ';
            }
        }

        //Search by Shield
        if(searchLowShield !='' ||searchHighShield !=''){
            
            if(searchLowShield !=''){
                if(searchHighShield !=''){
                    sql += "(";
                }
                sql +="Shield >= ";
                sql +=searchLowShield;
            }
            if(searchHighShield !=''){
                if(searchLowShield!=''){
                    sql += ' AND ';
                }
                sql +="Shield <= ";
                sql +=searchHighShield;
                if(searchLowShield !=''){
                    sql += ')';
                }
            }
        }



    }
    sql += " ORDER BY Grade DESC, CardNumber ASC;";
    //console.log(sql);
    let stmt = db.prepare(sql);

    //Filling up the Table

    let t = 0; //tablerow to start on
    clearTables("results");
    for (const info of stmt.iterate()) {
        cardTable(info, t);
        t = t +1;
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

    if (selector == "access"){
        Parent = document.getElementById("rideDeck");
        while(Parent.hasChildNodes())
        {
        Parent.removeChild(Parent.firstChild);
        }
    }

    if (selector == "access"){
        Parent = document.getElementById("Triggers");
        while(Parent.hasChildNodes())
        {
        Parent.removeChild(Parent.firstChild);
        }
    }
    process.setMaxListeners(0);
    return;
}

//Add to Table each row
function cardTable(result, t){
    var table = document.getElementById("cardResults");
    
    var tablerow = table.insertRow(t);
    var cell1 = tablerow.insertCell(0)
    
    let nameTag = '<a href = "#" id ="'+result.CardNumber+'" onmouseover="showCard(this.id)" onclick="addCard(this.id)">'
    cell1.innerHTML = nameTag +result.Name+"</a>";
    process.setMaxListeners(0);
    return;
}

//Show Card Preview
function showCard(card){ 
    console.log(card);
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

//Add to list
function addCard(card){
    const dialogs = Dialogs();
    if (deckLimit > 49){
        dialogs.alert("Max Limit Reached" );
        return;
    }

    var db;
    //Adding Card Info
    db = require('better-sqlite3')(cfvdb);
    var cardName, cardGrade,cardType, cardSpecial;
    var sql = 'SELECT * FROM "MasterStandardList" WHERE CardNumber=?';
    const row = db.prepare(sql).get(card);
    cardName = row.Name;
    cardGrade = row.Grade;
    cardType = row.Type;
    cardSpecial = row.Special;
    cardPower = row.Power;
    cardShield = row.Shield;
    db = require('better-sqlite3')(profilesdb);

    // Fixes issue with cards that have a "'" since it is not accepted in SQLite
    cardName = cardName.replace(/'/g, "");
    //console.log(cardName); 
    //Deck Checker 34 Normal/Order Cards & 16 Trigger Cards
    if (document.getElementById("Ride_Deck").checked){
        var countNO = db.prepare("SELECT COUNT(Type) AS countNO FROM "+deckList+"_Ride_Deck WHERE Type = 'Normal' OR Type = 'Order' OR Type = 'Trigger'");
        let cardCount = countNO.get();
        cardCount = cardCount["countNO"] 
        if (cardCount == 4)
        {
            dialogs.alert("You have reached the maximum number in Ride deck" );
            process.setMaxListeners(0);
            return;
        }
    }
    else{
        if (cardType == "Normal" || cardType =="Order"){
            var countNO = db.prepare("SELECT COUNT(Type) AS countNO FROM "+deckList+"_Main_Deck WHERE Type = 'Normal' OR Type = 'Order'");
            let cardCount = countNO.get();
            cardCount = cardCount["countNO"] 
            if (cardCount == 30)
            {
                dialogs.alert("You have reached the maximum number of Normal or Order Cards in Main deck" );
                process.setMaxListeners(0);
                return;
            }
    
        }
        else{
            var countNO = db.prepare("SELECT COUNT(Type) AS countNO FROM "+deckList+"_Triggers WHERE Type = 'Trigger'");
            let cardCount = countNO.get();
            cardCount = cardCount["countNO"];
            if (cardCount == 16)
            {
                dialogs.alert("You have reached the maximum number of Triggers in deck" );
                return;
            }
    
        }
    }
    
    
    //Deck Checker Special Rules
    //Ex: Sentinels or Heals
    if (cardSpecial != ' '){
        if (cardSpecial == 'Over'){ 
            countNO = db.prepare("SELECT COUNT(Type) AS countNO FROM "+deckList+"_Triggers WHERE Special = 'Over'");
            cardSpecialCounter = countNO.get();
            cardSpecialCounter = cardSpecialCounter["countNO"];
    
            if (cardSpecialCounter == 1)
            {
                dialogs.alert("You can only play 1 Over Trigger in Deck!" );
                return;
            }
    
        }

        if (cardSpecial == 'Heal'){
            countNO = db.prepare("SELECT COUNT(Type) AS countNO FROM "+deckList+"_Triggers WHERE Special = 'Heal'");
            cardSpecialCounter = countNO.get();
            cardSpecialCounter = cardSpecialCounter["countNO"];
            //console.log("I am a heal!");
            if (cardSpecialCounter == 4)
            {
                dialogs.alert("You have reached the maximum number of Heal Triggers in deck!" );
                return;
            }
    
        }

        if (cardSpecial == 'Sentinel'){
            countNO = db.prepare("SELECT COUNT(Type) AS countNO FROM "+deckList+"_Main_Deck WHERE Special = 'Sentinel'");
            cardSpecialCounter = countNO.get();
            cardSpecialCounter = cardSpecialCounter["countNO"];
            if (cardSpecialCounter == 4)
            {
                dialogs.alert("You have reached the maximum number of Sentinels in deck!" );
                return;
            }
    
        } 
    }
    

   

    
           
    
        //Deck Check for Playset of 4 Number 
        let cardCountMax;

        if (document.getElementById("Ride_Deck").checked){
            let countMax = db.prepare("SELECT Count(Grade) as countMax FROM " + deckList +"_Ride_Deck WHERE Grade = "+ cardGrade);
            cardCountMax = countMax.get();
            cardCountMax = cardCountMax["countMax"];

            if (cardCountMax == 1){
                dialogs.alert('You can only put 1 of each grade (0 - 3) in Ride Deck');
                return;
            }
        }

        if (cardType == "Normal" || cardType =="Order"){
            let countMax = db.prepare("SELECT COUNT(Name) AS countMax FROM "+deckList+"_Main_Deck WHERE Name = '"+cardName+"'");
            cardCountMax = countMax.get();
            cardCountMax = cardCountMax["countMax"];

            countMax = db.prepare("SELECT COUNT(Name) AS countMax FROM "+deckList+"_Ride_Deck WHERE Name = '"+cardName+"'");
            let cardCountMax2 = countMax.get();
            cardCountMax = cardCountMax + cardCountMax2["countMax"];
        }
        else{
            let countMax = db.prepare("SELECT COUNT(Name) AS countMax FROM "+deckList+"_Triggers WHERE Name = '"+cardName+"'");
            cardCountMax = countMax.get();
            cardCountMax = cardCountMax["countMax"];

            countMax = db.prepare("SELECT COUNT(Name) AS countMax FROM "+deckList+"_Ride_Deck WHERE Name = '"+cardName+"'");
            let cardCountMax2 = countMax.get();
            cardCountMax = cardCountMax + cardCountMax2["countMax"];
        }

        if (cardCountMax == 4)
        {   
            dialogs.alert('You have reached the limit of how many you can play of this card' );
            return;
        }

   
    try{
        if (document.getElementById("Ride_Deck").checked){
            const stmt = db.prepare('INSERT INTO '+deckList+'_Ride_Deck (Number,Name,Grade,Type,Power,Shield,Special) VALUES (?,?,?,?,?,?,?)');
            const info = stmt.run(card,cardName,cardGrade,cardType,cardPower,cardShield,cardSpecial);
        }
        else{
            if (cardType == "Normal" || cardType =="Order"){
                const stmt = db.prepare('INSERT INTO '+deckList+'_Main_Deck (Number,Name,Grade,Type,Power,Shield,Special) VALUES (?,?,?,?,?,?,?)');
                const info = stmt.run(card,cardName,cardGrade,cardType,cardPower,cardShield,cardSpecial);
            }
            if (cardType == 'Trigger'){
                const stmt = db.prepare('INSERT INTO '+deckList+'_Triggers (Number,Name,Grade,Type,Power,Shield,Special) VALUES (?,?,?,?,?,?,?)');
                const info = stmt.run(card,cardName,cardGrade,cardType,cardPower,cardShield,cardSpecial);
            }

        }
        
        
        
        //alert("You have successfully added " + card + " to list (" + deckList+")");
    }
    catch(error)
    {
        if(deckList == ""){
            alert("Select a deck list before adding a card");
        }
    }
    process.on('exit', () => db.close());
    process.setMaxListeners(0);
    accessList();
    process.setMaxListeners(0);
    return;
}

// Removing Card From List
function deleteCard(id){
    console.log(id);
    const dialogs = Dialogs();
    var db = require('better-sqlite3')(profilesdb);
    
    if (document.getElementById("Ride_Deck_Delete").checked){
        let sql = "DELETE FROM "+deckList+"_Ride_Deck WHERE Number = '"+id +"';";
        var stmt = db.prepare(sql);
        stmt.run();
        process.on('exit', () => db.close());
        process.setMaxListeners(0);
        accessList();
        process.setMaxListeners(0);
        return;
    }

    let sql = "DELETE FROM "+deckList+"_Main_Deck WHERE Number = '"+id +"' LIMIT 1;";
    var stmt = db.prepare(sql);
    stmt.run();

    sql = "DELETE FROM "+deckList+"_Triggers WHERE Number = '" +id +"' LIMIT 1;";
    stmt = db.prepare(sql);
    stmt.run();


    process.on('exit', () => db.close());
    process.setMaxListeners(0);
    accessList();
    process.setMaxListeners(0);
    return;
}

//Accessing List
function accessList(){
    let sql = "SELECT * FROM "+ deckList + "_Ride_Deck ORDER BY Grade ASC;";
    let t = 0;
    let db = require('better-sqlite3')(profilesdb);
    let stmt = db.prepare(sql);
    clearTables("access");
    for (const info of stmt.iterate()) {   
        listTable(info, t, 'rideDeck');
        t = t +1;
        deckLimit = t;

    }
    sql = "SELECT * FROM "+ deckList + "_Main_Deck ORDER BY Grade DESC, Power DESC, Shield ASC, Name ASC, Type ASC;";
    t = 0;
    db = require('better-sqlite3')(profilesdb);
    stmt = db.prepare(sql);
    for (const info of stmt.iterate()) {   
        listTable(info, t, 'deckList');
        t = t +1;
        deckLimit = t;

    }
    sql = "SELECT * FROM "+ deckList + "_Triggers ORDER BY Grade DESC, Power DESC, Shield ASC, Name ASC, Type ASC;";
    t = 0;
    db = require('better-sqlite3')(profilesdb);
    stmt = db.prepare(sql);
    for (const info of stmt.iterate()) {   
        listTable(info, t, 'Triggers');
        t = t +1;
        deckLimit = t;

    }
    process.on('exit', () => db.close());
    process.setMaxListeners(0);
    return;

}


//Display List
function listTable(result, t, tableName){
    var table = document.getElementById(tableName);
    var tablerow;

    if (t%10 == 0){
        tablerow = table.insertRow(t%9);
        for (i = 0; i < 10; i++) {
            let cell = tablerow.insertCell(i);
        }
    }
    else{
        if (t >= 0){
            tablerow = document.getElementById(tableName).rows[0];
        }
        if (t >= 10){
            tablerow = document.getElementById(tableName).rows[1];
        }
        if (t >= 20){
            tablerow = document.getElementById(tableName).rows[2];
        }
        if (t >= 30){
            tablerow = document.getElementById(tableName).rows[3];
        }
        if (t >= 40){
            tablerow = document.getElementById(tableName).rows[4];
        }       
    }
    


    let picture = "../img/"+result.Number.substring(0, 6)+"/"+result.Number+".jpg";
    //document.getElementById("cardPicture").src=picture
    var link = document.createElement("a");
    link.href = "#";
    var x = document.createElement("IMG");
    x.src=picture;
    x.onmouseover = function() {showCard(result.Number); return;};
    x.onclick = function() {deleteCard(result.Number); return;};
    //x.oncontextmenu = function(){addCard(result.id); return;};
    x.height = "101";
    x.width = "70";
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
    process.setMaxListeners(0);
    return;

}

//Load List
function loadList(){
    deckList =  document.getElementById("viewLoadList").value;
    document.getElementById('deckName').innerHTML = "Decklist: " + displayName(deckList);

    let db = require('better-sqlite3')(profilesdb);
    let stmt = db.prepare("Select Nation from MasterDeckList Where DeckName = '"+deckList +"';");
    let info = stmt.get();
    searchNation = "'"+info.Nation+"'";
    process.on('exit', () => db.close());

    accessList();
    getResults();
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
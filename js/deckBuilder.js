const { access } = require('fs');
const Dialogs = require('dialogs');
const html2canvas = require('html2canvas');

const path = require('path');
const cfvdb = path.resolve(__dirname, '../db/cfv.db');
const profilesdb = path.resolve(__dirname, '../db/Profiles.db');

//Global Variables
var searchClan;
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
    if ( document.getElementById('searchClan').value == ""){
        dialogs.alert("You must select a clan!");
        process.setMaxListeners(0);
        return;
    }
    var db = require('better-sqlite3')(profilesdb);
    deckList = cleanName(document.getElementById("newList").value);
    try{
        var stmt = db.prepare('CREATE TABLE ' + deckList + ' (id INTEGER PRIMARY KEY AUTOINCREMENT, Number TEXT NOT NULL, Name TEXT NOT NULL, Grade INTEGER NOT NULL, Type Text NOT NULL, Power INTEGER NOT NULL, Shield INTEGER NOT NULL, Special Text NOT NULL)');
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

    searchClan = "'"+ document.getElementById('searchClan').value +"'";
    document.getElementById('deckName').innerHTML = "Decklist: " + displayName(deckList);
    
    try{
        var stmt= db.prepare('INSERT INTO MasterDeckList (DeckName, Clan) VALUES (?,?)');
        var info = stmt.run(deckList, document.getElementById('searchClan').value);
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
    var stmt = db.prepare('DROP TABLE ' + deleteTable);
    stmt.run();
    dialogs.alert("You have deleted decklist:" + displayName(deleteTable) + ".");

    process.on('exit', () => db.close());
    process.setMaxListeners(0);

    deleteFromMaster(deleteTable);

    clearTables("results");
    clearTables("access");
    searchClan = "";
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
    sql += ' WHERE (Clan =';
    sql += searchClan;
    sql += " OR Clan = 'Cray Elemental' OR Clan = 'Order')";

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
    
    if (cardType == "Normal" || cardType =="Order"){
        var countNO = db.prepare("SELECT COUNT(Type) AS countNO FROM "+deckList+" WHERE Type = 'Normal' OR Type = 'Order'");
        let cardCount = countNO.get();
        cardCount = cardCount["countNO"] 
        if (cardCount == 34)
        {
            dialogs.alert("You have reached the maximum number of Normal or Order Cards in deck" );
            process.setMaxListeners(0);
            return;
        }

    }
    else{
        var countNO = db.prepare("SELECT COUNT(Type) AS countNO FROM "+deckList+" WHERE Type = 'Trigger'");
        let cardCount = countNO.get();
        cardCount = cardCount["countNO"];
        if (cardCount == 16)
        {
            dialogs.alert("You have reached the maximum number of Triggers in deck" );
            return;
        }

    }

    //Deck Checker Special Rules
    //Ex: Sentinels or Heals
    if (cardSpecial != ' '){
        // Card cannot be placed in deck.
        if (cardSpecial == 'Banned'){
            dialogs.alert("This card has been restricted to 0. Please check restriction list for details." );
            return;
        }


        let cardSpecialCounter;
        // Only 1 copy can be placed in deck.
        if (cardSpecial == 'Limited'){
            countNO = db.prepare("SELECT COUNT(Name) AS countNO FROM "+deckList+" WHERE Name = '"+ cardName+"'");
            cardSpecialCounter = countNO.get();
            cardSpecialCounter = cardSpecialCounter["countNO"];
            if (cardSpecialCounter == 1)
            {
                dialogs.alert("You have cannot have more than 1 copy per deck. Please check restriction list for details." );
                return;
            }

        }

        // Only 2 copies can be placed in deck.
        if (cardSpecial == 'SemiLimited'){
            countNO = db.prepare("SELECT COUNT(Name) AS countNO FROM "+deckList+" WHERE Special = '"+ cardName+"'");
            cardSpecialCounter = countNO.get();
            cardSpecialCounter = cardSpecialCounter["countNO"];
            if (cardSpecialCounter == 2)
            {
                dialogs.alert("You have cannot have more than 2 copy per deck. Please check restriction list for details." );
                return;
            }

        }
        // 16 copies can be placed in deck.
        if (cardSpecial == 'Eight'){
            countNO = db.prepare("SELECT COUNT(Name) AS countNO FROM "+deckList+" WHERE Name = '"+ cardName+"'");
            cardSpecialCounter = countNO.get();
            cardSpecialCounter = cardSpecialCounter["countNO"];
            if (cardSpecialCounter == 8)
            {
                dialogs.alert("You have cannot have more than 8 copy per deck." );
                return;
            }

        }

        // 16 copies can be placed in deck.
        if (cardSpecial == 'Twelve'){
            countNO = db.prepare("SELECT COUNT(Name) AS countNO FROM "+deckList+" WHERE Name = '"+ cardName+"'");
            cardSpecialCounter = countNO.get();
            cardSpecialCounter = cardSpecialCounter["countNO"];
            if (cardSpecialCounter == 12)
            {
                dialogs.alert("You have cannot have more than 12 copy per deck." );
                return;
            }

        }

        // 16 copies can be placed in deck.
        if (cardSpecial == 'Sixteen'){
            countNO = db.prepare("SELECT COUNT(Name) AS countNO FROM "+deckList+" WHERE Name = '"+ cardName+"'");
            cardSpecialCounter = countNO.get();
            cardSpecialCounter = cardSpecialCounter["countNO"];
            if (cardSpecialCounter == 16)
            {
                dialogs.alert("You have cannot have more than 16 copy per deck." );
                return;
            }

        }

        // Choice Restriction
        // Pending/Lengthy
        if (cardSpecial == 'Choice'){
            //Restriction between Skull Witch Nemain and Dragheart Luard
            if (cardName == "Skull Witch, Nemain"){
                countNO = db.prepare("SELECT Count(Name) AS countNO from "+deckList+" WHERE Name = 'Dragheart, Luard'");
                cardSpecialCounter = countNO.get();
                cardSpecialCounter = cardSpecialCounter["countNO"];
                if (cardSpecialCounter > 0)
                {
                    dialogs.alert("Skull Witch, Nemain is choice restriced with Dragheart, Luard. Please check restriction list.");
                    return;
                }
            }
            if (cardName == "Dragheart, Luard"){
                countNO = db.prepare("SELECT Count(Name) AS countNO from "+deckList+" WHERE Name = 'Skull Witch, Nemain'");
                cardSpecialCounter = countNO.get();
                cardSpecialCounter = cardSpecialCounter["countNO"];
                if (cardSpecialCounter > 0)
                {
                    dialogs.alert("Dragheart, Luard is choice restriced with Skull Witch, Nemain. Please check restriction list.");
                    return;
                }
            }
            // Restriction between Sunrise Ray Knight, Gurguit and Bluish Flame Liberator, Percival 
            if (cardName == "Sunrise Ray Knight, Gurguit"){
                countNO = db.prepare("SELECT Count(Name) AS countNO from "+deckList+" WHERE Name = 'Bluish Flame Liberator, Percival'");
                cardSpecialCounter = countNO.get();
                cardSpecialCounter = cardSpecialCounter["countNO"];
                if (cardSpecialCounter > 0)
                {
                    dialogs.alert("Sunrise Ray Knight, Gurguit is choice restriced with Bluish Flame Liberator, Percival. Please check restriction list.");
                    return;
                }

            }
            if (cardName == "Bluish Flame Liberator, Percival"){
                countNO = db.prepare("SELECT Count(Name) AS countNO from "+deckList+" WHERE Name = 'Sunrise Ray Knight, Gurguit'");
                cardSpecialCounter = countNO.get();
                cardSpecialCounter = cardSpecialCounter["countNO"];
                if (cardSpecialCounter > 0)
                {
                    dialogs.alert("Bluish Flame Liberator, Percival is choice restriced with Sunrise Ray Knight, Gurguit. Please check restriction list.");
                    return;
                }

            }

        }

        if (cardSpecial == 'Heal'){
            countNO = db.prepare("SELECT COUNT(Type) AS countNO FROM "+deckList+" WHERE Special = 'Heal'");
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
            countNO = db.prepare("SELECT COUNT(Type) AS countNO FROM "+deckList+" WHERE Special = 'Sentinel'");
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
        var countMax = db.prepare("SELECT COUNT(Name) AS countMax FROM "+deckList+" WHERE Name = '"+cardName+"'");
        let cardCountMax = countMax.get();
        cardCountMax = cardCountMax["countMax"];
        if (cardSpecial == 'Sixteen'){
            if (cardCountMax == 16)
            {
                dialogs.alert("You have reached the limit of how many you can play of this card." );
                process.setMaxListeners(0);
                return;
            }
            
        }
        else if (cardSpecial == 'Twelve'){
            if (cardCountMax == 12)
            {
                dialogs.alert("You have reached the limit of how many you can play of this card." );
                process.setMaxListeners(0);
                return;
            }
            
        }
        else if (cardSpecial == 'Eight'){
            if (cardCountMax == 8)
            {
                dialogs.alert("You have reached the limit of how many you can play of this card." );
                process.setMaxListeners(0);
                return;
            }
            
        }
        else
        {
            if (cardCountMax == 4)
            {   
                dialogs.alert('You have reached the limit of how many you can play of this card' );
                return;
            }
        }
   

    

    try{
        const stmt = db.prepare('INSERT INTO '+deckList+' (Number,Name,Grade,Type,Power,Shield,Special) VALUES (?,?,?,?,?,?,?)');
        const info = stmt.run(card,cardName,cardGrade,cardType,cardPower,cardShield,cardSpecial);
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
    const dialogs = Dialogs();
    var db = require('better-sqlite3')(profilesdb);
    try{ //DELETE FROM LoginTime WHERE user_id=1 ORDER BY datetime DESC LIMIT 1
        let sql = 'DELETE FROM '+deckList+' WHERE id = '+id +';'
    
        var stmt = db.prepare(sql);
        stmt.run();
    }
    catch(error){
        console.log(error);
        dialogs.alert("Deleting Card Failed!")
        process.setMaxListeners(0);
    }
    process.on('exit', () => db.close());
    process.setMaxListeners(0);
    accessList();
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
    x.onmouseover = function() {showCard(result.Number); return;};
    x.onclick = function() {deleteCard(result.id); return;};
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
    let stmt = db.prepare("Select Clan from MasterDeckList Where DeckName = '"+deckList +"';");
    let info = stmt.get();
    searchClan = "'"+info.Clan+"'";
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
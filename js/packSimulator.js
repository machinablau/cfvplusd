// Global Variables

// Constants
const path = require('path');
const packdb = path.resolve(__dirname, '../db/PackSim.db');
const cfvdb = path.resolve(__dirname, '../db/cfv.db');
const Dialogs = require('dialogs');
const dialogs = Dialogs();

const fs = require('fs');
const { clear } = require('console');


// Case variables
var SetCase = "";
var PackNum = 0; // Initally Pack 0
var BoxNum = 0; // Initally Box 0
var CaseNum = 0;

// Rarity per Limit Per Card in a Case
var CLimPer = 0;
var RLimPer = 0;
var RRLimPer = 0;
var RRRLimPer = 0;

// Constants Rarity per Box;
var RRRBoxLim = 4;
var RRBoxLim = 5;
var ORRBoxLim = 1;
var RBoxLim = 22;
const ORRs = [13, 16, 19, 22, 25];

// Constants for Main Booster Sets
const CardLim = 7; // 7 Cards per Pack
const PackLim = 16; // 16 Packs per Box
const BoxLim = 20; // 20 Boxes per Case

// Keeps track of how many opened in a box
var RRRBoxCt = 0;
var RRBoxCt = 0;
var ORRBoxCt = 0;
var RBoxCt = 0;


//Card Picks for a 7 pack
var card1 = 0;
var card2 = 0;
var card3 = 0;
var card4 = 0;
var card5 = 0;
var card6 = 0;
var card7 = 0;

function calcPacks(){
    
    let db = require('better-sqlite3')(packdb);
    let sql = "SELECT SUM(Quantity) FROM '"+SetCase+"';"
    let TotalAmtCards = db.prepare(sql).get();
    let SetName = "";

    TotalAmtCards = TotalAmtCards["SUM(Quantity)"];
    PackNum = TotalAmtCards / CardLim; //Gets the total numbers of packs opened
    BoxNum = Math.floor(PackNum / PackLim + 1); // Gets the current box
    PackNum  = PackNum % PackLim; // Changes PackNum to within the range of the how many packs there can be.
    CaseNum = CaseNum + Math.floor(BoxNum / BoxLim + 1);
    BoxNum = BoxNum % BoxLim;
    
    switch(SetCase){
        case 'D-BT01':
                SetName = "D Booster Set 01: Genesis of the Five Greats";
                break;
        case 'D-BT02':
                SetName = "D Booster Set 02: A Brush with the Legends";
                break;
        default:
            SetName = SetCase;
    }

    document.getElementById("setName").innerHTML = "Set: " + SetName;
    document.getElementById("packNumber").innerHTML = "Pack Number: " + (PackNum + 1);
    document.getElementById("boxNumber").innerHTML = "Box Number: " + (BoxNum);
    document.getElementById("caseNumber").innerHTML = "Case Number: " + CaseNum;
    
   

    process.on('exit', () => db.close());
    process.setMaxListeners(0);
    return;
}

function caseCounter(CardNum){
    let db = require('better-sqlite3')(packdb);
    
    // Box Count
    if (CardNum < 11){ // Counting RRR per box
        RRRBoxCt++;
    }
    else if (CardNum < 26){ //Count RR per box
        if (CardNum == 13 || CardNum == 16 || CardNum == 19 || CardNum == 22 || CardNum == 25){ // Counting ORR per box
            ORRBoxCt++;
        }
        else{ 
            RRBoxCt++;
        }

    }
    else if (CardNum < 56){ //Counting R per box
        RBoxCt++;
    }

    //Transforms number to string form
    
    var CardNumS;
    if (CardNum < 10 ){

        CardNumS = "00" + CardNum.toString();
    }
    else{
        if (CardNum < 100){
            CardNumS = "0" + CardNum.toString();
        }
        else{
            CardNumS = CardNum.toString();
        }
    }

    var CardSelect = SetCase+"-"+CardNumS;

    let sql= "Update '" + SetCase + "' Set Quantity = Quantity + 1 Where CardNum = ?;";
    db.prepare(sql).run(CardSelect);
    process.on('exit', () => db.close());
    process.setMaxListeners(0);
    return;
}

function newpack(){

    let db = require('better-sqlite3')(packdb);

    // Set a new pack
    document.getElementById("card1").src="../img/CFVBack.jpg";
    document.getElementById("card2").src="../img/CFVBack.jpg";
    document.getElementById("card3").src="../img/CFVBack.jpg";
    document.getElementById("card4").src="../img/CFVBack.jpg";
    document.getElementById("card5").src="../img/CFVBack.jpg";
    document.getElementById("card6").src="../img/CFVBack.jpg";
    document.getElementById("card7").src="../img/CFVBack.jpg";

    // Setting which pack
    SetCase = document.getElementById('searchSet').value;

    // If no pack is selected.
    if (SetCase == ""){
        dialogs.alert("Please select a pack.");
        return;
    }
    
    //Calculates the total number of packs opened;
    calcPacks();

    console.log(PackNum);

    // Resets count when a new box has been opened.
    if (PackNum == 0){
        RRRBoxCt = 0;
        RRBoxCt = 0;
        ORRBoxCt = 0;
        RBoxCt = 0;
    }

    // Randomizer Syntax
    //Math.floor(Math.random() * (Max - Min) + Min);

    // Cards 1 - 5 are C
    card1 = Math.floor(Math.random() * (120 - 56) + 56);
    caseCounter(card1);
    
    card2 = Math.floor(Math.random() * (120 - 56) + 56);
    caseCounter(card2);
    
    card3 = Math.floor(Math.random() * (120 - 56) + 56);
    caseCounter(card3);

    card4 = Math.floor(Math.random() * (120 - 56) + 56);
    caseCounter(card4);

    card5 = Math.floor(Math.random() * (120 - 56) + 56);
    caseCounter(card5);

    // Card 6 is always R
    card6 = Math.floor(Math.random() * (55 - 26) + 26); 
    caseCounter(card6);

    // Card 7 is R or higher
    card7 = Math.floor(Math.random() * (55 - 26) + 26); 

    if (PackNum == 0 || PackNum == 7 || PackNum == 8 || PackNum == 15){ // Packs 1,8,9,16 have RRR always
        card7 = Math.floor(Math.random() * (10) + 1);
    }
    if (PackNum == 6 && SetCase == "D-BT01"){ // Pack 7 will always have a ORR if it is D-BT01
        card7 = ORRs[Math.floor(Math.random() * (5))];
    }
    else if(PackNum == 6 ){ // Will produce a RR if it is not D-BT01
        card7 = Math.floor(Math.random() * (25 - 11) + 11); 
    }
    if (PackNum == 2 || PackNum == 4 || PackNum == 10|| PackNum == 12){ // RR or Higher
        card7 = Math.floor(Math.random() * (25 - 11) + 11);
        while (ORRs.includes(card7)){ // Re-rolls till it produces a RR if the result is an ORR
            card7 = Math.floor(Math.random() * (25 - 11) + 11);
        }
    }
    caseCounter(card7);
    
    clearInfo();
    dialogs.alert("New "+SetCase+" Pack has been opened. Good Luck!");
    process.setMaxListeners(0);
    return;
}

function clearInfo(){
    document.getElementById("cardPicture").src="../img/CFVBack.jpg";
    document.getElementById("cardName").innerHTML = "Name: ";
    document.getElementById("cardGrade").innerHTML = "Grade: " ;
    document.getElementById("cardPower").innerHTML = "Power: " ;
    document.getElementById("cardShield").innerHTML = "Shield: ";
    document.getElementById("cardCritical").innerHTML = "Critical: ";
    document.getElementById("cardType").innerHTML = "Type: " ;
    document.getElementById("cardRace").innerHTML = "Race: ";
    document.getElementById("cardRarity").innerHTML = "Rarity: ";
    document.getElementById("cardEffect").innerHTML = "";
}

function newcase(){
    let db = require('better-sqlite3')(packdb);

    // Setting which Case to Reset
    SetCase = document.getElementById('searchSet').value;

    if (SetCase == ""){
        dialogs.alert("Please select a set.");
        return;
    }



    let sql= "Update '" + SetCase + "' Set Quantity = 0";
    
    db.prepare(sql).run();
    process.on('exit', () => db.close());
    process.setMaxListeners(0);
    dialogs.alert("Case "+ SetCase +" has been reset.");


    // Reset Pack
    document.getElementById("card1").src="../img/CFVBack.jpg";
    document.getElementById("card2").src="../img/CFVBack.jpg";
    document.getElementById("card3").src="../img/CFVBack.jpg";
    document.getElementById("card4").src="../img/CFVBack.jpg";
    document.getElementById("card5").src="../img/CFVBack.jpg";
    document.getElementById("card6").src="../img/CFVBack.jpg";
    document.getElementById("card7").src="../img/CFVBack.jpg";

    // Reset Selected Case
    SetCase = "";
    PackNum = 0;
    BoxNum = 0;
    CaseNum = 0;
    
    process.on('exit', () => db.close());
    
    document.getElementById("setName").innerHTML = "Set: ";
    document.getElementById("packNumber").innerHTML = "Pack Number: 0";
    document.getElementById("boxNumber").innerHTML = "Box Number: 0";
    document.getElementById("caseNumber").innerHTML = "Case Number: 0";

    clearInfo();
    process.setMaxListeners(0);
    return;
}

function savecase(){
    let db = require('better-sqlite3')(packdb);

    // Setting which Case to Reset
    SetCase = document.getElementById('searchSet').value;

    if (SetCase == ""){
        dialogs.alert("Please select a set.");
        return;
    }

    const stmt = db.prepare("SELECT * FROM '"+SetCase+"'");
    console.log(stmt);
    //CSV Header
    var csv = 'Number,Name,Rarity,Quantity\n';
    for (const row of stmt.iterate()){
        csv = csv + row.CardNum + ",";
        csv = csv + row.Name.replace(/,/g, "") + ",";
        csv = csv + row.Rarity + ",";
        csv = csv + row.Quantity ;
        csv += "\n";
        console.log(csv);
    }

    var hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:text/csv;charset=utf-8,'+encodeURI(csv);
    hiddenElement.target = '_blank';

    hiddenElement.download = SetCase + '.csv';
    hiddenElement.click();
    return;
}

function revealallcards(){
    const cardslot = ["card1","card2","card3", "card4", "card5", "card6", "card7"];

    // Warning Message when there a pack has not been selected
    if (SetCase == ""){
        dialogs.alert("Please select a pack.");
        return;
    }

    for (var i = 0; i < 7; i++){
        flipCard(cardslot[i]);
    }

    return;
}

function flipCard(CardPos){
    

    // Checks to see if you selected a pack
    if (SetCase == ""){
        dialogs.alert("Please select a pack.");
        return;
    }

    

    var CardNum;

    // Setting each card
    switch(CardPos){
        case "card7":
            CardNum = card7;
            break;
        case "card6":
            CardNum = card6;
            break;
        case "card5":
            CardNum = card5;
            break;
        case "card4":
            CardNum = card4;
            break;
        case "card3":
            CardNum = card3;
            break;
        case "card2":
            CardNum = card2;
            break;
        case "card1":
            CardNum = card1;
            break;
    }

    //Transforms number to string form
    var CardNumS;
    if (CardNum < 10 ){
        CardNumS = "00" + CardNum.toString();
    }
    else{
        if (CardNum < 100){
            CardNumS = "0" + CardNum.toString();
        }
        else{
            CardNumS = CardNum.toString();
        }
    }

    var CardSelect = SetCase+"-"+CardNumS;
    let picture = "../img/"+SetCase+"/"+CardSelect+".jpg";
    document.getElementById(CardPos).src=picture;

    showCard(CardSelect);
    process.setMaxListeners(0);
    return;

}

// To be added at a later date
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
    document.getElementById("cardRarity").innerHTML = "Rarity: " + row.Rarity;

    let cleanEffect = row.Effect.replace(/<br[/]>/g, "*"); //Turns Breaktags into a temporary symbol to not be effected by the change
    cleanEffect = cleanEffect.replace(/</g, "&lt"); // Turns Less than Signs to literals
    cleanEffect = cleanEffect.replace(/>/g, "&gt"); // Turns Greater than Signs into Literals
    cleanEffect = cleanEffect.replace(/[*]/g, "<br/>"); //Turns Temporary Symbol into 2 Break Tags

    document.getElementById("cardEffect").innerHTML = cleanEffect;


    process.on('exit', () => db.close());
    process.setMaxListeners(0);
    return;
}
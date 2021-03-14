const path = require('path');
const cfvdb = path.resolve(__dirname, '../db/cfv.db');


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


//Search for Card in Database
function getResults(){
    //Gathering Information from Search Form
    var searchName = document.getElementById('searchName').value;
    var searchSet = document.getElementById('searchSet').value;
    var searchRarity =getCheckVals(document.getElementsByClassName('searchRarity'), 9);
    var searchGrade = getCheckVals(document.getElementsByClassName('searchGrade'), 6);
    var searchClan = document.getElementById("searchClan").value;
    var searchType = getCheckVals(document.getElementsByClassName('searchType'), 3);
    var searchLowPower = document.getElementById('searchLowPower').value;
    var searchHighPower = document.getElementById('searchHighPower').value;
    var searchLowShield = document.getElementById('searchLowShield').value;
    var searchHighShield = document.getElementById('searchHighShield').value;

    //SQL Statement Start
    let sql;
    let db = require('better-sqlite3')(cfvdb);
    sql = 'SELECT * FROM "MasterStandardList"';

    //SQL Statement Add-Ons
    if (searchLowShield !='' ||searchHighShield !=''||searchLowPower !='' ||searchHighPower !=''||searchName !='' ||searchSet !=''||searchRarity !=''||searchGrade !=''||searchClan !=''||searchType !=''){
        sql += ' WHERE ';
        
        //Search by Name *Keyword idea pending*
        if (searchName !=''){
            
            sql += "(Name LIKE '%";
            sql += searchName;
            sql += "%' OR Effect LIKE '%";
            sql += searchName;
            sql += "%' OR CardNumber LIKE '%";
            sql += searchName;
            sql += "%' OR Clan LIKE '%";
            sql += searchName;
            sql += "%' OR Race LIKE '%";
            sql += searchName;
            sql += "%')";
            if (searchLowShield !='' ||searchHighShield !=''||searchLowPower !='' ||searchHighPower !=''||searchSet !=''||searchRarity !=''||searchGrade !=''||searchClan !=''||searchType !=''){
                sql += ' AND ';
            }
        }

        //Search by Set
        if (searchSet !=''){
            sql += "CardNumber LIKE '%";
            sql += searchSet;
            sql += "%'";
            if (searchLowShield !='' ||searchHighShield !=''||searchLowPower !='' ||searchHighPower !=''||searchRarity !=''||searchGrade !=''||searchClan !=''||searchType !=''){
                sql += ' AND ';
            }
        }

        //Search by Rarity
        if (searchRarity !=''){
            sql += "("
            let rarityAddOn ="";
            searchRarity.forEach(function(element) {
                rarityAddOn += "Rarity = ";
                rarityAddOn += element;
                if (searchRarity.length > 1 && element != searchRarity[searchRarity.length-1]){
                    rarityAddOn += " OR ";
                }
            });

            rarityAddOn += ")";
            sql += rarityAddOn;

            if (searchLowShield !='' ||searchHighShield !=''||searchLowPower !='' ||searchHighPower !=''||searchGrade !=''||searchClan !=''||searchType !=''){
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

            if (searchLowShield !='' ||searchHighShield !=''||searchLowPower !='' ||searchHighPower !=''||searchClan !=''||searchType !=''){
                sql += ' AND ';
            }
        }

        //Search by Clan
        if (searchClan !=''){
            sql += "Clan = '";
            sql += searchClan;
            sql += "'";
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

    let t = 1; //tablerow to start on
    clearTables();
    for (const info of stmt.iterate()) {
        //console.log(info);
        cardTable(info, t);
        t = t +1;
    }
    process.on('exit', () => db.close());
    process.setMaxListeners(0);
    return;
}

//Clear Table & Set Table Headers
function clearTables(){
    process.setMaxListeners(0);
    var Parent = document.getElementById("cardResults");
    while(Parent.hasChildNodes())
    {
      Parent.removeChild(Parent.firstChild);
    }
    setHeaders(Parent);
    return;
}

// Set Table Header
function setHeaders(Parent){

    // Create an empty <thead> element and add it to the table:
    var tablerow = Parent.createTHead();

    // Create an empty <tr> element and add it to the first position of <thead>:
    var row = tablerow.insertRow(0);    

    // Insert a new cell (<td>) at the first position of the "new" <tr> element:
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);

    cell1.innerHTML = "<b>Name</b>";
    cell2.innerHTML = "<b>Grade</b>";
    cell3.innerHTML = "<b>Clan</b>";

    return;
}

//Add to Table each row
function cardTable(result, t){
    var table = document.getElementById("cardResults");
    
    var tablerow = table.insertRow(t);
    var cell1 = tablerow.insertCell(0)
    var cell2 = tablerow.insertCell(1);
    var cell3 = tablerow.insertCell(2);
    
    let nameTag = '<a href = "#" id ="'+result.CardNumber+'" onmouseover="showCard(this.id)">'
    cell1.innerHTML = nameTag +result.Name+"</a>";
    cell2.innerHTML = result.Grade;
    cell3.innerHTML = result.Clan;

    return;
    
}

//Show Card Preview
function showCard(card){ 
    //console.log(card);
    const db = require('better-sqlite3')(cfvdb);
    var sql = 'SELECT * FROM "MasterStandardList" WHERE CardNumber=?';
    const row = db.prepare(sql).get(card);
    console.log(row);
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


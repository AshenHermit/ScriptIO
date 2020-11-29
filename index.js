const path = require('path');
var http = require('http');
var express = require('express'),
    app = module.exports.app = express();
var socket = require('socket.io');
var fs = require('fs');

var fetch = require('isomorphic-fetch');
var Dropbox = require('dropbox').Dropbox;

var scriptsShop = {}
var gameMap = {}

var date = new Date()
date = date.getDate() + "_" + date.getMonth() + "_" + date.getFullYear() + "-" + date.getHours() + "-" + date.getMinutes() + "-" + date.getSeconds()

function parseMap(file){
    gameMap.colliders = []

    let lines = file.split("\n")
    lines.forEach(line => {
        if(line.trim()!=""){
            let type = line.substring(0, line.indexOf(" "))
            if(type=="collider_line"){
                line = line.substring(line.indexOf(" ")).replace(new RegExp(" ", "g"), "")
                let params = line.split("_")
                p1 = params[0].split(",").map(x=>parseFloat(x))
                p2 = params[1].split(",").map(x=>parseFloat(x))
                gameMap.colliders.push({
                    p1: {x:p1[0], y:p1[1]},
                    p2: {x:p2[0], y:p2[1]},
                })
            }
        }
    })
}

function loadMap(name, callback){
    let filename = "./maps/" + name + ".map"
    if (fs.existsSync(filename)) {
        fs.readFile(filename, 'utf8', function (err, file) {
            if (err) {
                return console.log(err);
            }
            parseMap(file)
            fs.readFile(filename.replace(".map", ".jpg"), 'base64', function (err, imageFile) {
                if (err) {
                    return console.log(err);
                }
                gameMap.image = 'data:image/jpeg;base64,' + imageFile
                console.log("map loaded: '"+filename+"'")
                if(callback) callback()
            })
        })
    }else{
        console.log("map '"+filename+"' does not exist")
    }
}

/*
if(process.argv.length>3){
    var dbx = new Dropbox({
        accessToken:  process.argv[3], 
        fetch: fetch
    });
    
    dbx.filesDownload({path: '/scriptsShop.json'})
    .then(function(response) {
        var encoded = new Buffer.from(response.result.fileBinary);
        console.log("scripts shop loaded")
        scriptsShop = JSON.parse(encoded.toString('utf8'))
    })
    .catch(function(err){
        console.log(err)
        
    })
}
*/

fs.readFile('./scriptsShop.json', 'utf8', function (err,data) {
    if (err) {
        return console.log(err);
    }
    scriptsShop = JSON.parse(data)
    scriptsShop.serverScripts = []
    console.log("scripts shop loaded")
});

loadMap("test")



// starting server
var server = http.createServer(app);
var io = socket.listen(server);  //pass a http.Server instance

var ip = "0.0.0.0"

if(process.argv.length>2) ip = process.argv[2]

server.listen(3000, ip);  //listen on port 3000
console.log("created server: "+ip+":3000");

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(express.static(path.join(__dirname, 'client')));
app.use(express.static(path.join(__dirname, 'maps')));

app.get('/', (req, res, next) => {
    res.sendFile(path.join(__dirname, 'client/index.html'));
});

//utils
function generateToken(){
    var out = ""
    for(var i=0; i<2; i++){
        out += Math.random().toString(36).substr(2)
    }
    return out
}



function saveServerScripts(destination='local'){
    //if(destination == 'dropbox'){
    if(process.env.DBX_ACCESS_TOKEN){
        var dbx = new Dropbox({
            accessToken:  process.env.DBX_ACCESS_TOKEN, 
            fetch: fetch
        });
    
        dbx.filesUpload({
            "path": "/server_scripts_saves/"+ date +".json",
            "contents": JSON.stringify(dbCopy, 0, 4),
            "mode": {".tag": "overwrite"},
            "autorename": false,
            "mute": true,
            "strict_conflict": false
        }).then(function(req){
            
        })
        .catch(function(err){
            console.error(err)
            
        })
    }
    //else if(destination == 'local'){
    else{
        let dir = "./server_scripts_saves/"
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, {
                recursive: true
            });
        }
        fs.writeFile("./server_scripts_saves/"+date+".json", JSON.stringify({serverScripts: scriptsShop.serverScripts}), { flag: 'w' }, function (err) {
            if(err) throw err
        })
    }

}

// objects
function Player(data){
    this.uid = data.uid
    this.token = data.token
    this.username = "player"
    this.scripts = []
}


// game
var nextPlayerId = 0;
var players = []

var playerByUid = {}
var playerByToken = {}

function getPlayerIdByToken(token){
    return players.findIndex(x => x.token == token)
}

io.sockets.on('connection', function (socket) {
    console.log('user connected');
    var data = {
        uid: nextPlayerId,
        token: generateToken(),
        connections: Object.keys(playerByUid).map((x)=>{return {uid: parseInt(x), scripts: playerByUid[x].scripts}}),
        scriptsShop: scriptsShop,
        map: gameMap,
    }
    socket.emit('local_connect', data);
    var newPlayer = new Player(data)
    players.push(newPlayer)
    playerByToken[data.token] = newPlayer
    playerByUid[newPlayer.uid] = newPlayer
    io.sockets.emit('playerConnected', {uid: newPlayer.uid});
    nextPlayerId+=1;

    console.log(players)

    socket.on('clientDisconnect', function (data) {
        var id = getPlayerIdByToken(data.token)
        io.sockets.emit('serverPlayerDisconnect', {uid: players[id].uid});
        delete playerByUid[players[id].uid]
        delete playerByToken[players[id].token]
        players.splice(id, 1)
        console.log("user disconnected")
        console.log(players)
    });
    
    socket.on('clientSync', function (data) {
        data.uid = playerByToken[data.token].uid
        delete data.token
        io.sockets.emit('serverClientSync', data);
    });

    socket.on('clientSyncControls', function (data) {
        data.uid = playerByToken[data.token].uid
        delete data.token
        io.sockets.emit('serverClientSyncControls', data);
    });

    socket.on('clientSyncInstantiate', function (data) {
        data.uid = playerByToken[data.token].uid
        delete data.token
        io.sockets.emit('serverClientSyncInstantiate', data);
    });

    socket.on('clientSetupScripts', function (data) {
        data.uid = playerByToken[data.token].uid
        playerByToken[data.token].scripts = data.scripts
        delete data.token
        io.sockets.emit('serverClientSetupScripts', data);
    });

    socket.on('clientLoadMap', function(data){
        loadMap(data.name, function(){
            io.sockets.emit('serverLoadMap', {map: gameMap})
        })
    })

    socket.on('clientServerScriptsUpdate', function(data){
        scriptsShop.serverScripts = data.serverScripts
        saveServerScripts()
        io.sockets.emit('serverScriptsUpdate', {serverScripts: scriptsShop.serverScripts})
    })

    socket.on('clientObjectPickUp', function(data){
        data.uid = playerByToken[data.token].uid
        delete data.token
        io.sockets.emit('serverClientObjectPickUp', data);
    })

    socket.on('clientSelectInventoryItem', function(data){
        data.uid = playerByToken[data.token].uid
        delete data.token
        io.sockets.emit('serverSelectInventoryItem', data);
    })
})

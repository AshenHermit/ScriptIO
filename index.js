const path = require('path');
var http = require('http');
var express = require('express'),
    app = module.exports.app = express();
var socket = require('socket.io');


var fetch = require('isomorphic-fetch');
var Dropbox = require('dropbox').Dropbox;

var scriptsShop = {}

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


// starting server
var server = http.createServer(app);
var io = socket.listen(server);  //pass a http.Server instance

var ip = "0.0.0.0"

if(process.argv.length>2) ip = process.argv[2]

server.listen(3000, ip);  //listen on port 3000
console.log("created server: "+ip+":3000");

app.use(express.static(path.join(__dirname, 'client')));

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

    socket.on('clientSetupScripts', function (data) {
        data.uid = playerByToken[data.token].uid
        playerByToken[data.token].scripts = data.scripts
        delete data.token
        io.sockets.emit('serverClientSetupScripts', data);
    });
})
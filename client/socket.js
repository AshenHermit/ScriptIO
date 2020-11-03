// socket
// connection
socket.on('local_connect', function (data) {
    localPlayer = new Player(data)
    playerByUid[data.uid] = localPlayer
    players.push(localPlayer)
    connected = true

    for(var i=0; i<data.connections.length; i++){
        var newPlayer = new Player({uid: data.connections[i].uid})
        newPlayer.setupScripts(data.connections[i].scripts)
        playerByUid[data.connections[i].uid] = newPlayer
        players.push(newPlayer)
    }
    scriptsShop = data.scriptsShop
    
    scriptsShopList.innerHTML = 
    scriptsShop.scripts.map((s, i)=>{

        let com1 = s.indexOf("//")
        let nl1 = s.indexOf("\n", com1)
        let title = s.substring(com1+2, nl1).trim()
        let description = ""
        if(s.charAt(nl1+1) == "/") {
            description = s.substring(nl1+3, s.indexOf("\n", nl1+1)).trim()
        }

        return `
<div class="item">
    <div class="title">`+title+`</div>
    <div class="description">`+description+`</div>
    <div onclick="loadScriptFromShop(`+i+`)" class="load-button button">load</div>
</div>`
        
    }).join("")
});
socket.on('playerConnected', function (data) {
    if(data.uid!=localPlayer.uid) {
        var newPlayer = new Player(data)
        players.push(newPlayer)
        playerByUid[data.uid] = newPlayer
    }
});
socket.on('serverPlayerDisconnect', function (data) {
    var playerId = getPlayerIdByUid(data.uid)
    playerByUid[data.uid].setupScripts([])
    playerByUid[data.uid] = undefined
    players.splice(playerId, 1)
});

socket.on('serverClientSync', function (data) {
    if(data.uid!=localPlayer.uid){
        playerByUid[data.uid].targetPosition._set(data.position)
        playerByUid[data.uid].mousePos._set(data.mousePos)
        playerByUid[data.uid].hp = data.hp
    }
});

socket.on('serverClientSyncControls', function (data) {
    if(data.uid!=localPlayer.uid){
        if(data.state){
            playerByUid[data.uid].onPress[data.control] = true
        }
        playerByUid[data.uid].controls[data.control] = data.state
    }
});

socket.on('serverClientSetupScripts', function (data) {
    if(data.uid!=localPlayer.uid)
        playerByUid[data.uid].setupScripts(data.scripts)
});
// socket
// connection
socket.on('local_connect', function (data) {
    localPlayer = new Player(data)
    playerByUid[data.uid] = localPlayer
    players.push(localPlayer)
    connected = true
    //data.connections.reverse()
    for(var i=0; i<data.connections.length; i++){
        var newPlayer = new Player({uid: data.connections[i].uid})
        newPlayer.setupScripts(data.connections[i].scripts)
        playerByUid[data.connections[i].uid] = newPlayer
        players.unshift(newPlayer)
    }
    scriptsShop = data.scriptsShop
    
    scriptsShopList.innerHTML = 
    scriptsShop.scripts.map((s, i) => getScriptShopItem(s, i, true)).join("")

    serverScriptsShopList.innerHTML = 
    scriptsShop.serverScripts.map((s, i) => getScriptShopItem(s, i, false)).join("")

    buildMap(data.map)
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


socket.on('serverClientSyncInstantiate', function (data) {
    if(data.uid!=localPlayer.uid){
        socketInstantiateObject(data)
    }
});


socket.on('serverClientSyncControls', function (data) {
    if(data.uid!=localPlayer.uid){
        if(data.state){
            playerByUid[data.uid].onPress[data.control] = true
        }
        playerByUid[data.uid].isPressed[data.control] = data.state
    }
});

socket.on('serverClientSetupScripts', function (data) {
    if(data.uid!=localPlayer.uid)
        playerByUid[data.uid].setupScripts(data.scripts)
});

socket.on('serverLoadMap', function (data) {
    console.log(data)
    buildMap(data.map)
});

socket.on('serverScriptsUpdate', function (data) {
    scriptsShop.serverScripts = data.serverScripts
    updateServerScriptsList()
});

socket.on('serverClientObjectPickUp', function(data){
    if(data.uid!=localPlayer.uid){
        playerByUid[data.uid].itemInHands = playerByUid[data.uid].scriptCtx[data.scriptCtxId][data.arrayName][data.objId]
    }
})

socket.on('serverSelectInventoryItem', function (data) {
    if(data.uid!=localPlayer.uid)
        playerByUid[data.uid].selectedItem = playerByUid[data.uid].inventory[data.itemId]

    updateServerScriptsList()
});
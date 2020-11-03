
function ScriptContext(script, player){
    this._script = script
    eval(this._script)
    if(this.init && !this.disabled){
        this.init(player)
    }
}

function Player(data){
    this.uid = data.uid
    this.token = data.token
    this.username = "player"
    this.hp = 100
    this.infoY = 90

    this.controls = {
        "KeyW": false,
        "KeyA": false,
        "KeyS": false,
        "KeyD": false,
        "Space": false
    }
    this.onPress = Object.assign({}, this.controls)

    this.scriptCtx = []
    
    this.velocity = vector2()
    this.position = vector2()
    this.targetPosition = vector2()
    this.mousePos = vector2()
    this.speed = 1
    this.overrideMovement = false
    this.overrideRender = false

    this.isLocal = function(){
        return this.token !== undefined
    }

    this.setupScripts = function(scripts){
        for(var i=0; i<this.scriptCtx.length; i++){
            if(this.scriptCtx[i].destroy && !this.scriptCtx[i].disabled){
                this.scriptCtx[i].destroy(this)
            }
        }
        this.scriptCtx = []
        for(var i=0; i<scripts.length; i++){
            this.scriptCtx.push(new ScriptContext(scripts[i], this))
        }
    }
    this.emitScripts = function(){
        socket.emit('clientSetupScripts', {token: this.token, scripts: this.scriptCtx.map(x=>x._script)});
    }

    this.update = function(){
        this.mousePos.x = cameraPos.x + clientMousePos.x - gCanvas.width/2
        this.mousePos.y = cameraPos.y + clientMousePos.y - gCanvas.height/2
        
        if(this.token){ // is local player
            if(editorState){
                let centerPanelEnd = editPanel.clientWidth-gCanvas.width/2
                cameraPos.x += ((this.position.x-centerPanelEnd-(gCanvas.width/2 - centerPanelEnd)/2)-cameraPos.x)/3
            }
            else{
                cameraPos.x += (this.position.x-cameraPos.x)/3
            }
            cameraPos.y += (this.position.y-cameraPos.y)/3

            if(!this.overrideMovement){
                if(this.controls.KeyW){
                    this.velocity.y -= this.speed
                }
                if(this.controls.KeyA){
                    this.velocity.x -= this.speed
                }
                if(this.controls.KeyS){
                    this.velocity.y += this.speed
                }
                if(this.controls.KeyD){
                    this.velocity.x += this.speed
                }

                this.position._add(this.velocity)
                this.velocity._div(2.0)
            }
        }else{
            this.velocity._set(this.targetPosition.sub(this.position)._div(5))
            this.position._add(this.velocity)
        }

        //
        for(var i=0; i<this.scriptCtx.length; i++){
            if(this.scriptCtx[i].update && !this.scriptCtx[i].disabled) {
                try{
                    this.scriptCtx[i].update(this)
                }catch(err){
                    console.error(err)
                }
            }
        }

        Object.keys(this.onPress).forEach((key)=>{
            if(this.onPress[key]) this.onPress[key] = false
        })
    }

    this.draw = function(ctx){
        if(!this.overrideRender){
            ctx.fillStyle = "#fff"
            ctx.fillRect(this.position.x - 4, this.position.y - 4, 8, 8)
        }
        
        //
        for(var i=0; i<this.scriptCtx.length; i++){
            if(this.scriptCtx[i].draw && !this.scriptCtx[i].disabled){ 
                try{
                    this.scriptCtx[i].draw(ctx, this)
                }catch(err){
                    console.error(err)
                }
            }
        }
    }
}





// listeners
// disconnection
window.addEventListener("beforeunload", function(e){
    connected = false
    socket.emit('clientDisconnect', {token: localPlayer.token});

    clearInterval(updateInterval)
    clearInterval(syncInterval)
}, false);

document.addEventListener('keydown', function(e){
    if(localPlayer.controls[e.code] !== undefined && document.activeElement == document.body){
        if(!localPlayer.controls[e.code]){
            localPlayer.controls[e.code] = true
            localPlayer.onPress[e.code] = true
            if(connected) socket.emit('clientSyncControls', {token: localPlayer.token, control: e.code, state: true})
        }
    }
})

document.addEventListener('keyup', function(e){
    if(localPlayer.controls[e.code] !== undefined && document.activeElement == document.body){
        localPlayer.controls[e.code] = false
        if(connected) socket.emit('clientSyncControls', {token: localPlayer.token, control: e.code, state: false})
    }
})

document.addEventListener('mousemove', function(e){
    clientMousePos.x = e.clientX
    clientMousePos.y = e.clientY
})

window.addEventListener('resize', function(e){
    gCanvas.width = window.innerWidth
    gCanvas.height = window.innerHeight
})




// intervals

function update(){

    //update
    for(var i=0; i<players.length; i++){
        players[i].update()
    }


    //draw
    ctxTransform[4] = -cameraPos.x + gCanvas.width/2
    ctxTransform[5] = -cameraPos.y + gCanvas.height/2
    restoreTransform()

    gCtx.clearRect(cameraPos.x-gCanvas.width/2, cameraPos.y-gCanvas.height/2, gCanvas.width, gCanvas.height)

    if(gameMap.bgImage) drawImage(gCtx, gameMap.bgImage, 0, 0, 0, gameMap.bgImage.naturalWidth)

    //for(var i=0; i<gameMap.colliders.length; i++) gameMap.colliders[i].draw(gCtx)

    for(var i=0; i<players.length; i++){
        players[i].draw(gCtx)
    }
}
function syncronize(){
    if(connected) socket.emit('clientSync', {token: localPlayer.token, hp: localPlayer.hp, mousePos: localPlayer.mousePos, position: localPlayer.position});
}

updateInterval = setInterval(update, 1000/60)
syncInterval = setInterval(syncronize, 1000/18)


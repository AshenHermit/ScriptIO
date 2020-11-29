
function ScriptContext(script, player, i){
    this._id = i
    this._script = script
    eval(this._script)
}

function Player(data){
    this.uid = data.uid
    this.token = data.token
    this.username = "player"
    this.hp = 100
    this.infoY = 90
    
    this.rng = new RNG(new Date().getMinutes()+this.uid)
    this.random = function(){
        return this.rng.nextFloat()
    }

    this.isPressed = {
        "KeyW": false,
        "KeyA": false,
        "KeyS": false,
        "KeyD": false,
        "Space": false
    }
    this.onPress = Object.assign({}, this.isPressed)

    this.scriptCtx = []
    
    this.velocity = vector2()
    this.position = vector2()
    this.targetPosition = vector2()
    this.mousePos = vector2()
    this.speed = 1
    this.overrideMovement = false
    this.overrideDraw = false
    this.overrideCameraMotion = false

    this.inventory = []
    this.selectedItem = null

    this.isLocal = function(){
        return this.token !== undefined
    }

    this.setupScripts = function(scripts){
        this.rng = new RNG(new Date().getMinutes()+this.uid)

        inventoryList.innerHTML = ""
        this.inventory = []
        this.selectedItem = null

        for(var i=0; i<this.scriptCtx.length; i++){
            if(this.scriptCtx[i].destroy && !this.scriptCtx[i].disabled){
                this.scriptCtx[i].destroy(this)
            }
        }
        this.scriptCtx = []
        currentScriptPlayer = this
        for(var i=0; i<scripts.length; i++){
            this.scriptCtx.push(new ScriptContext(scripts[i], this, i))

            currentScriptCtx = this.scriptCtx[i]
                
            if(this.scriptCtx[i].init && !this.scriptCtx[i].disabled){
                this.scriptCtx[i].init(this)
            }
        }

        updateInventoryList()
    }
    this.emitScripts = function(){
        socket.emit('clientSetupScripts', {token: this.token, scripts: this.scriptCtx.map(x=>x._script)});
    }

    this.update = function(){
        currentScriptPlayer = this

        if(this.onPress["KeyR"] && this.selectedItem){
            this.selectedItem.create()
        }

        if(this.token){ // is local player
            this.mousePos.x = cameraPos.x + clientMousePos.x - gCanvas.width/2
            this.mousePos.y = cameraPos.y + clientMousePos.y - gCanvas.height/2

            if(editorState){
                let centerPanelEnd = editPanel.clientWidth-gCanvas.width/2
                cameraPos.x += ((this.position.x-centerPanelEnd-(gCanvas.width/2 - centerPanelEnd)/2)-cameraPos.x)/3
                cameraPos.y += (this.position.y-cameraPos.y)/3
            }
            else if(!this.overrideCameraMotion){
                cameraPos.x += (this.position.x-cameraPos.x)/3
                cameraPos.y += (this.position.y-cameraPos.y)/3
            }

            if(!this.overrideMovement){
                if(this.isPressed.KeyW){
                    this.velocity.y -= this.speed
                }
                if(this.isPressed.KeyA){
                    this.velocity.x -= this.speed
                }
                if(this.isPressed.KeyS){
                    this.velocity.y += this.speed
                }
                if(this.isPressed.KeyD){
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
                    currentScriptCtx = this.scriptCtx[i]
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
        currentScriptPlayer = this
        if(!this.overrideDraw){
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


window.onbeforeunload = function(e){
    connected = false
    socket.emit('clientDisconnect', {token: localPlayer.token});

    clearInterval(updateInterval)
    clearInterval(syncInterval)
}

document.addEventListener('keydown', function(e){
    //if(localPlayer.isPressed[e.code] !== undefined && document.activeElement == document.body){
    if(document.activeElement == document.body){
        if(!localPlayer.isPressed[e.code]){
            localPlayer.isPressed[e.code] = true
            localPlayer.onPress[e.code] = true
            if(connected) socket.emit('clientSyncControls', {token: localPlayer.token, control: e.code, state: true})
        }
    }
})

document.addEventListener('keyup', function(e){
    //if(localPlayer.isPressed[e.code] !== undefined && document.activeElement == document.body){
    if(document.activeElement == document.body){
        localPlayer.isPressed[e.code] = false
        if(connected) socket.emit('clientSyncControls', {token: localPlayer.token, control: e.code, state: false})
    }
})

function mouseEvent(e, state, isTouch=false){
    let code = "MouseM"
    if(isTouch){
        code = "MouseL"
    }else{
        if(e.button == 0)
            code = "MouseL"
        else if(e.button == 2)
            code = "MouseR"
    }

    localPlayer.onPress[code] = state
    localPlayer.isPressed[code] = state
    if(connected) socket.emit('clientSyncControls', {token: localPlayer.token, control: code, state: state})
}

function onMouseDown(e, isTouch=false){
    if(connected) socket.emit('clientSync', {token: localPlayer.token, hp: localPlayer.hp, mousePos: localPlayer.mousePos, position: localPlayer.position});
    mouseEvent(e, true, isTouch)
}

function onMouseUp(e, isTouch=false){
    mouseEvent(e, false, isTouch)
}

function onMouseMove(e, isTouch=false){
    clientMousePos.x = e.clientX
    clientMousePos.y = e.clientY
}

gCanvas.addEventListener('mousedown', function(e){
    onMouseDown(e)
})

gCanvas.addEventListener('mouseup', function(e){
    onMouseUp(e)
})

gCanvas.addEventListener('mousemove', function(e){
    onMouseMove(e)
})



gCanvas.addEventListener("touchstart", function(e){
    if(e.changedTouches[0])
        onMouseDown(e.changedTouches[0], true)
}, false);
gCanvas.addEventListener("touchend", function(e){
    if(e.changedTouches[0])
        onMouseUp(e.changedTouches[0], true)
}, false);
gCanvas.addEventListener("touchcancel",function(e){
    if(e.changedTouches[0])
        onMouseUp(e.changedTouches[0], true)
}, false);
gCanvas.addEventListener("touchmove", function(e){
    if(e.changedTouches[0])
        onMouseMove(e.changedTouches[0], true)
}, false);



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

    cameraShakeTargetVector._set(Math.random()-0.5, Math.random()-0.5)._mul(cameraShakeAmount)
    cameraShakeVector.x += (cameraShakeTargetVector.x-cameraShakeVector.x)/5
    cameraShakeVector.y += (cameraShakeTargetVector.y-cameraShakeVector.y)/5 
    cameraPos._add(cameraShakeVector)
    cameraShakeAmount = Math.max(cameraShakeAmount/1.1, 1)-1


    //draw
    ctxTransform[4] = -cameraPos.x + gCanvas.width/2
    ctxTransform[5] = -cameraPos.y + gCanvas.height/2
    restoreTransform()

    gCtx.clearRect(cameraPos.x-gCanvas.width/2, cameraPos.y-gCanvas.height/2, gCanvas.width, gCanvas.height)

    if(gameMap.bgImage) drawImage(gCtx, gameMap.bgImage, 0, 0, gameMap.bgImage.naturalWidth, 0)

    //for(var i=0; i<gameMap.colliders.length; i++) gameMap.colliders[i].draw(gCtx)

    for(var i=0; i<players.length; i++){
        players[i].draw(gCtx)
    }

    delta = (Date.now() - lastCalledTime)/1000
    lastCalledTime = Date.now()
    fps = 1/delta

    window.requestAnimationFrame(update);
}
function syncronize(){
    if(connected) socket.emit('clientSync', {token: localPlayer.token, hp: localPlayer.hp, mousePos: localPlayer.mousePos, position: localPlayer.position});
    fpsText.innerHTML = Math.round(fps)
}

window.requestAnimationFrame(update);

//updateInterval = setInterval(update, 1000/60)
syncInterval = setInterval(syncronize, 1000/18)


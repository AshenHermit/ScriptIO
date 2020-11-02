
function ScriptContext(script, player){
    this._script = script
    eval(this._script)
    if(this.init && !this.disabled)
        this.init(player)
}

function Player(data){
    this.uid = data.uid
    this.token = data.token
    this.username = "player"

    this.controls = {
        "KeyW": false,
        "KeyA": false,
        "KeyS": false,
        "KeyD": false,
        "Space": false
    }

    this.scriptCtx = []
    
    this.velocity = vector2()
    this.position = vector2(64, gCanvas.height - 64)
    this.mousePos = vector2()
    this.speed = 1
    this.overrideMovement = false

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
        if(this.token){ // is local player
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
            this.position._add((this.velocity.sub(this.position)).div(5.0))
        }

        //
        for(var i=0; i<this.scriptCtx.length; i++){
            if(this.scriptCtx[i].update && !this.scriptCtx[i].disabled) this.scriptCtx[i].update(this)
        }
    }

    this.draw = function(ctx){
        ctx.fillStyle = "#fff"
        ctx.fillRect(this.position.x - 4, this.position.y - 4, 8, 8)
        
        //
        for(var i=0; i<this.scriptCtx.length; i++){
            if(this.scriptCtx[i].draw && !this.scriptCtx[i].disabled) this.scriptCtx[i].draw(ctx, this)
        }
    }
}





// listeners
// disconnection
window.addEventListener("beforeunload", function(e){
    connected = false
    socket.emit('clientDisconnect', {token: localPlayer.token});
}, false);

document.addEventListener('keydown', function(e){

    if(localPlayer.controls[e.code] !== undefined && document.activeElement == document.body){
        localPlayer.controls[e.code] = true
        if(connected) socket.emit('clientSyncControls', {token: localPlayer.token, controls: localPlayer.controls})
    }
})

document.addEventListener('keyup', function(e){
    if(localPlayer.controls[e.code] !== undefined && document.activeElement == document.body){
        localPlayer.controls[e.code] = false
        if(connected) socket.emit('clientSyncControls', {token: localPlayer.token, controls: localPlayer.controls})
    }
})

document.addEventListener('mousemove', function(e){
    localPlayer.mousePos.x = e.clientX
    localPlayer.mousePos.y = e.clientY
})

window.addEventListener('resize', function(e){
    gCanvas.width = window.innerWidth
    gCanvas.height = window.innerHeight
})




// intervals

function update(){
    gCtx.clearRect(0, 0, gCanvas.width, gCanvas.height)

    //update
    for(var i=0; i<players.length; i++){
        players[i].update()
    }

    for(var i=0; i<players.length; i++){
        players[i].draw(gCtx)
    }

    for(var i=0; i<colliders.length; i++){
        colliders[i].draw(gCtx)
    }
}
function syncronize(){
    if(connected) socket.emit('clientSync', {token: localPlayer.token, mousePos: localPlayer.mousePos, position: localPlayer.position});
}

setInterval(update, 1000/60)
setInterval(syncronize, 1000/16)


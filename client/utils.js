// functions

/**
 * @param {String} script Script
 */
function getScriptTitle(script){
    let i = script.indexOf("//")
    return script.substring(i+2, script.indexOf("\n", i)).trim()
}

/**
 * @param {String} script Script
 */
function getScriptDescription(script){
    let i = script.indexOf("//", script.indexOf("//")+2)
    return script.substring(i+2, script.indexOf("\n", i)).trim()
}

/**
 * @param {String} s Script
 * @param {String} i Id in list
 */
function getScriptShopItem(s, i, globalCategory=true){
    let com1 = s.indexOf("//")
        let nl1 = s.indexOf("\n", com1)
        let title = getScriptTitle(s)
        let description = ""
        if(s.charAt(nl1+1) == "/") {
            description = getScriptDescription(s)
        }
        console.log(globalCategory)

        return `
<div class="item">
    `+(!globalCategory ? ('<div onclick="deleteScriptFromServerScripts('+i+')" class="delete button"></div>') : '')+`
    <div class="title">`+title+`</div>
    <div class="description">`+description+`</div>
    <div onclick="loadScriptFromShop(`+i+`, `+globalCategory+`)" class="load-button button">load</div>
</div>`
}

function getPlayerIdByUid(uid){
    return players.findIndex(x => x.uid == uid)
}

function cameraShake(amount){
    cameraShakeAmount += amount
}

function restoreTransform(){
    gCtx.setTransform(
        ctxTransform[0],
        ctxTransform[1],
        ctxTransform[2],
        ctxTransform[3],
        ctxTransform[4],
        ctxTransform[5]);
}
function addTransform(){
    gCtx.setTransform(
        ctxTransform[0] * arguments[0],
        ctxTransform[1] + arguments[1],
        ctxTransform[2] + arguments[2],
        ctxTransform[3] * arguments[3],
        ctxTransform[4] + arguments[4],
        ctxTransform[5] + arguments[5]);
}

function createImage(src){
    var img = new Image()
    img.isLoaded = false
    img.onload = function(e){
        this.isLoaded = true
    }
    img.computedHeight = 1
    img.src = src
    return img
}

function drawLine(ctx, color, width, fromX, fromY, toX, toY){
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
}

function drawImage(ctx, img, x, y, width, angle=0){
    if(img.isLoaded){
        addTransform(1,0,0,1,x,y); // set position of image center
        ctx.rotate(angle); // rotate
        img.computedHeight = (img.height/img.width)*width
        ctx.drawImage(img,-width/2,-img.computedHeight/2, width, img.computedHeight);
        restoreTransform()
    }
}

function drawWithTransform(ctx, drawFunc, x, y, scale, angle=0){
    addTransform(scale,0,0,scale,x,y);
    ctx.rotate(angle); // rotate
    drawFunc()
    restoreTransform()
}

function drawImagePlus(ctx, img, x, y, width, angle=0, ox=0, oy=0, mirrorX=false, mirrorY=false){
    if(img.isLoaded){
        //ctx.setTransform((mirrorX ? -1 : 1),0,0,(mirrorY ? -1 : 1),x,y); // set position of image center
        addTransform(1,0,0,1,x,y); // set position of image center
        ctx.rotate(angle); // rotate
        ctx.scale((mirrorX ? -1 : 1), (mirrorY ? -1 : 1))
        img.computedHeight = (img.height/img.width)*width
        ctx.drawImage(img,-width/2*(mirrorX ? -1 : 1)+ox,-img.computedHeight/2*(mirrorY ? -1 : 1)+oy, width*(mirrorX ? -1 : 1), img.computedHeight*(mirrorY ? -1 : 1));
        //ctx.setTransform(1,0,0,1,0,0); // restore default transform
        restoreTransform()
    }
}


// get line intersection point
function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {

    // Check if none of the lines are of length 0
    if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
        return false
    }

    denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))

    // Lines are parallel
    if (denominator === 0) {
        return false
    }

    let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator
    let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator

    // is the intersection along the segments
    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
        return false
    }

    // Return a object with the x and y coordinates of the intersection
    let x = x1 + ua * (x2 - x1)
    let y = y1 + ua * (y2 - y1)

    return {x, y}
}

function lineLineIntersect(p1, p2, p3, p4){
    return intersect(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y)
}

function lineColliderIntersect(p1, p2, col){
    return lineLineIntersect(p1, p2, col.p1, col.p2)
}

function lineMapIntersect(p1, p2, physics=false){
    var point = null
    var maxDist = 0
    var col = -1
    for(var c=0; c<gameMap.colliders.length; c+=1){
        var p = lineColliderIntersect(p1, p2, gameMap.colliders[c])
        if((physics && gameMap.colliders[c].physics) || !physics){
            if(p){
                dist = ((p.x-p1.x)**2 + (p.y-p1.y)**2)**(0.5)
                if(point){
                    if(dist < maxDist){
                        point = p
                        maxDist = dist
                        col = c
                    }
                }else{
                    point = p
                    maxDist = dist
                    col = c
                }
            }
        }
    }

    if(point)
        point.collider = gameMap.colliders[col]

    return point
}


function physicsStep(position, velocity, margin){
    
    var p2x = vector2(velocity.x + (margin * (velocity.x<0 ? -1 : 1)), 0)._add(position)
    var p2y = vector2(0, velocity.y + (margin * (velocity.y<0 ? -1 : 1)))._add(position)

    let point = lineMapIntersect(position, p2x, true)

    let isOnFloor = false
    if(point){
        // x
        if(position.x < point.x)
            position.x = point.x-margin
        else
            position.x = point.x+margin

        velocity.x = 0
    }
    position.x+=velocity.x*2
    point = lineMapIntersect(position, p2y, true)
    if(point){
        // y
        if(position.y < point.y)
            position.y = point.y-margin
        else
            position.y = point.y+margin

        velocity.y = 0
        isOnFloor = true
    }
    position.y+=velocity.y
    position.x-=velocity.x*1

    return isOnFloor
}

function buildMap(data){
    gameMap.colliders = []
    nextColliderId = 0
    gameMap.bgImage = new Image()
    gameMap.bgImage.isLoaded = false
    gameMap.bgImage.onload = function(){
        let scale = gameMap.bgImage.naturalWidth / 5
        data.colliders.forEach(col => {
            gameMap.colliders.push(new Collider(col.p1.x*scale, col.p1.y*scale, col.p2.x*scale, col.p2.y*scale))
        })
        gameMap.bgImage.isLoaded = true
    }
    gameMap.bgImage.src = data.image
}

function loadMap(mapName){
    socket.emit('clientLoadMap', {name: mapName})
}

function destroyCollider(col){
    gameMap.colliders.splice(gameMap.colliders.findIndex(x=>x.uid==col.uid), 1)
}

function createCollider(col){
    gameMap.colliders.push(col)
}

var creationWaitingList = []

function instantiate(player, scriptContext, containerName, object, syncParams){
    if(player.token){
        var data = {
            token: player.token,
            scriptCtxId: scriptContext._id,
            containerName: containerName,
            objectId: scriptContext[containerName].length-1,
            params: {}
        }
        syncParams.forEach(key => {
            data.params[key] = object[key]
        })
        scriptContext[containerName].push(object)
        if(object.init) object.init(player)
        socket.emit('clientSyncInstantiate', data)
    }
    else{
        // var data = {
        //     playerUid: player.uid,
        //     scriptCtxId: scriptContext._id,
        //     containerName: containerName,
        // }
        // creationWaitingList.push(data)
        scriptContext[containerName].push(object)
    }
}

function socketInstantiateObject(data){
    console.log(data)
    let obj = playerByUid[data.uid].scriptCtx[data.scriptCtxId][data.containerName][data.objectId]
    Object.assign(obj, data.params)
    obj.init(playerByUid[data.uid])
}



function RNG(seed) {
    // LCG using GCC's constants
    this.m = 0x80000000; // 2**31;
    this.a = 1103515245;
    this.c = 12345;

    this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
}
RNG.prototype.nextInt = function() {
    this.state = (this.a * this.state + this.c) % this.m;
    return this.state;
}
RNG.prototype.nextFloat = function() {
    // returns in range [0,1]
    return this.nextInt() / (this.m - 1);
}
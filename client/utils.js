// functions
function getPlayerIdByUid(uid){
    return players.findIndex(x => x.uid == uid)
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

function drawImage(ctx, img, x, y, angle, width){
    addTransform(1,0,0,1,x,y); // set position of image center
    ctx.rotate(angle); // rotate
    var height = (img.height/img.width)*width
    ctx.drawImage(img,-width/2,-height/2, width, height);
    restoreTransform()
}

function drawWithTransform(ctx, drawFunc, x, y, angle, scale){
    addTransform(scale,0,0,scale,x,y);
    ctx.rotate(angle); // rotate
    drawFunc()
    restoreTransform()
}

function drawImagePlus(ctx, img, x, y, angle, width, ox=0, oy=0, mirrorX=false, mirrorY=false){
    //ctx.setTransform((mirrorX ? -1 : 1),0,0,(mirrorY ? -1 : 1),x,y); // set position of image center
    addTransform(1,0,0,1,x,y); // set position of image center
    ctx.rotate(angle); // rotate
    ctx.scale((mirrorX ? -1 : 1), (mirrorY ? -1 : 1))
    var height = (img.height/img.width)*width
    ctx.drawImage(img,-width/2*(mirrorX ? -1 : 1)+ox,-height/2*(mirrorY ? -1 : 1)+oy, width*(mirrorX ? -1 : 1), height*(mirrorY ? -1 : 1));
    //ctx.setTransform(1,0,0,1,0,0); // restore default transform
    restoreTransform()
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

function lineMapIntersect(p1, p2){
    var point = null
    var maxDist = 0

    for(var c=0; c<gameMap.colliders.length; c+=1){
        var p = lineColliderIntersect(p1, p2, gameMap.colliders[c])
        if(p){
            dist = ((p.x-p1.x)**2 + (p.y-p1.y)**2)**(0.5)
            if(point){
                if(dist < maxDist){
                    point = p
                    maxDist = dist
                }
            }else{
                point = p
                maxDist = dist
            }
        }
    }

    return point
}


function physicsStep(position, velocity, margin){
    var point = [0, 0]
    var maxDist = [0, 0]

    var p2x = vector2(velocity.x + (margin * (velocity.x<0 ? -1 : 1)), 0)._add(position)
    var p2y = vector2(0, velocity.y + (margin * (velocity.y<0 ? -1 : 1)))._add(position)

    // gCtx.strokeStyle = "#f00"
    // gCtx.beginPath();
    // gCtx.moveTo(position.x+16, position.y);
    // gCtx.lineTo(p2y.x+16, p2y.y);
    // gCtx.stroke();

    for(var c=0; c<gameMap.colliders.length; c+=1){
        var p = [0, 0]
        p[0] = lineColliderIntersect(position, p2x, gameMap.colliders[c])
        p[1] = lineColliderIntersect(position, p2y, gameMap.colliders[c])

        for(var i=0; i<2; i+=1){
            if(p[i]){
                dist = ((p[i].x-position.x)**2 + (p[i].y-position.y)**2)**(0.5)
                if(point[i]){
                    if(dist < maxDist[i]){
                        point[i] = p[i]
                        maxDist[i] = dist
                    }
                }else{
                    point[i] = p[i]
                    maxDist[i] = dist
                }
            }
        }
    }
    let isOnFloor = false
    if(point[0]){
        // x
        if(position.x < point[0].x)
            position.x = point[0].x-margin
        else
            position.x = point[0].x+margin

        velocity.x = 0
    }
    if(point[1]){
        // y
        if(position.y < point[1].y)
            position.y = point[1].y-margin
        else
            position.y = point[1].y+margin

        velocity.y = 0
        isOnFloor = true
    }
    return isOnFloor
}

function buildMap(data){
    gameMap.colliders = []
    nextColliderId = 0
    gameMap.bgImage = new Image()
    gameMap.bgImage.onload = function(){
        let scale = gameMap.bgImage.naturalWidth / 5
        data.colliders.forEach(col => {
            gameMap.colliders.push(new Collider(col.p1.x*scale, col.p1.y*scale, col.p2.x*scale, col.p2.y*scale))
        })
    }
    gameMap.bgImage.src = data.image
}

function loadMap(mapName){
    socket.emit('clientLoadMap', {name: mapName})
}

function destroyCollider(col){
    gameMap.colliders.splice(gameMap.findIndex(x=>x.uid==col.uid), 1)
}
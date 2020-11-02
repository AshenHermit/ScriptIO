// functions
function getPlayerIdByUid(uid){
    return players.findIndex(x => x.uid == uid)
}

function drawImage(ctx, img, x, y, angle, width){
    ctx.setTransform(1,0,0,1,x,y); // set position of image center
    ctx.rotate(angle); // rotate
    var height = (img.height/img.width)*width
    ctx.drawImage(img,-width/2,-height/2, width, height); // draw image offset so its center is at x,y
    ctx.setTransform(1,0,0,1,0,0); // restore default transform
}

function drawImageWithOrigin(ctx, img, x, y, angle, width, ox=0, oy=0){
    ctx.setTransform(1,0,0,1,x+ox,y+oy); // set position of image center
    ctx.rotate(angle); // rotate
    var height = (img.height/img.width)*width
    ctx.drawImage(img,-width/2,-height/2, width, height); // draw image offset so its center is at x,y
    ctx.setTransform(1,0,0,1,0,0); // restore default transform
}

function drawImageScale(ctx, img, x, y, angle, scaleX, scaleY){
    ctx.setTransform(scaleX,0,0,scaleY,x,y); // set position of image center
    ctx.rotate(angle); // rotate
    ctx.drawImage(img,-img.width/2,-img.height/2); // draw image offset so its center is at x,y
    ctx.setTransform(1,0,0,1,0,0); // restore default transform
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


function physicsStep(position, velocity, margin){
    var point = [0, 0]
    var maxDist = [0, 0]

    var p2x = vector2(velocity.x + (margin * (velocity.y<0 ? -1 : 1)), 0)._add(position)
    var p2y = vector2(0, velocity.y + (margin * (velocity.y<0 ? -1 : 1)))._add(position)

    // gCtx.strokeStyle = "#f00"
    // gCtx.beginPath();
    // gCtx.moveTo(position.x+16, position.y);
    // gCtx.lineTo(p2y.x+16, p2y.y);
    // gCtx.stroke();

    for(var c=0; c<colliders.length; c+=1){
        var p = [0, 0]
        p[0] = lineColliderIntersect(position, p2x, colliders[c])
        p[1] = lineColliderIntersect(position, p2y, colliders[c])

        for(var i=0; i<2; i+=1){
            if(p[i]){
                dist = ((point[i].x-position.x)**2 + (point[i].y-position.y)**2)**(0.5)
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
        isOnFloor = true
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
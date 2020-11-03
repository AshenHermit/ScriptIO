function _vector2(_x, _y){
    this.x = _x
    this.y = _y
    //
    this._add = (v)=>{
        if(v.x !== undefined){
            this.x += v.x; this.y += v.y;
        }else{
            this.x += v; this.y += v;
        }
        return this
    }
    this.add = (v)=>{
        return new _vector2(this.x, this.y)._add(v)
    }
    //
    this._sub = (v)=>{
        if(v.x !== undefined){
            this.x -= v.x; this.y -= v.y;
        }else{
            this.x -= v; this.y -= v;
        }
        return this
    }
    this.sub = (v)=>{
        return new _vector2(this.x, this.y)._sub(v)
    }
    //
    this._div = (v)=>{
        if(v.x !== undefined){
            this.x /= v.x; this.y /= v.y;
        }else{
            this.x /= v; this.y /= v;
        }
        return this
    }
    this.div = (v)=>{
        return new _vector2(this.x, this.y)._div(v)
    }
    //
    this._mul = (v)=>{
        if(v.x !== undefined){
            this.x *= v.x; this.y *= v.y;
        }else{
            this.x *= v; this.y *= v;
        }
        return this
    }
    this.mul = (v)=>{
        return new _vector2(this.x, this.y)._mul(v)
    }
    //
    this._set = (v, y)=>{
        if(v.x !== undefined){
            this.x = v.x; this.y = v.y;
        }else{
            this.x = v; this.y = y;
        }
        return this
    }
    this.magnitude = ()=>{
        return (this.x**2 + this.y**2)**(1/2)
    }
    //
    this._normalize = ()=>{
        this._div(this.magnitude())
        return this
    }
    //
    this.toObj = ()=>{return {x: this.x, y:this.y}}
}
function vector2(_x=0, _y=0){
    return new _vector2(_x, _y)
}

var nextColliderId = 0

function Collider(x1, y1, x2, y2){
    this.p1 = vector2(x1, y1)
    this.p2 = vector2(x2, y2)

    this.uid = nextColliderId
    nextColliderId+=1

    this.draw = function(ctx){
        ctx.strokeStyle = "#fff"
        ctx.beginPath();
        ctx.moveTo(this.p1.x, this.p1.y);
        ctx.lineTo(this.p2.x, this.p2.y);
        ctx.stroke();
    }
}
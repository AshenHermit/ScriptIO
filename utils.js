function generateToken(){
    var out = ""
    for(var i=0; i<3; i++){
        out += Math.random().toString(36).substr(2)
    }
    return out
}
var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/javascript");


var testScript = `
this.targetPos = vector2()
this.update = function(player){
    this.targetPos._set(player.mousePos)
}
this.draw = function(ctx){
    ctx.fillStyle = "#ff2020"
    ctx.fillRect(this.targetPos.x - 2, this.targetPos.y - 2, 4, 4)
}
`

// variables
var socket = io.connect(window.location.href);

var gCanvas = document.getElementById("game_canvas")
gCanvas.width = window.innerWidth
gCanvas.height = window.innerHeight
var gCtx = gCanvas.getContext("2d")

var scriptsShopList = document.getElementById("scripts_shop_list")

var scriptsShop = {}
var localScripts = []

var players = []
var staticRects = []

var playerByUid = {}
var localPlayer = null

var connected = false;

var clientMousePos = vector2()
var cameraPos = vector2()
var ctxTransform = [1, 0, 0, 1, 0, 0]

var editPanel = document.getElementById("edit_panel")
var editorState = false

// intervals
var updateInterval
var syncInterval

var gameMap = {
    bgImage: null,
    colliders: []
}

//map 
gameMap.colliders.push(new Collider(-512, 32, 1024, 32))
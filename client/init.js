ace.require("ace/ext/language_tools");
var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/javascript");
var langTools = ace.require("ace/ext/language_tools");
var snippetManager = ace.require("ace/snippets").snippetManager;


//completers
function functionToSnippet(func){
    let text = func.toString()
    text = text.substring(text.indexOf("function ")+"function ".length, text.indexOf(")")+1)
    let name = text.substring(0, text.indexOf("(")).trim()
    let arguments = text.substring(text.indexOf("("), text.indexOf(")")+1).trim()
    let snippet = text

    let snippetArgs = []

    arguments
    .replaceAll(" ", "")
    .replaceAll("(", "")
    .replaceAll(")", "")
    .split(",")
    .forEach((arg)=>{
        snippetArgs.push("${" + (snippetArgs.length+1) + ":" + arg.split("=")[0] + "}")
    })

    return {
        name: text,
        caption: name,
        snippet: name + "(" + snippetArgs.join(", ") + ")",
        meta: arguments
    }
}

var functions = [
    drawImage,
    drawImagePlus,
    drawWithTransform,

    updateArray,
    drawArray,
    destroyArray,

    lineLineIntersect,
    lineColliderIntersect,
    lineMapIntersect,
    physicsStep,

    createCollider,
    destroyCollider,

    cameraShake,
    getObjectIdOnPosition,
    pickUpObjectInArray,
    createImage,

    drawLine,

    restoreTransform,
    addTransform,

    addToInventory,

    broadcast,

    random,
]

var completer = {
    getCompletions: function(editor, session, pos, prefix, callback) {
        var completions = functions.map(functionToSnippet);

        completions.push({
            name: "inputText",
            caption: "inputText",
            snippet: "inputText(${1:label}, (value)=>{${0}})",
            meta: "(label)"
        })

        callback(null, completions);
    }
}
langTools.setCompleters([completer]);

editor.setOptions({
	enableBasicAutocompletion: true,
	enableSnippets: true    
});

//


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
var serverScriptsShopList = document.getElementById("server_scripts_shop_list")

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
var fileDropArea = document.getElementById("file_drop_area")
var editorState = false

// intervals
var updateInterval
var syncInterval

var lastCalledTime = Date.now();
var fps = 0
var fpsText = document.getElementById("fps_text")

var cameraShakeAmount = 0
var cameraShakeVector = vector2()
var cameraShakeTargetVector = vector2()

var gameMap = {
    bgImage: null,
    colliders: []
}

var inventoryList = document.getElementById("inventory_list")
var inventory = []
var selectedItem = null

var currentScriptCtx = null
var currentScriptPlayer = null

// prompt
var promptState = false
var promptEl = document.getElementById("prompt")
var promptCallback = null

//map 
//gameMap.colliders.push(new Collider(-512, 32, 1024, 32))
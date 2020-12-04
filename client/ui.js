// ui
var selectedScriptId = -1

function updateScriptsList(){
    document.getElementById("scripts_list").innerHTML = 
    localScripts.map((s, i)=>{
        // check if disabled
        let disabled = 0
        let disIdx = s.indexOf("this.disabled")
        if(disIdx!=-1){
            let value = s.substring(s.indexOf("=", disIdx)+1, s.indexOf("\n", disIdx)).replaceAll(" ", "")
            if(value != "0" && value != "false" && value != "null"){disabled = true}
        }

        return `<div onClick="onScriptSelect(`+i+`)" data-script-id="`+i+`" class="item button `+(selectedScriptId==i ? "active" : "")+` `+(disabled ? "disabled" : "")+`">`+ 
            getScriptTitle(s)
        +`</div>`
    }).join("\n")
}

function onAddScript(){
    localScripts.push("// new_script\n")
    selectedScriptId = localScripts.length-1
    editor.setValue(localScripts[selectedScriptId])
    updateScriptsList()
}

function updateScript(){
    localScripts[selectedScriptId] = editor.getValue()
}

function onScriptSelect(i, isLoading=false){
    if(!isLoading && selectedScriptId!=-1) updateScript()
    selectedScriptId = i
    editor.setValue(localScripts[i])
    updateScriptsList()
}

function onApplyScripts(){
    updateScript()
    updateScriptsList()
    localPlayer.setupScripts(localScripts)
}

function onDeployScripts(){
    updateScript()
    updateScriptsList()
    localPlayer.setupScripts(localScripts, false)
    localPlayer.emitScripts(false)
}

function onUpdateScripts(){
    updateScript()
    updateScriptsList()
    localPlayer.setupScripts(localScripts, true)
    localPlayer.emitScripts(true)
}

function onEditorShow(){
    document.getElementById("editor").style.display = document.getElementById("editor").style.display=="none" ? "" : "none"
    document.getElementById("scripts_list").style.display = document.getElementById("scripts_list").style.display=="none" ? "" : "none"
    document.getElementById("scripts_shop").style.display = document.getElementById("scripts_shop").style.display=="none" ? "" : "none"
    editorState = !editorState
}

// file input
var fileInput = document.createElement("input")
fileInput.type = "file"
function loadJsonData(files){
    if(files.length>0){
        files[0].text().then(function(data){
            var data = JSON.parse(data)
            console.log();

            if(data.scripts){
                localScripts = data.scripts
                if(localScripts.length>0) onScriptSelect(0, true)
            }

            if(data.serverScripts){
                scriptsShop.serverScripts = data.serverScripts
                updateServerScriptsList()
            }
        })
    }
}
fileInput.onchange = function(){
    loadJsonData(fileInput.files)
    fileInput.value = ""
}

// hotkeys: ctrl shift s, ctrl s ...
document.addEventListener("keydown", function(e) {
    if(promptState){
        if (e.code == "Enter") {
            promptState = false
            promptEl.style.display = "none"
            promptCallback(document.getElementById("prompt_input").value)
            document.getElementById("prompt_input").value = ""
            document.body.focus()
        }
    }else{

        //save
        if (e.ctrlKey && e.shiftKey && e.code == "KeyS") {
            e.preventDefault()
            download(JSON.stringify({scripts: localScripts}, 0, 4), "scriptIoSave.json", "text/plain")
        }else
        if (e.ctrlKey && e.code == "KeyS") {
            e.preventDefault()
            updateScript()
            updateScriptsList()
        }

        //open
        if (e.ctrlKey && e.shiftKey && e.code == "KeyO") {
            e.preventDefault()
            fileInput.click()
        }

        //disconnect
        if (e.ctrlKey && e.shiftKey && e.code == "KeyD") {
            e.preventDefault()
            connected = false
            socket.emit('clientDisconnect', {token: localPlayer.token});
            setTimeout(()=>{window.close()}, 1000)
        }
    }

}, false)

function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

function updateServerScriptsList(){
    serverScriptsShopList.innerHTML = 
    scriptsShop.serverScripts.map((s, i) => getScriptShopItem(s, i, false)).join("")
}


var contextMenu = document.getElementById("context_menu")
contextMenu.style.display = "none"

var ctxMenuTarget = null
var scriptId

function setCtxMenuState(state){
    contextMenu.style.display = state ? "" : "none"
}

function ctxMenuFunction(e){

    if(e.target.innerText == "emit"){
        updateScriptsList()
        localPlayer.setupScripts([localScripts[scriptId]], true, scriptId)
        localPlayer.emitScripts(true, scriptId)
        setCtxMenuState(false)
    }

    // upload to server shop
    else if(e.target.innerText == "upload to server shop"){
        let title = getScriptTitle(localScripts[scriptId])
        let id = scriptsShop.serverScripts.findIndex(x => (getScriptTitle(x) == title))
        if(id == -1){
            scriptsShop.serverScripts.push(localScripts[scriptId])
        }else{
            scriptsShop.serverScripts[id] = localScripts[scriptId]
        }
        socket.emit('clientServerScriptsUpdate', {serverScripts: scriptsShop.serverScripts})
        setCtxMenuState(false)
    }

    // disabling / enabling
    else if(e.target.innerText == "disable/enable"){
        var s = localScripts[scriptId]
        let disIdx = s.indexOf("this.disabled")
        if(disIdx != -1 && (s.charAt(disIdx-1) == "\n" || disIdx==0)){
            let value = s.substring(s.indexOf("=", disIdx)+1, s.indexOf("\n", disIdx)).replaceAll(" ", "")
            let disabled = (value != "0" && value != "false" && value != "null")
            s = 
            s.substring(0, disIdx)
            + "this.disabled = " + (disabled ? "false" : "true")
            + s.substring(s.indexOf("\n", disIdx))
        }else{
            s = "this.disabled = true\n"+s
        }
        localScripts[scriptId] = s
        setCtxMenuState(false)
        updateScriptsList()
        if(selectedScriptId == scriptId) editor.setValue(localScripts[scriptId])
    }
    // moving
    else if(e.target.innerText == "move up" || e.target.innerText == "move down"){
        let dir = (e.target.innerText == "move down" ? 1 : -1)
        if(!(dir == -1 && scriptId==0) && !(dir == 1 && scriptId>=localScripts.length-1)){
            var b = localScripts[scriptId];
            localScripts[scriptId] = localScripts[scriptId+dir];
            localScripts[scriptId+dir] = b;
            if(selectedScriptId == scriptId) selectedScriptId+=dir
            else if(selectedScriptId == scriptId+dir) selectedScriptId-=dir
            scriptId += dir
            updateScriptsList()
        }
        //setCtxMenuState(false)
    }
    // deleting
    else if(e.target.innerText == "delete"){
        //let canDelete = confirm('delete script "' + ctxMenuTarget.innerText + '" ?');
        let canDelete = true;
        if(canDelete){
            localScripts.splice(scriptId, 1)
            if(selectedScriptId == scriptId){
                editor.setValue("")
                selectedScriptId = -1
            }else if(scriptId < selectedScriptId){
                selectedScriptId -= 1
            }
            updateScriptsList()
        }
        setCtxMenuState(false)
    }
}

var contextItems = contextMenu.children
for(var i=0; i<contextItems.length; i++){
    contextItems[i].onclick = ctxMenuFunction
}

document.addEventListener('contextmenu', function(e) {
    if(e.target.parentNode.id=="scripts_list"){
        setCtxMenuState(false)
        e.preventDefault()
        contextMenu.style.left = e.pageX+"px"
        contextMenu.style.top  = e.pageY+"px"
        setCtxMenuState(true)
        ctxMenuTarget = e.target
        scriptId = parseInt(ctxMenuTarget.getAttribute("data-script-id"))
    }else if(e.target == contextMenu || e.target.parentNode==contextMenu){
        e.preventDefault()
    }
}, false);

gCanvas.addEventListener('contextmenu', function(e) {
    e.preventDefault()
}, false);

document.addEventListener('click', function(e) {
    if(e.target!=contextMenu && e.target.parentNode!=contextMenu){
        setCtxMenuState(false)
    }
}, false);

editPanel.addEventListener('dragenter', function(e){
    e.stopPropagation()
    e.preventDefault()
    fileDropArea.style.display = ""
}, false)
editPanel.addEventListener('dragleave', function(e){
    e.stopPropagation()
    e.preventDefault()
    fileDropArea.style.display = "none"
}, false)
editPanel.addEventListener('drop', function(e){
    e.stopPropagation()
    e.preventDefault()
    loadJsonData(e.dataTransfer.files)
    fileDropArea.style.display = "none"
})
window.addEventListener("dragover",function(e){
    e = e || event;
    e.preventDefault();
},false);
window.addEventListener("drop",function(e){
    e = e || event;
    e.preventDefault();
},false);

// scripts shop

function loadScriptFromShop(id, globalCategory){
    if(globalCategory)
        localScripts.push(scriptsShop.scripts[id])
    else
        localScripts.push(scriptsShop.serverScripts[id])
    selectedScriptId = localScripts.length-1
    editor.setValue(localScripts[selectedScriptId])
    updateScriptsList()
}

function toggleCollection(e){
    if(e.innerText == "collection: global"){
        e.innerHTML = "collection: server"

        scriptsShopList.style.display = "none"
        serverScriptsShopList.style.display = ""
    }else{
        e.innerHTML = "collection: global"

        scriptsShopList.style.display = ""
        serverScriptsShopList.style.display = "none"
    }
}

function deleteScriptFromServerScripts(i){
    scriptsShop.serverScripts.splice(i, 1)
    socket.emit('clientServerScriptsUpdate', {serverScripts: scriptsShop.serverScripts})
}

// inventory

function inventoryItemSelect(el, id){
    localPlayer.selectedItem = localPlayer.inventory[id]
    let selectedEl = document.getElementsByClassName("selected-inventory-item")[0]
    if(selectedEl)
        selectedEl.classList.remove("selected-inventory-item");
    el.classList.add("selected-inventory-item")

    socket.emit('clientSelectInventoryItem', {token: localPlayer.token, itemId: id});
}

function updateInventoryList(){
    inventoryList.innerHTML = localPlayer.inventory.map((item, id)=>`
<div class="item button" onclick="inventoryItemSelect(this, `+id+`)">
<div class="image"><img src="`+ item.image.src +`"/></div>
<div class="name">`+ item.name +`</div>
</div>`).join("")
}

function onInventoryTitleClick(){
    inventoryList.style.display = inventoryList.style.display=="none" ? "" : "none"
}
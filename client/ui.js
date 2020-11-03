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
            s.substring(s.indexOf("//")+"//".length, s.indexOf("\n")).replaceAll(" ", "")
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
    localPlayer.emitScripts()
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
fileInput.onchange = function(){
    if(fileInput.files.length>0){
        fileInput.files[0].text().then(function(data){
            console.log(data)
            var data = JSON.parse(data)
            localScripts = data.scripts
            if(localScripts.length>0) onScriptSelect(0, true)
            fileInput.value = ""
        })
    }
}

// hotkeys: ctrl shift s, ctrl s ...
document.addEventListener("keydown", function(e) {
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

}, false)

function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}



var contextMenu = document.getElementById("context_menu")
contextMenu.style.display = "none"

var ctxMenuTarget = null

function setCtxMenuState(state){
    contextMenu.style.display = state ? "" : "none"
}

function ctxMenuFunction(e){
    // disabling / enabling
    if(e.target.innerText == "disable/enable"){
        scriptId = parseInt(ctxMenuTarget.getAttribute("data-script-id"))
        var s = localScripts[scriptId]
        let disIdx = s.indexOf("this.disabled")
        if(disIdx != -1 && s.substring(s.lastIndexOf("\n", disIdx)+1, disIdx) == ""){    
            let value = s.substring(s.indexOf("=", disIdx)+1, s.indexOf("\n", disIdx)).replaceAll(" ", "")
            let disabled = (value != "0" && value != "false" && value != "null")
            s = 
            s.substring(0, disIdx)
            + "this.disabled = " + (disabled ? "false" : "true")
            + s.substring(s.indexOf("\n", disIdx))
        }else{
            let nlIdx = s.indexOf("\n")
            s = 
            s.substring(0, nlIdx)
            + "\nthis.disabled = true"
            + s.substring(nlIdx)
        }
        localScripts[scriptId] = s
        setCtxMenuState(false)
        updateScriptsList()
        if(selectedScriptId == scriptId) editor.setValue(localScripts[scriptId])

    // moving
    }else if(e.target.innerText == "move up" || e.target.innerText == "move down"){
        scriptId = parseInt(ctxMenuTarget.getAttribute("data-script-id"))
        let dir = (e.target.innerText == "move down" ? 1 : -1) 
        if(!(dir == -1 && scriptId==0) && !(dir == 1 && scriptId>=localScripts.length-1)){
            var b = localScripts[scriptId];
            localScripts[scriptId] = localScripts[scriptId+dir];
            localScripts[scriptId+dir] = b;
            if(selectedScriptId == scriptId) selectedScriptId+=dir
            else if(selectedScriptId == scriptId+dir) selectedScriptId-=dir
            updateScriptsList()
        }
        setCtxMenuState(false)

    // deleting
    }else if(e.target.innerText == "delete"){
        scriptId = parseInt(ctxMenuTarget.getAttribute("data-script-id"))
        let canDelete = confirm('delete script "' + ctxMenuTarget.innerText + '" ?');
        if(canDelete){
            localScripts.splice(scriptId, 1)
            if(selectedScriptId == scriptId){
                editor.setValue("")
                selectedScriptId = -1
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
        console.log(e)
        contextMenu.style.left = e.pageX+"px"
        contextMenu.style.top  = e.pageY+"px"
        setCtxMenuState(true)
        ctxMenuTarget = e.target
    }else if(e.target == contextMenu || e.target.parentNode==contextMenu){
        e.preventDefault()
    }
}, false);

document.addEventListener('click', function(e) {
    if(e.target!=contextMenu && e.target.parentNode!=contextMenu){
        setCtxMenuState(false)
    }
}, false);



// scripts shop

function loadScriptFromShop(id){
    localScripts.push(scriptsShop.scripts[id])
    selectedScriptId = localScripts.length-1
    editor.setValue(localScripts[selectedScriptId])
    updateScriptsList()
}
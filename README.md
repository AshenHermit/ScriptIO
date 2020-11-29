# ScriptIO v0.30

Its multiplayer app where you can add scripts, edit, run and share them in runtime.  
At start you have just one player rect you can control, that synchronizes his position among other players. By writing scripts you can write your own behaviors and graphics on top of your player.

![screenshot_1](https://sun9-5.userapi.com/B3XvNZMJrclPEb7QTthA9K6gr3pd8-CcJit-8w/BNrly-2qX0o.jpg)

## Launching server on ip
```
node index.js <ip>
```

## Web application
I hosted this app on *Heroku* with free plan and of course his ping is higher than on the local server.  
Here it is: https://script-io.herokuapp.com/

## Editing maps
This app can parse map files whose content is just a list of colliders, so far.  
As a map editor I use *Blender* with my own exporter, you can download it from [here](https://drive.google.com/file/d/17z1lCW57oHxwiDmuP5jRW4_obvUO6ykc/view?usp=sharing).  
To write map file with it, you need:
* Create collection named with the name of the map.
* Сreate *Image Reference* object in collection.
* Сreate *Mesh* object and place dots and edges in it like so:  
![blender_screenshot](https://sun9-18.userapi.com/KOzpzaJ98mJe9YVhTqINEHzTmvzkQCSiibDkEQ/yRZaWfP51KQ.jpg)
* Choose *Map Export Path* in the *Scene Properties* and press export button.

To load map in game you need use this function in browser console: `loadMap("map name")`


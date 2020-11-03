# ScriptIO v0.24

Its multiplayer app where you can add scripts, edit, run and share them in runtime.  
At start you have just one player rect you can control, that synchronizes his position among other players. By writing scripts you can write your own behaviors and graphics on top of your player.

![screenshot_1](https://psv4.userapi.com/c856232/u576828276/docs/d9/33147f9790ae/ScriptIO.jpg?extra=K4tPDf7uzRSZ5qKValb_wsiVJr9A0Fj9-B3_SkPJY8LX3vn6r4RBXYg6YamwJ0e8w3zV4s5gLVMjkTYbv5_keQGvbR8kh_10SgsovkRczrTTIIXB3UBrHw1xkqFW0ILZMED7Hw87okM9z4Ueed85xzrN0g)

![screenshot_2](https://psv4.userapi.com/c856232/u576828276/docs/d11/f3984163dea0/ScriptIO.jpg?extra=CJQjaQGWV9KFdDEcBh5Ghx_jYzCreZ4bnHL50ztrvE_H7bqrDo8Vt0ZVoorzc8rlPAGRVwqenWqrbWR3JhKPGHj36GWzU_lJWGbaG-6X4Psm9rXxWIxBlF-aH34pzUzVTNIz_4uVR1xv3w4cGlK-xsQmag)

![screenshot_3](https://sun9-73.userapi.com/8QqJXYR2Ek_1Egfc1tONB174ptl4mxF4mDBxYw/Hml9I7E4jDo.jpg)

## Launching server on ip
```
node index.js <ip>
```

## Editing maps
This app can parse map files whose content is just a list of colliders, so far.  
As a map editor I use *Blender* with my own exporter, you can download it from [here](https://drive.google.com/file/d/17z1lCW57oHxwiDmuP5jRW4_obvUO6ykc/view?usp=sharing).  
To write map file with it, you need:
* Create collection named with the name of the map.
* Сreate *Image Reference* object in collection.
* Сreate *Mesh* object and place dots and edges in it like so:  
![blender_screenshot](https://sun9-18.userapi.com/KOzpzaJ98mJe9YVhTqINEHzTmvzkQCSiibDkEQ/yRZaWfP51KQ.jpg)
* Choose *Map Export Path* in the *Scene Properties* and press export button.

To load map in game you need use this function in browser console: `loadMap(<map name>)`

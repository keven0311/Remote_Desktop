import screenshot from 'screenshot-desktop'
import { WebSocketServer } from 'ws'
import http from 'http'
import getPixels from 'get-pixels'
import fs from 'fs'
import path from 'path'
import robot from 'robotjs'

// const screenshot = require('screenshot-desktop');
// const { WebSocketServer } = require('ws');
// const http = require('http');
// const getPixels = require('get-pixels');
// const fs = require('fs');
// const path = require('path');
// const robot = require('robotjs')

//1 create HTTP and WS server
const server = http.createServer();
const wss = new WebSocketServer({server})



//2 create screenshop function:
const createScreenShot = async () => {
    const image = await screenshot({format:"png"});
    return {
        imageBuffer:image,  // returning binary image buffer
        base64: image.toString("base64") // returning in base64 format for front-end to display
    }
}

//3 get image width and height:
const getScreenSize = async () => {
    const {imageBuffer , base64 } = await createScreenShot();
    const filePath = path.join(process.cwd(), 'screenshot.png')
    fs.writeFileSync(filePath, imageBuffer )
    return new Promise((resolve,reject) => {
        getPixels(filePath, (err, pixels) => {
            const shape = pixels.shape;
            resolve({
                width:shape[0],
                height: shape[1],
                base64
            })
        })
    })
}


wss.on('connection', (ws) => {
    ws.on('message', (message => {
        const data = JSON.parse(message);
        if(data.type === 'click'){
            robot.moveMouse(data.x, data.y);  // move cusor to the target position
            robot.mouseClick();    // handle mouse click
        }
    }))
    setInterval( async ()=> {
        try {
            const data = await getScreenSize()
            ws.send(JSON.stringify(data));
        } catch (e) {
            console.error(`Error: `, e)
        }
    },500)
})
server.listen(3001,() => {
    console.log(`server is running at http://localhost:3001`)
})
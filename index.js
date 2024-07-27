const Spotify = require("./spotify")
const config = require("./config")
const spotify = new Spotify(config, true)

const express = require("express")
const app = express()

var ready = false

var cache = {}

function refresh(){
    // spotify.api.getMyCurrentPlaybackState().then(data => {
    //     // console.log(cache.item)
    //     if(cache.item.id !== data.body.item.id) console.log("[Spotify] Now playing " + data.body.item.name + " by " + data.body.item.artists.map(artist => artist.name).join(", "))
    //     cache = data.body
    // }).catch(e => {
    //     console.error("failed to fetch", e)
    // })
    spotify.getPlaying().then(data => {
        if(cache.item && data.item){
            if(cache.item.id !== data.item.id) console.log("[Spotify] Now playing " + data.item.name + " by " + data.item.artists.map(artist => artist.name).join(", "))
        }
        if(data != {}){
            cache = data
        }
    }).catch(e => {
        console.error("failed to fetch", e)
    })
}

spotify.emitter.on('ready', () => {
    ready = true
    refresh()
    setInterval(refresh, 5000)
})

spotify.emitter.on('error', (err) => {
    console.error(err) 
})

app.get('/state', (req, res) => {
    if(!ready){
        res.status(500).json({ error: "Not ready" })
    } else {
        // spotify.api.getMyCurrentPlaybackState().then(data => {
        //     res.json(data.body)
        // }).catch(e => {
        //     res.json({ error: e.toString() })
        // })
        res.json(cache)
    }
})

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.html")
})

app.listen(81)

// The following code will add globally installed npm/node package's to node's internal module paths list. The globally installed package directory is environmental variable NODE_PATH. Unless you have installed your libraries globally and node does not load these by default, delete lines 2-7.
var NODE_PATH = process.env.NODE_PATH.replaceAll('\\', '/')
var pathArray = NODE_PATH.split(';')
for(item in pathArray){
    module.paths.push(pathArray[item])
}

const express = require('express');
const fetch = require('node-fetch');
const path = require('path')
const EventEmitter = require('events')
const fs = require("fs")


function fetchNewToken(clientId, clientSecret, refreshToken){
    return new Promise((resolve, reject) => {
        let formData = new URLSearchParams();
        formData.append('grant_type', "refresh_token")
        formData.append('refresh_token', refreshToken)
    
        fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
                'Content-Type': "application/x-www-form-urlencoded"
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if(data.error){
                return reject(data)
            }
            const newAccessToken = data.access_token;
            resolve(newAccessToken)
        }).catch(error => {
            reject(error)
        });
    })
}

class Spotify {
    constructor(config, debug = false){
        this.ready = false
        this.debug = debug

        this.client_id = config.client_id
        this.client_secret = config.client_secret
        this.redirect_uri = config.redirect_uri
        this.scopes = config.scopes

        this.emitter = new EventEmitter()
        this.emitter.on('ready', () => {
            console.log('[Spotify] Ready')
        })

        const spotifyWebApi = require('spotify-web-api-node')
        var api = new spotifyWebApi({
            clientId: this.client_id,
            clientSecret: this.client_secret,
            redirect_uri: this.redirect_uri
        })
                
        this.api = api

        this.login()
    }
    login(){
        return new Promise((resolve, reject) => {
            var { refreshToken } = JSON.parse(fs.readFileSync(__dirname + "/tokens.json", 'utf-8'))
            fetchNewToken(this.client_id, this.client_secret, refreshToken).then(token => {
                this.api.setAccessToken(token)
                this.emitter.emit('ready')
            }).catch(error => {
                console.log(error)
                if(error.error === "invalid_grant" || error.error === "invalid_token" || error.error_description == "refresh_token must be supplied"){
                    console.log("[Spotify] Please login at http://localhost")
                    this.getTokenFromUser(this.client_id, this.client_secret, this.scopes, this.redirect_uri, this.debug, this.api).then(ready => {
                        this.emitter.emit('ready')
                        resolve()
                    }).catch(err => {
                        this.emitter.emit('error', err)
                        reject(err)
                    })
                } else {
                    this.emitter.emit('error', error)
                    reject(error)
                }
            })
        })
    }
    request(path, method, body){
        return new Promise((resolve, reject) => {
            var options = {
                method,
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                }
            }
            if(body) options.body = JSON.stringify(body)
            fetch("https://api.spotify.com/v1" + path, options)
            .then(data => data.json())
            .then(data => {
                resolve(data)
            })
            .catch(reject)
        })
    }
    getTokenFromUser(clientId, clientSecret, scopes, redirect_uri, debug, api){
        return new Promise((resolve, reject) => {
            const webserver = express()
            .get('/', (req, res) => res.redirect(`https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}${(scopes ? '&scope=' + encodeURIComponent(scopes) : '')}${'&redirect_uri=' + encodeURIComponent(redirect_uri)}`))
            .get('/callback', (req, res) => {
                var url = new URL(`http://localhost${req.url}`)
                var code = url.searchParams.get('code')
                const base64Credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        
                fetch('https://accounts.spotify.com/api/token', {
                    method: 'post',
                    headers: {
                        Authorization: `Basic ${base64Credentials}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: `grant_type=authorization_code&code=${code}&redirect_uri=http://localhost/callback`
                }).then(res => res.json()).then(async json => {
        
                    server.close()
        
                    var token = json.access_token
                    var refresh_token = json.refresh_token
        
                    if(token){
                        this.ready = true
                        this.token = token
                        this.refresh_token = refresh_token
                    }
        
                    if(json.error) return res.redirect('/login')
                    res.sendFile(path.join(__dirname, './close.html'))
                    if(debug) console.log('[Spotify] Got user auth token')
                    server.close()
        
                    this.api.setAccessToken(this.token)
                    this.api.setRefreshToken(this.refresh_token)
                    
                    fs.writeFileSync(__dirname + "/tokens.json", JSON.stringify({ refreshToken: this.refresh_token }), "utf-8")
        
                    this.api = api
            
                    var user = await this.request("/me", "GET")
                    this.user = user

                    resolve(user)
                }).catch(err => {
                    reject(err)
                })
            })
            var server = webserver.listen(80)
        })
    }
    getPlaying(){
        return new Promise((resolve, reject) => {
            this.api.getMyCurrentPlaybackState().then(data => {
                if(data.body.error){
                    console.log("error occured on line 167", data.body.error)
                    if(data.body.error.status.status === 401){
                        this.login().then(success => {
                            this.api.getMyCurrentPlaybackState().then(data => {
                                if(data.body.error) reject(data.body.error)
                                else resolve(data.body)
                            }).catch(e => console.error("Error occured line 173", e))
                        })
                    }
                } else resolve(data.body)
            }).catch(e => {
                console.error("error occured line 178", e)
                this.login().then(() => {
                    this.api.getMyCurrentPlaybackState().then(data => {
                        if(data.body.error) reject(data.body.error)
                        else resolve(data.body)
                    }).catch(e => console.error("Error occured line 182", e))
                }).catch(e => "login error occured line 184", e)
            })
        })
        
    }
}

module.exports = Spotify

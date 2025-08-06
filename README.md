# music-frame
Hosts a webpage with the current playing song and background image fetched from your spotify account.


## Installation and usage

- Create an app at [developer.spotify.com](https://developer.spotify.com). Copy the client ID, client secret. These may be in the settings menu. You also need to add a redirect URL. If you are hosting this locally and your host computer is also your client computer, then use `http://localhost/callback`. Otherwise use `http://<your domain or IP>/callback` or `https://<your domain or IP>/callback`, if you are accessing from your website or device IP address.

- You must have node.js installed (version 18 or newer). I have not tested on earlier versions.
This can be installed [here](https://nodejs.org). It also comes with npm, which installs the packages for you.

- Install `express`, `node-fetch@2`, `spotify-web-api-node` packages using npm.
`npm install express note-fetch@2 spotify-web-api-node` on the host computer. You can remove lines 2-7 in spotify.js if you are not using globally installed npm libraries or node automatically detects globally installed npm libraries/packages.

- Run index.js `node index.js` on the host computer. It should prompt you to login at a link in the console. For example this could be `http://localhost/callback`. Please note this is not the callback - you will be redirected to the Spotify authorisation page, once you consent to share your playing data, you will be then redirected back to the callback landing page on the host computer. Once this has happened, the host computer will now be able to access your spotify playing status.

- It should print `[Spotify] Got user auth token` once you have consented to share your data to this app (in the previous step).

- By default, the port used or the frame is 81. This is because port 80 by another HTTP server to deal with the obtaining of tokens during authentication. You can set this in config.js `port` property to your preferred port, if necessary. Substitute 81 for your custom port in the next instruction:
- Once `[Spotify] Ready` is printed, you can now access the currently playing page at `http://<your device ip/domain>:81` or `https://<your device ip/domain>:81` or `http://localhost` (if using on the host computer). The port `81` can be changed by editing the bottom of `index.js` `app.listen(81)` to `app.listen(your port)`. I do plan to add this into a configuration file to make it easier in the future.

- If there are any errors or problems, create an issue.

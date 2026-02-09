# mobilecap-viewer 

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
If you're running the api locally, on main.js change api port to axios.defaults.baseURL = "http://localhost:8000/"
MAKE SURE NOT TO COMMMIT THIS.

npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

### Environment variables
- `VUE_APP_API_SERVER` – API base URL (e.g. `https://api.opencap.ai/`).
- `VUE_APP_MOBILE_APP_DEEP_LINK` – (Optional) URL pattern for "Open in app" on mobile/tablet so the native app opens instead of the web page. Use `SESSION_ID` as placeholder. Default is `opencap://session/SESSION_ID`. The mobile app must register this URL scheme (iOS: URL Types in Info.plist; Android: intent-filter) and handle the session ID to join the session.

####

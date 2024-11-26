const ws = new WebSocket("ws://localhost:8895")

ws.onopen = () => {
    ws.send("message from client")
    console.log("message sent to server")
}

ws.onmessage = (e) => {
    alert(`message: '${e.data}'`)
    
}

ws.onclose = () => {
    console.log("ws connection is closed")
}
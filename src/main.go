package main

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var clients = make(map[*websocket.Conn]bool) // connected clients
var broadcast = make(chan Message)           // broadcast channel

// Configure the upgrader
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func main() {
	// Create a simple file server
	fs := http.FileServer(http.Dir("public"))
	http.Handle("/", fs)

	// seed current game state
	currentWord = "balderdash"
	players = make([]string, 0)

	// Configure websocket route
	http.HandleFunc("/ws", handleConnections)

	// Start listening for incoming chat messages
	go handleMessages()

	// Start the server on localhost port 8888 and log any errors
	log.Println("http server started on :8888")
	err := http.ListenAndServe(":8888", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	// Upgrade initial GET request to a websocket
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}
	// Make sure we close the connection when the function returns
	defer ws.Close()

	// Register our new client
	clients[ws] = true

	for {
		var msg Message
		// Read in a new message as JSON and map it to a Message object
		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Printf("error: %v", err)
			delete(clients, ws)
			break
		}
		// Send the newly received message to the broadcast channel
		broadcast <- msg
	}
}

func handleMessages() {
	for {
		// Grab the next message from the broadcast channel
		msg := <-broadcast
		if msg.Type == "join" {
			players = append(players, msg.Name)
			sendToAll("players", players)
		}
		if msg.Type == "judge" {
			sendToAll("judge", msg.IncomingString)
		}
		if msg.Type == "type" {
			sendToAll("type", msg.IncomingString)
		}
		if msg.Type == "definition" {
			sendToAll("definition", map[string]string{
				"name":       msg.Name,
				"definition": msg.IncomingString,
			})
		}
		if msg.Type == "secret" {
			currentWord = msg.IncomingString
			sendToAll("secret", currentWord)
		}
	}
}

func sendToAll(t string, message interface{}) {
	// Send it out to every client that is currently connected
	for client := range clients {
		output := map[string]interface{}{
			"type":  t,
			"value": message,
		}
		err := client.WriteJSON(output)
		if err != nil {
			log.Printf("error: %v", err)
			client.WriteJSON(map[string]string{
				"error": err.Error(),
			})
			client.Close()
			delete(clients, client)
		}
	}
}

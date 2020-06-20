new Vue({
    el: '#app',

    data: {
        ws: null, // Our websocket
        joined: false, // True if email and username have been filled in
        name: "",
        judge: "",
        secret: "",
        secretType: "ww",
        definition: "",
        isHosting: false,
        players: [],
        definitions: {},
        isPlaying: false
    },

    created: function() {
        var self = this;
        this.ws = new WebSocket('ws://' + window.location.host + '/ws');
        this.ws.onopen = function() {
            // self.getAvailablePlayers();
        }
        this.ws.addEventListener('message', function(e) {
            var response = JSON.parse(e.data);

            switch (response.type) {
                case "players":
                    self.players = response.value;
                    break;
                case "judge":
                    self.judge = response.value;
                    console.log("The judge is now: ", self.judge)
                    break;
                case "secret":
                    if (self.judge !== self.name) {
                        self.secret = response.value;
                    }
                    break;
                case "type":
                    if (self.judge !== self.name) {
                        self.secretType = response.value;
                    }
                    console.log("The type is now: ", self.secretType)
                    break;
                case "definition":
                    self.definitions[response.value.name] = response.value.definition
                    if (self.judge === self.name) {
                        self.$forceUpdate();
                    }
                    break;
                default:
                    console.log(response)
                    break;
            }
        });
    },

    computed: {
        category() {
            if (this.secretType === "ww") {
                return "Weird Words - "
            }
            if (this.secretType === "pp") {
                return "Peculiar People - "
            }
            if (this.secretType === "ii") {
                return "Incredible Initials - "
            }
            if (this.secretType === "mm") {
                return "Marvelous Movies - "
            }
            if (this.secretType === "ll") {
                return "Laughable Laws - "
            }
        }
    },

    methods: {
        play() {
            console.log("start playing")
            document.getElementById("video").play()
            this.isPlaying = true
        },
        pause() {
            console.log("pause video")
            document.getElementById("video").pause()
            this.isPlaying = false
        },
        send() {
            if (this.newMsg != '') {
                this.ws.send(
                    JSON.stringify({
                        type: this.email,
                        name: this.username,
                        message: $('<p>').html(this.newMsg).text() // Strip out html
                    }
                ));
            }
        },
        join() {
            this.ws.send(
                JSON.stringify({
                    type: "join",
                    name: this.name
                })
            )
            this.joined = true;
        },
        becomeJudge() {
            this.ws.send(
                JSON.stringify({
                    type: "judge",
                    incomingString: this.name
                })
            )
            this.secret = ""
        },
        doneJudging() {
            this.ws.send(
                JSON.stringify({
                    type: "judge",
                    incomingString: ""
                })
            )
            this.ws.send(
                JSON.stringify({
                    type: "secret",
                    incomingString: ""
                })
            )
            this.definition = ""
        },
        shuffle() {
            this.definitions = this.shuffle(this.definitions)
        }
    },

    watch: {
        secret() {
            if (this.judge === this.name) {
                this.ws.send(
                    JSON.stringify({
                        type: "secret",
                        incomingString: this.secret
                    })
                )
            }
        },
        secretType() {
            if (this.judge === this.name) {
                this.ws.send(
                    JSON.stringify({
                        type: "type",
                        incomingString: this.secretType
                    })
                )
            }
        },
        judge() {
            if (this.judge === "") {
                this.definitions = {}
                this.definition = ""
            }
        },
        definition() {
            if (this.judge === this.name) {
                this.definitions[this.name] = this.definition
                return
            }

            this.ws.send(
                JSON.stringify({
                    type: "definition",
                    name: this.name,
                    incomingString: this.definition
                })
            )
        }
    }
});

var Twitter = require('twitter');

var MFAPIConstants = require('../constants/mf-api-constants');
var client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});
var _ = require("lodash")
var Client = require('node-rest-client').Client;
var io = require('socket.io-client');
var socket;
var token;

/*
Industry 4.0 - TechNation Report-JJ-01,
Industry 4.0 - Agenda-JJ-01
Industry 4.0 - Bios-JJ-01
Industry 4.0 - Images-JJ-01
Industry 4.0 - Live
Industry 4.0 - Supporters-JJ-01
Industry 4.0 - Videos-JJ-01
*/
var IndustryScenes = [
    {
        sceneId: '5b27c1112bbfd6f81a934bad',
        themes: ["Page0", "Page1", "Page2",
            "Page3", "Page4", "Page5", "Page6", "Page7", "Page8", "Page9", "Page10", "Page11", "Page12",
            "Page13", "Page14", "Page15", "Page16", "Page17", "TechNationTimeline"]
    },
    {
        sceneId: '5b2263e2bfa7a96c2e946ea2',
        themes: ["AgendaTimeline"]
    },
    {
        sceneId: '5b1a58eca8aeee241f28407a',
        themes: ["Jade", "Henri", "Gordon-Fletcher", "MariaBW", "Neil-Christie", "John-Sibbald",
            "David-Spicer", "AdamF", "Muhammad-Asim-Arro", "Josh", "Henri-Murison", "Sarah-Martin",
            "Sara-Simeone", "Andy-Lovatt", "Guy-Weaver", "Ashley-Boroda", "Vimla-Appadoo", "Tom-Cheesewright",
            "Alison-Mckenzie-Folan", "Martin-Bryant", "Ruth-Harrison", "BiosTimeline"
        ]
    },
    {
        sceneId: '5b07cf198993e6dc3279b2e3',
        themes: ["Images"]
    },
    {
        sceneId: '5b2927022bbfd6f81a934c1a',
        themes: ["Live"]
    },
    {sceneId: '5b28fc352bbfd6f81a934bf8', themes: ["Supporters"]},
    {sceneId: '5b27abba2bbfd6f81a934b9e', themes: ["Videos"]},
];


var CeramicScenes = {
    fire: {
        people: {sceneId: '5b44d016330bc29c146dbc4c', theme: "Fire with People"},
        furious: {sceneId: '5b44d04f330bc29c146dbc4d', theme: "Ferocious"},
        background: {sceneId: '5b44cf47330bc29c146dbc49', theme: "Fire Background fast"}
    },
    water: {
        running: {sceneId: '5b47754be4e95eac039228a1', theme: 'Running Water Overlays'},
        drop: {sceneId: '5b477bd3e4e95eac039228a5', theme: 'Water Drop Overlays'}
    },
    kiln: {
        smoke: {sceneId: '5b479424e4e95eac039228c0', theme: "Smoke"},
        smash: {sceneId: '5b4796dfe4e95eac039228c5', theme: "Smash"},
        pots: {sceneId: '5b4792d4e4e95eac039228bc', theme: "Overlay 3 Pots"},
        lighting: {sceneId: '5b3e2354997f6d9c22e61667', theme: "Lighting"},
        prep: {sceneId: '5b478873e4e95eac039228b0', theme: 'Wood Waiting'},
    },
    mountain: {
        lifting: {sceneId: "5b45d992e4e95eac03922852", theme: "collecting"},
        breaking: {sceneId: '5b44afd4330bc29c146dbc1d', theme: 'breaking'},
        hands: {sceneId: '5b45d86fe4e95eac0392284e', theme: "hands"},
        background: {
            sceneId: '5b508286bfcf1b60279b6013',
            theme: "All"
        }
    },
    texture: {
        smooth: {sceneId: '5b54dac5bfcf1b60279b6086', theme: "Smooth"},
        rough: {sceneId: '5b54df28bfcf1b60279b608e', theme: "Rough"},
        rustic: {sceneId: 'vis_v3_Texture_T7_Rustic', theme: "Rustic"},
        brushstroke: {sceneId: '5b54e14fbfcf1b60279b6092', theme: "BrushStroke"},
        moon: {
            sceneId: '5b54e2c4bfcf1b60279b6095', theme: "Smooth moon"
        }
    },
    wheel: {
        detaching: {sceneId: '5b45e65be4e95eac03922865', theme: "Detaching"},
        rolling: {sceneId: '5b45db68e4e95eac03922858', theme: "rolling"},
        extruding: {sceneId: '5b45dd91e4e95eac0392285c', theme: "extruding"},
    }
};
var GDCScenes = {
    Dalian: {
        seafood: {
            sceneId: '57963acdea09c8f426aaa923', theme: ''
        },
        wave: {sceneId: '57963aeaea09c8f426aaa924', theme: ''},
        sports: {sceneId: '57963e59ea09c8f426aaa97d', theme: ''},
        architecture: {sceneId: '57963cbbea09c8f426aaa92f', theme: ''},
        transport: {sceneId: '57963e8cea09c8f426aaa97f', theme: ''},
    },
    HongKong: {
        language: {
            sceneId: '57962f0dea09c8f426aaa890', theme: ''
        },
        landscape: {sceneId: '57962ee1ea09c8f426aaa88d', theme: ''},
        culture: {sceneId: '57962d51ea09c8f426aaa883', theme: ''},
        nightlife: {sceneId: '579888ccec1e72d8833fe555', theme: ''},

    },
    Seoul: {
        nightlife: {
            sceneId: '5790a6e22e00bd003d6409dd', theme: ''
        },
        art: {sceneId: '57912fec2e00bd003d6421b4', theme: ''},
        fun: {sceneId: '57913b4a2e00bd003d642398', theme: ''},
        architecture: {sceneId: '5791db812e00bd003d6426af', theme: ''},
        transport: {sceneId: '5791dced2e00bd003d6426b3', theme: ''},
    },
    Chengdu: {
        architecture: {
            sceneId: '5797358f81a29c700e9de53b', theme: ''
        },
        language: {sceneId: '57988329ec1e72d8833fdf3e', theme: ''},
        art: {sceneId: '57992a48c6da2cd058e5a63b', theme: ''},
        nightlife: {sceneId: '57978d5e8fae87707010e9f4', theme: ''},
        technology: {sceneId: '5797354581a29c700e9de538', theme: ''},
    },
    Chicago: {
        sports: {
            sceneId: '57960d05ea09c8f426aaa71a', theme: ''
        },
        people: {sceneId: '57960ca9ea09c8f426aaa70f', theme: 'People'},
        art: {sceneId: '5790a8ae2e00bd003d640c76', theme: ''},
        architecture: {sceneId: '57960ca3ea09c8f426aaa70e', theme: ''},
    },
    Manchester: {
        architecture: {sceneId: '579a44ba792e8b3c827d38fc', theme: 'Place'},
        dialect: {sceneId: "5798cc405250423075a28737", theme: 'Diversity'},
        people: {sceneId: '579a3253792e8b3c827d2cd2', theme: ""}
    },
    Shenyang: {
        sports: {sceneId: '5796a26481a29c700e9dd349', theme: ""},
        art: {sceneId: '5796a2ed81a29c700e9dd357', theme: ""},
        cuisine: {sceneId: '5797376d81a29c700e9de545', theme: ''},
        transport: {sceneId: '5797e9c6ec1e72d8833fd0ae', theme: ''},

    },
    Beijin: {
        food: {
            sceneId: '579615b5ea09c8f426aaa765', theme: ''
        },
        people: {sceneId: '5795b66950d782446f21d235', theme: ''},
        art: {sceneId: '5796150dea09c8f426aaa762', theme: ''},
        architecture: {sceneId: '5795b24150d782446f21d1b1', theme: ''},
    },
    KualaLumpur: {
        food: {
            sceneId: '57971c9181a29c700e9ddab5', theme: ''
        },
        language: {sceneId: '578fe68e2e00bd003d63f6f1', theme: ''},
        youth: {sceneId: '57977c3d8fae87707010e7e0', theme: ''},
        nightlife: {sceneId: '57978d5e8fae87707010e9f4', theme: ''},
        sports: {sceneId: '57978ef88fae87707010ea15', theme: ''},
    },
    GDC: {
        workshop: {sceneId: '57a10f37a0f02df8ad9f0854', theme: ''}
    }

};


var options = {
    mimetypes: {json: ['application/json', 'application/json; charset=utf-8']},
};
/*var nodeClient = new Client();*/
var mfOjbect = {};
var checkForScenes = function (text) {
    var strArr = text.split(' ');
    if (strArr.indexOf('#scene:') !== -1) {
        var i = strArr.indexOf('#scene:');
        var sceneName = strArr[i + 1];
        console.log("scene name found:", sceneName);
        var themeObj = checkForThemes(text);
        TwitterController.findSceneByName(sceneName, themeObj.theme);
    } else {
        console.log("no #scene: found, please make sure to inform the user to add the requested information to their tweet")
    }
};
var checkForThemes = function (msg) {
    var strArr = msg.split(' ');
    if (strArr.indexOf('#theme:') !== -1) {
        var i = strArr.indexOf('#theme:');
        var themeName = strArr[i + 1];
        console.log("theme name found:", themeName);
        return {exists: true, theme: themeName};
    } else {
        return {exists: false, theme: null};
    }
};
var CheckForKeyWords = function (text) {
    var wordArray = text.split(/\s+/);
    var scenes = [];
    var themes = [];
    var score = checkCeramic(wordArray);
    var score2 = checkGDC(wordArray);
    var sscenes = _.union(score.scenes,score2.scenes);
    var sthemes =_.union(score.themes,score2.themes);
    scenes = _.uniq(sscenes);
    themes = _.uniq(sthemes);
    console.log("angel", themes, scenes);
    TwitterController.showScenesWithThemes(scenes, themes);
};
var checkGDC = function (wordArray) {
    try {
        var scenes = [];
        var themes = [];

        _.each(wordArray, function (word) {
            if (word.toLowerCase() === "gdc") {
                console.log("someone said gdc")
                var idx = Math.floor(Math.random() * Object.keys(GDCScenes).length)
                var topicKey = Object.keys(GDCScenes)[idx];
                var topicObj = GDCScenes[topicKey];

                console.log(topicObj, idx, Object.keys(GDCScenes).length)
                var idxx = Math.floor(Math.random() * Object.keys(topicObj).length)
                var key = Object.keys(topicObj)[idxx];
                var topicSubObj = topicObj[key];
                scenes.push(topicSubObj.sceneId);
                themes.push(topicSubObj.theme);

            } else {
                _.each(Object.keys(GDCScenes), function (topic, i) {

                    if (topic === word.toLowerCase()) {
                        var topicObj = GDCScenes[topic];
                        var idx = Math.floor(Math.random() * Object.keys(topicObj).length)
                        var key = Object.keys(topicObj)[idx];
                        var topicSubObj = topicObj[key];
                        console.log("we matched with a topic", topicObj, topicSubObj)
                        scenes.push(topicSubObj.sceneId);
                        themes.push(topicSubObj.theme);

                    }
                    else if (_.includes(Object.keys(GDCScenes[topic]), word.toLowerCase())) {
                        var propTop = GDCScenes[topic];
                        console.log("We matched with a theme", word, propTop)
                        scenes.push(propTop[word].sceneId);
                        themes.push(propTop[word].theme);

                    } else {
                        console.log("not match")
                    }
                })
            }

        });
        return {scenes: scenes, themes: themes}
    } catch (e) {
        console.log(e, "but we are still running")
        return {scenes: [], themes: []};
    }
}
var checkCeramic = function (wordArray) {
    try {
        var scenes = [];
        var themes = [];

        _.each(wordArray, function (word) {
            if (word.toLowerCase() === "ceramic") {
                console.log("someone said ceramic")
                var idx = Math.floor(Math.random() * Object.keys(CeramicScenes).length)
                var topicKey = Object.keys(CeramicScenes)[idx];
                var topicObj = CeramicScenes[topicKey];

                console.log(topicObj, idx, Object.keys(CeramicScenes).length)
                var idxx = Math.floor(Math.random() * Object.keys(topicObj).length)
                var key = Object.keys(topicObj)[idxx];
                var topicSubObj = topicObj[key];
                scenes.push(topicSubObj.sceneId);
                themes.push(topicSubObj.theme);

            } else {
                _.each(Object.keys(CeramicScenes), function (topic, i) {

                    if (topic === word.toLowerCase()) {
                        var topicObj = CeramicScenes[topic];
                        var idx = Math.floor(Math.random() * Object.keys(topicObj).length)
                        var key = Object.keys(topicObj)[idx];
                        var topicSubObj = topicObj[key];
                        console.log("we matched with a topic", topicObj, topicSubObj)
                        scenes.push(topicSubObj.sceneId);
                        themes.push(topicSubObj.theme);

                    }
                    else if (_.includes(Object.keys(CeramicScenes[topic]), word.toLowerCase())) {
                        var propTop = CeramicScenes[topic];
                        console.log("We matched with a theme", word, propTop)
                        scenes.push(propTop[word].sceneId);
                        themes.push(propTop[word].theme);

                    } else {
                        console.log("not match")
                    }
                })
            }

        });
        return {scenes: scenes, themes: themes}
    } catch (e) {
        console.log(e, "but we are still running")
        return {scenes: [], themes: []};
    }

}
var TwitterController = {
    authWithMF: function () {
        var self = this;

        if (socket) {
            socket.disconnect()
        }
        socket = io(process.env.MF_HUB, {forceNew: true})
        var creds = {"username": process.env.MF_USERNAME, "password": process.env.MF_PASSWORD}
        socket.on('connect', function () {
            console.log("Client connected");
            socket.emit('auth', creds, function (err, token, socketID, groupId) {
                if (err) {
                    console.log("Client authentication error ", err)
                    socket.disconnect();
                } else {
                    console.log("Auth successful", token, socketID)
                    token = token;
                    self.listenForTags(process.env.TAG)
                }
            })
        });
        socket.on('connect_error', function (err) {
            console.log("Connection error", err)
        });
    },
    showScene: function (scene) {
        var args = {
            "play": {
                "scenes": [
                    scene._id.toString()
                ],
                "themes": []
            },
        };
        socket.emit("sendCommand", "conference2018", 'showScenesAndThemes', args);
        socket.emit("sendCommand", "conference2018", 'playScenesAndThemes', args);
    },
    showScenesWithThemes: function (scenes, themes) {
        var args = {
            "play": {
                "scenes": scenes,
                "themes": themes
            }
        };
        console.log("scenes and themes", args);
        socket.emit("sendCommand", "conference2018", 'showScenesAndThemes', args);
        socket.emit("sendCommand", "conference2018", 'playScenesAndThemes', args);
    },
    showSceneWithTheme: function (scene, themes, callback) {
        var args = {
            "play": {
                "scenes": [
                    scene._id.toString()
                ],
                "themes": [
                    themes.toString()
                ]
            }
        };
        socket.emit("sendCommand", "conference2018", 'showScenesAndThemes', args);
        socket.emit("sendCommand", "conference2018", 'playScenesAndThemes', args);
    },
    findSceneByName: function (scene, theme) {
        var self = this;
        var args = {name: scene};
        socket.emit("loadSceneByName", scene, function (data) {
            console.log(data)
            if (theme) {
                if (data.theme == undefined) {
                    var hasTheme = data.themes.hasOwnProperty(theme);
                    if (hasTheme) {
                        console.log("Scene has theme", theme)
                        self.showSceneWithTheme(data, theme, function (err, data) {
                            console.log(err, data)
                        })
                    } else {
                        console.log("Scene does not have that theme", data.themes)
                        self.showScene(data)
                    }
                }

            } else {
                console.log("Playing scene", data.name)
                self.showScene(data)
            }

        })
    },
    listenForTags: function (tagString) {
        console.log("Listening for tag:#", tagString)
        var self = this;
        var stream = client.stream('statuses/filter', {track: tagString});
        stream.on('data', function (event) {
            console.log("data", event.text);
            CheckForKeyWords(event.text);
        });
        stream.on('error', function (error) {
            console.log(error);
            if (error.statusCode === 420) {
                console.log("Returned when an app is being rate limited for making too many requests.")
            }
            client.get("application/rate_limit_status", {}, function (err, data) {
                console.log(err, data)
            })
        });
    }
}

module.exports = TwitterController;


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
    Dalian: [],
    HongKong: [],
    Seoul: [],
    Changdu: [],
    Chicago: [],
    Manchester: [],
    Shenyang: [],
    Beijin: [],
    KualaLampur: []

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
    scenes = _.uniq(score.scenes);
    themes = score.themes;
    console.log("angel",themes,scenes);
    TwitterController.showScenesWithThemes(scenes, themes);
};
var checkGDC = function (wordArray) {

    var scenes = [];
    var themes = [];

    _.each(wordArray, function (word) {
        if (word.toLowerCase() === "gdc") {
            var idx = Math.floor(Math.random() * Object.keys(GDCScenes).length + 1)
            var topic = Object.keys(GDCScenes)[idx];
            var idxx = Math.floor(Math.random() * topic.length + 1)
            scenes.push(topic[idxx]);

        } else {
            _.each(Object.keys(GDCScenes), function (topic) {
                if (_.includes(topic.themesAliases, word)) {
                    scenes.push(topic.sceneId);
                    themes.push(topic.theme);
                }
            })
        }

        _.each(IndustryScenes, function (scene) {
            if (_.includes(scene.themes, word)) {
                scenes.push(scene.sceneId);
                themes.push(word);
            }
        })
    });
}
var checkCeramic = function (wordArray) {
try{
    var scenes = [];
    var themes = [];

    _.each(wordArray, function (word) {
        if (word.toLowerCase() === "ceramic") {
            console.log("someone said ceramic")
            var idx = Math.floor(Math.random() * Object.keys(CeramicScenes).length)
            var topicKey = Object.keys(CeramicScenes)[idx];
            var topicObj =CeramicScenes[topicKey];

            console.log(topicObj,idx,Object.keys(CeramicScenes).length)
            var idxx = Math.floor(Math.random() * Object.keys(topicObj).length)
            var key = Object.keys(topicObj)[idxx];
            var topicSubObj = topicObj[key];
            scenes.push(topicSubObj.sceneId);
            themes.push(topicSubObj.theme);

        } else {
            _.each(Object.keys(CeramicScenes), function (topic,i) {

                if (topic === word.toLowerCase()) {
                    var topicObj = CeramicScenes[topic];
                    var idx = Math.floor(Math.random() * Object.keys(topicObj).length )
                    var key = Object.keys(topicObj)[idx];
                    var topicSubObj = topicObj[key];
                    console.log("we matched with a topic", topicObj,topicSubObj)
                    scenes.push(topicSubObj.sceneId);
                    themes.push(topicSubObj.theme);

                }
                else if(_.includes(Object.keys(CeramicScenes[topic]), word.toLowerCase())) {
                    var propTop = CeramicScenes[topic];
                    console.log("We matched with a theme",word,propTop)
                    scenes.push(propTop[word].sceneId);
                    themes.push(propTop[word].theme);

                }else{
                    console.log("not match")
                }
            })
        }

    });
    return {scenes:scenes,themes:themes}
}catch(e){
    console.log(e,"but we are still running")
    return {scenes:[],themes:[]};
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
        socket.emit("sendCommand", "conference2018D", 'showScenesAndThemes', args);
        socket.emit("sendCommand", "conference2018D", 'playScenesAndThemes', args);
    },
    showScenesWithThemes: function (scenes, themes) {
        var args = {
            "play": {
                "scenes": scenes,
                "themes": themes
            }
        };
        console.log("scenes and themes", args);
        socket.emit("sendCommand", "conference2018D", 'showScenesAndThemes', args);
        socket.emit("sendCommand", "conference2018D", 'playScenesAndThemes', args);
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
        socket.emit("sendCommand", "conference2018D", 'showScenesAndThemes', args);
        socket.emit("sendCommand", "conference2018D", 'playScenesAndThemes', args);
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
            if(error.statusCode === 420){
                console.log("Returned when an app is being rate limited for making too many requests.")
            }
             client.get("application/rate_limit_status",{},function(err,data){
                console.log(err,data)
            })
        });
    }
}

module.exports = TwitterController;
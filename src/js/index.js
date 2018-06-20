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
var CheckForKeyWords = function(text){
    var wordArray = text.split(/\s+/);
    var scenes = [];
    var themes = [];

    _.each(wordArray,function(word){
        _.each(IndustryScenes,function(scene){
            if(_.includes(scene.themes,word)){
                scenes.push(scene.sceneId);
                themes.push(word);
            }
        })
    });
    scenes = _.uniq(scenes);
    TwitterController.showScenesWithThemes(scenes,themes);
};

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
        socket.emit("sendCommand", "twitter", 'showScenesAndThemes', args);
    },
    showScenesWithThemes:function(scenes,themes){
        var args = {
            "play": {
                "scenes":scenes,
                "themes": themes
            }
        };
        console.log("scenes and themes",args)
        socket.emit("sendCommand", "twitter", 'showScenesAndThemes', args);
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
        socket.emit("sendCommand", "twitter", 'showScenesAndThemes', args);
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
        });
    }
}

module.exports = TwitterController;
var Twitter = require('twitter');
var _ = require("lodash");
var Client = require('node-rest-client').Client;
var io = require('socket.io-client');

var MFAPIConstants = require('../constants/mf-api-constants');

var client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

var config = {
    MF_USERNAME: process.env.MF_USERNAME,
    MF_PASSWORD: process.env.MF_PASSWORD,
    MF_API: process.env.MF_API,
    MF_API_TOKEN: process.env.MF_API_TOKEN
};

var socket;
var token;

var IndustryScenes = require('../data/industry-scene-map');
var CeramicScenes = require('../data/ceramic-scene-map');
var GDCScenes = require('../data/gdc-scene-map');

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
                var themearray = topicSubObj.theme.split(',');
                _.each(themearray,function(t){
                    themes.push(t);
                })

            } else {
                _.each(Object.keys(GDCScenes), function (topic, i) {

                    if (topic === word.toLowerCase()) {
                        var topicObj = GDCScenes[topic];
                        var idx = Math.floor(Math.random() * Object.keys(topicObj).length)
                        var key = Object.keys(topicObj)[idx];
                        var topicSubObj = topicObj[key];
                        console.log("we matched with a topic", topicObj, topicSubObj)
                        scenes.push(topicSubObj.sceneId);
                        var themearray = topicSubObj.theme.split(',');
                        _.each(themearray,function(t){
                            themes.push(t);
                        })

                    }
                    else if (_.includes(Object.keys(GDCScenes[topic]), word.toLowerCase())) {
                        var propTop = GDCScenes[topic];
                        console.log("We matched with a theme", word)
                        scenes.push(propTop[word].sceneId);
                        var themearray = propTop[word].theme.split(',');
                        _.each(themearray,function(t){
                            themes.push(t);
                        })


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
};

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
                var themearray = topicSubObj.theme.split(',');
                _.each(themearray,function(t){
                    themes.push(t);
                })
            } else {
                _.each(Object.keys(CeramicScenes), function (topic, i) {

                    if (topic === word.toLowerCase()) {
                        var topicObj = CeramicScenes[topic];
                        var idx = Math.floor(Math.random() * Object.keys(topicObj).length)
                        var key = Object.keys(topicObj)[idx];
                        var topicSubObj = topicObj[key];
                        console.log("we matched with a topic", topicObj, topicSubObj)
                        scenes.push(topicSubObj.sceneId);
                        var themearray =topicSubObj.theme.split(',');
                        _.each(themearray,function(t){
                            themes.push(t);
                        })


                    }
                    else if (_.includes(Object.keys(CeramicScenes[topic]), word.toLowerCase())) {
                        var propTop = CeramicScenes[topic];
                        console.log("We matched with a theme", word, propTop)
                        scenes.push(propTop[word].sceneId);
                        var themearray = propTop[word].theme.split(',');
                        _.each(themearray,function(t){
                            themes.push(t);
                        })


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

};

var TwitterController = {
    authWithMF: function () {
        var self = this;

        if (socket) {
            socket.disconnect()
        }

        socket = io(process.env.MF_HUB, {forceNew: true});

        var creds = {"username": process.env.MF_USERNAME, "password": process.env.MF_PASSWORD};

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
        console.log("Listening for tag:#", tagString);

        var self = this;
        var stream = client.stream('statuses/filter', {track: tagString});
        stream.on('data', function (event) {
            console.log("data", event.text);
            CheckForKeyWords(event.text);
        });
        stream.on('error', function (error) {
            if (error.statusCode === 420) {
                console.log("Returned when an app is being rate limited for making too many requests.")
            }
            client.get("application/rate_limit_status", {}, function (err, data) {
                console.log(err, data)
            })
        });
    }
};

module.exports = TwitterController;


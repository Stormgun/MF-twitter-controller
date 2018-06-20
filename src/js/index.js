var Twitter = require('twitter');

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


var MFAPIConstants = require('../constants/mf-api-constants');
var client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});
var Client = require('node-rest-client').Client;
var options = {
    mimetypes: {json: ['application/json', 'application/json; charset=utf-8']},
};
var nodeClient = new Client();
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

    _.each(wordArray, function (word) {
        _.each(IndustryScenes, function (scene) {
            if (_.includes(scene.themes, word)) {
                scenes.push(scene.sceneId);
                themes.push(word);
            }
        })
    });
    scenes = _.uniq(scenes);
    TwitterController.showSceneWithTheme(scenes, themes);
};


var TwitterController = {
    authWithMF: function () {
        var self = this;
        var args = {
            data: {"password": process.env.MF_PASSWORD,"username": process.env.MF_USERNAME},
            headers: {"Content-Type": "application/json"}
        };
        nodeClient.post(MFAPIConstants.PostRequestURLs.Auth, args, function (data, response) {
            console.log(data)
            mfOjbect = data;
            self.listenForTags("MediaFramework");
        })

    },
    showScene: function (scene) {
        var args = {
            data: {
                "roomId": "twitter",
                "scenes": [
                    scene._id.toString()
                ]

            },
            headers: {"X-API-Key": mfOjbect.token, "Content-Type": "application/json", "accept": "application/json"}
        };
        nodeClient.post(MFAPIConstants.PostRequestURLs.ShowScene, args, function (data, response) {
            console.log("scene response", data, mfOjbect.token)
        })
    },
    showSceneWithTheme: function (scenes, themes) {
        var args = {
            data: {
                "roomId": "industry4",
                "play": {
                    "scenes": [
                        scenes
                    ],
                    "themes": [
                        themes
                    ]
                }
            },
            headers: {"X-API-Key": mfOjbect.token, "Content-Type": "application/json", "accept": "application/json"}
        };
        nodeClient.post(MFAPIConstants.PostRequestURLs.ShowSceneTheme, args, function (data, response) {
            console.log("scene and theme requests response", data)
        });
    },
    showSceneWithTheme: function (scene, themes, callback) {
        var args = {
            data: {
                "roomId": "twitter",
                "play": {
                    "scenes": [
                        scene._id.toString()
                    ],
                    "themes": [
                        themes.toString()
                    ]
                }
            },
            headers: {"X-API-Key": mfOjbect.token, "Content-Type": "application/json", "accept": "application/json"}
        };
        nodeClient.post(MFAPIConstants.PostRequestURLs.ShowSceneTheme, args, function (data, response) {
            console.log("scene and theme requests response", data)
        });
    },
    findSceneByName: function (scene, theme) {
        var args = {
            headers: {
                "X-API-Key": mfOjbect.token,
                "sceneName": scene,
                "accept": "application/json, application/json; charset=utf-8"
            }
        };
        var self = this;
        var req = nodeClient.get(MFAPIConstants.GetRequestURLs.FindSceneByName, args, function (data, response) {
            console.log(data)
            if (response.statusCode == 200) {
                console.log("scene-data", data._id);
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

            } else {
                console.log("no scene found")
            }


        });
        req.on('requestTimeout', function (req) {
            console.log('request has expired');
            req.abort();
        });
        req.on('responseTimeout', function (res) {
            console.log('response has expired');
        });

//it's usefull to handle request errors to avoid, for example, socket hang up errors on request timeouts
        req.on('error', function (err) {
            console.log('request error', err);
        });
    },
    listenForTags: function (tagString) {
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
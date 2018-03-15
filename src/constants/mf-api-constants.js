var MFConstants ={
    PostRequestURLs:{
        Auth:process.env.MF_API_URL + '/auth/token/get',
        ShowScene:process.env.MF_API_URL + '/playback/scene/show',
        ShowSceneTheme:process.env.MF_API_URL + '/playback/scene/theme/show'
    },
    GetRequestURLs:{
        FindSceneByName:process.env.MF_API_URL + '/scene/find/by/name'
    }
};

module.exports = MFConstants;
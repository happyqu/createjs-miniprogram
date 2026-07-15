export default {
    createCanvas(width = 1, height = 1){
        return wx.createOffscreenCanvas({
            type: '2d',
            width,
            height,
        });
    },
    globalDispatcher:null,
    canvas:null,
}

const fixEndChunkLength = (length) => {

    return Math.floor((length-1) / 16) * 16 + 16;
}

module.exports =fixEndChunkLength;
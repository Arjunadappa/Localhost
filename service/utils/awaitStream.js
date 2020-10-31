const awaitStream = (inputSteam, outputStream, allStreamsToErrorCatch) => {

    return new Promise((resolve, reject) => {

        allStreamsToErrorCatch.forEach((currentStream) => {

            currentStream.on("error", (e) => {
                reject({
                    message: "Await Stream Input Error",
                    code: 500,
                    error: e
                })
            })
            
        })

        inputSteam.pipe(outputStream).on("finish", (data) => {
            console.log("await stream finished")
            resolve(data);
        })
    })
}
module.exports = awaitStream
const streamToBuffer = (stream, allStreamsToErrorCatch) => {

    const chunks = []
    return new Promise((resolve, reject) => {
  
      allStreamsToErrorCatch.forEach((currentStream) => {
  
        currentStream.on("error", (e) => {
    
          console.log("Stream To Buffer Error", e);
          reject({
            message: "stream to buffer error",
            code: 500,
            error: e
           })
    
        })
      })
  
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    
    })
  }
  
module.exports = streamToBuffer
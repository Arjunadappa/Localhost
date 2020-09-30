exports.data = async(busboy) => {
    return new Promise((resolve,reject) => {
        const formData = new Map();
        busboy.on("field", (field, val) => {

            formData.set(field, val)

        });
        busboy.on("file", async(_, file, filename) => {

            resolve({
                file,
                filename,
                formData
            })
        })
    })
}

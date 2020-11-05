const S3Service = require("../service/S3Service");
const Folder = require("../models/folder");
const sortBySwitch = require('../utils/sortBySwitchFolder');


exports.uploadFolder = async(req,res) => {
    if(!req.user){
        return;
    }
    try {
        const data = {...req.body,createdBy:req.user._id};
        const folder = new Folder(data);
        await folder.save();
        if(!folder) throw "folder not uploded";
        res.send(folder);
    } catch (e) {
        const code = e.code
        console.log(e.message, e.exception)
        return res.status(code).send();
    }

}

exports.deleteFolder = async (req,res) => {
    if(!req.user){
        return;
    }
    try {
        const userID = req.user._id;
        const folderID = req.body.id;
        const directoryHierarachy = req.body.directoryHierarachy;
        await S3Service.deleteFolder(userID,folderID,directoryHierarachy);
        res.send()
    } catch (e) {
        const code = e.code
        console.log(e.message, e.exception)
        return res.status(code).send();
    }
}

exports.deleteAll = async (req,res) => {
    if(!req.user){
        return;
    }
    try {
        const userID = req.user._id;
        await S3Service.deleteAll(userID);
        res.send();

    } catch (e) {
        const code = e.code
        console.log(e.message, e.exception)
        return res.status(code).send();
    }
}

exports.rename = async (req,res) => {
    if(!req.user){
        return;
    }
    try {
        const userID = req.user._id;
        const folderID = req.body.id;
        const updatedName = req.body.newname;

        const folder = await Folder.findOneAndUpdate({"createdBy":userID,"_id":folderID},{"$set":{"folderName":updatedName}},{new:true})
        res.send(folder)
    } catch (e) {
        const code = e.code
        console.log(e.message, e.exception)
        return res.status(code).send();
    }
    
}

exports.getInfo = async (req,res) => {
    if(!req.user){
        return;
    }

    try {
        const userID = req.user._id;
        const folderID = req.params.id;

        let currentFolder = await Folder.findOne({"createdBy": userID,"_id":folderID});
        if(!currentFolder) throw new Error('folder not found');

        const parentID = currentFolder.parentDirectory;
        console.log(parentID)
        let parentName = "";
        if (parentID === "/") {
    
            parentName = "Home"
    
        } else {
    
            const parentDirectory = await Folder.findOne({"createdBy": userID,"_id":parentID});
                
            if (parentDirectory) {
    
                parentName = parentDirectory.name;
    
            } else {
    
                parentName = "Unknown"
            }
    
        }
        const folderName = currentFolder.folderName
        currentFolder = {...currentFolder._doc, parentName, folderName}
        res.send(currentFolder);

    } catch (e) {
        const code = e.code
        console.log(e.message, e.exception)
        return res.status(code).send();
    }
}

exports.getSubFolders = async (req,res) => {
    if(!req.user){
        return;
    }
    try {
        const userID = req.user._id;
        const folderID = req.query.id;
        let folder = await Folder.findOne({"createdBy": userID,"_id":folderID});
        if(!folder) throw new Error('folder not found');
        const subfolderList = folder.directoryHierarachy;
        let folderIDList = [];
        let folderNameList = [];
        for (let i = 0; i < subfolderList.length; i++) {

            const currentSubFolderID = subfolderList[i];

            if (currentSubFolderID === "/") {

                folderIDList.push("/");
                folderNameList.push("Home")

            } else {

                const currentFolder = await Folder.findOne({"createdBy": userID,"_id":currentSubFolderID});

                folderIDList.push(currentFolder._id);
                folderNameList.push(currentFolder.name)
            }   
        }
        folderIDList.push(folderID);
        folderNameList.push(folder.folderName)
        res.send({folderIDList, folderNameList}) 

    } catch (e) {
        const code = e.code
        console.log(e.message, e.exception)
        return res.status(code).send();
    }
}

exports.getFolderList = async (req,res) => {
    if(!req.user){
        return;
    }
    try {
        const userID = req.user._id;
        const query = req.query;

        let searchQuery = query.search || "";
        const parent = query.parent || "/";
        let sortBy = query.sortby || "DEFAULT";
        sortBy = sortBySwitch(sortBy);
        if (searchQuery.length === 0) {

            const folderList = await Folder.find({"createdBy": userID, "parentDirectory": parent}).sort(sortBy);

            if (!folderList) throw new Error("Folder List Not Found Error");

            res.send(folderList);

        } else {

            searchQuery = new RegExp(searchQuery, 'i')
            const folderList = await Folder.find({"folderName": searchQuery,"createdBy": userID}).sort(sortBy);

            if (!folderList) throw new Error("Folder List Not Found Error");

            res.send(folderList);
        }

        //const folderList
    } catch (e) {
        const code = e.code
        console.log(e.message, e.exception)
        return res.status(code).send();
    }
}
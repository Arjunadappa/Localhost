const s3Service = require("../service/S3Service");
const Folder = require("../models/folder");
const sortBySwitch = require('../utils/sortBySwitchFolder');
const mongoose = require("../databases/mongoose");
const conn = mongoose.connection;

let S3Service = new s3Service();

class FolderController {
    uploadFolder = async(req,res) => {
        if(!req.user){
            return;
        }
        try {
            const data = {...req.body,createdBy:req.user._id};
            console.log(data);
            const folder = new Folder(data);
            await folder.save();
            console.log(folder);
            if(!folder) throw "folder not uploded";
            res.send(folder);
        } catch (e) {
            const code = e.code
            console.log(e.message, e.exception)
            return res.status(code).send();
        }
    
    }
    
    deleteFolder = async (req,res) => {
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
    
    deleteAll = async (req,res) => {
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
    
    rename = async (req,res) => {
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
    
    getInfo = async (req,res) => {
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
    
    getSubFolders = async (req,res) => {
        if(!req.user){
            return;
        }
        try {
            const userID = req.user._id;
            const folderID = req.query.id;
            let folder = await Folder.findOne({"createdBy": userID,"_id":folderID});
            if(!folder) throw new Error('folder not found');
            const subfolderList = folder.directoryHierarachy;
            console.log(subfolderList)
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
                    folderNameList.push(currentFolder.folderName)
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
    
    getFolderList = async (req,res) => {
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
    
    moveFolder = async (req,res) => {
        if (!req.user) {
            return;
        }
    
        try {
    
            const userID = req.user._id;
            const folderID = req.body.id;
            const parent = req.body.parent;
    
            let parentList = ["/"];
    
            if (parent.length !== 1) {
                console.log(parent)
                const parentFile = await Folder.findOne({"createdBy": userID, "_id": parent})
                if(!parentFile) throw new Error("parent folder not found");
                parentList = parentFile.directoryHierarachy;
                parentList.push(parent);
                console.log(parentList)
            }
    
            const folder = await Folder.findOneAndUpdate({"_id": folderID, 
            "createdBy": userID}, {"$set": {"parentDirectory": parent, "directoryHierarachy": parentList}});
            console.log(folder);
            if (!folder) throw new Error("Move Folder Not Found")
    
            const folderChildren = await Folder.find({"parentDirectory": folderID.toString(), "createdBy": userID});
            console.log(folderChildren)
    
            folderChildren.map( async(currentFolderChild) => {
    
                let currentFolderChildParentList = currentFolderChild.directoryHierarachy;
    
                const indexOfFolderID = currentFolderChildParentList.indexOf(folderID.toString());
    
                currentFolderChildParentList = currentFolderChildParentList.splice(indexOfFolderID);
    
                currentFolderChildParentList = [...parentList, ...currentFolderChildParentList];
    
                currentFolderChild.parentList = currentFolderChildParentList;
    
                await currentFolderChild.save()
            })
    
            const fileChildren = await conn.db.collection("files")
            .find({"metadata.createdBy": userID, 
            "metadata.directoryHierarachy":  {$regex : `.*${folderID.toString()}.*`}}).toArray()
    
            fileChildren.map( async(currentFileChild) => {
    
                let currentFileChildParentList = currentFileChild.metadata.DirectoryHierarachy;
    
                currentFileChildParentList = currentFileChildParentList.split(",");
    
                const indexOfFolderID = currentFileChildParentList.indexOf(folderID.toString());
    
                currentFileChildParentList = currentFileChildParentList.splice(indexOfFolderID);
    
                currentFileChildParentList = [...parentList, ...currentFileChildParentList];
    
                await conn.db.collection("files")
                .findOneAndUpdate({"_id": currentFileChild._id, 
                "metadata.createdBy": userID}, {"$set": {"metadata.parentDirectory": currentFileChild.metadata.parentDirectory, "metadata.DirectoryHierarachy": currentFileChildParentList.toString()}})
    
            })
        
    
            res.send();
    
        } catch (e) {
    
            const code = e.code || 500
    
            console.log(e);
            res.status(code).send(e);
    
        }
    }
}

module.exports = FolderController;

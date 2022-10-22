//Controller for items
import mongoose from 'mongoose';
import itemModel from '../db/models/item.js';

const itemController = {

    getIndex: function(req, res){
        res.render('tempIndex');
    },

    // Adds item passed in a post request into the database
    addItem: async function(req, res){
        var addedItem = new itemModel(req.body.addedItem);
        try{
            var item = await addedItem.save();
            console.log("Added item: " + item);
        }catch(error){
            console.log(error);
        }
    }
}

export default itemController;
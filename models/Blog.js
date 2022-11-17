const mongoose = require("mongoose");

const { schema } = require("./secure/postValidation");

const blogSchmea = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 100,
    },
    body: {
        type: String,
        required: true,
    },
    isAccept: {
        type: String,
        default: "waiting",
        enum: ["reject", "accept","waiting"],
    },
    thumbnail: {
        type: Array,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    date:{
        type:Date
    },
    durationTime:{
        type:String,
        enum:["1day","2days","3days","4days","5days","6days","1week","10days","2week","20days","1month"]
    },
    joinedUsers:{
        type:Array
    },
    capacity:{
        type:Number,
        required:true
    },
    
});

blogSchmea.index({ title: "text" });

blogSchmea.statics.postValidation = function (body) {
    return schema.validate(body, { abortEarly: false });
};

module.exports = mongoose.model("Blog", blogSchmea);

const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
    title:{
        type: String, 
        required:true,
    },
    description: String, 
    duration: {
        type:Number, //days
        required: true,
    },
    startDate:{
        type:Date,
        default: Date.now,
    },
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required: true,
    },
    participants:[
        {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      progress: {
        type: Number,
        default: 0, // percent completed
      },
      streak: {
        type: Number,
        default: 0, // streak days
      },
    },
    ],
},{timestamps: true});

module.exports = mongoose.model("Challenge", challengeSchema);

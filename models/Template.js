const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        unique: true 
    },
    options: [{
        optionText: { 
            type: String, 
            required: true 
        },
        color: { 
            type: String, 
            default: "#FFFFFF" 
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Template', TemplateSchema);

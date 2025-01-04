var mongoose = require('mongoose'), Schema = mongoose.Schema;

const shopSchema = new Schema({
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop'},
    duration: Date,
    states: {
        type: Array,
        default: '[]',
    }
}, {timestamps: true});


module.exports = mongoose.model('boosted_shops', shopSchema);
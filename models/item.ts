const mongoose = require('mongoose');

const shortenString = (str: string, maxLength: number) => 
    str.length > maxLength ? str.substring(0, maxLength - 3) + '...' : str;

const itemSchema = new mongoose.Schema({
    title: { 
        type: String,
        required: true,
        maxlength: 256,
        set: (str: string) => shortenString(str, 256)
    },
    subtitle: {
        type: String,
        maxlength: 256,
        default: null,
        set: (str: string) => shortenString(str, 256)
    },
    description: {
        type: String,
        maxlength: 2048,
        set: (str: string) => shortenString(str, 2048)
    },
    price: { type: mongoose.Types.Decimal128, required: true },
    specifications: { type: Object },
    type: {
        type: String,
        maxlength: 128,
        set: (str: string) => shortenString(str, 128)
    },
    profile_image: {
        type: String,
        maxlength: 1024,
        set: (str: string) => shortenString(str, 1024)
    },
    source: { type: String, enum: ['Rozetka', 'Telemart'], required: true},
    url: { type: String, required: true }
})

export default mongoose.model('Item', itemSchema);
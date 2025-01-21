import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema;

const orderItemSchema = mongoose.Schema({
    quantity: {
        type: Number,
        required: true
    },
    product: {
        type: ObjectId,
        ref: 'Product'
    }
})

const OrderItem = mongoose.model('OrderItem', orderItemSchema)

export default OrderItem;

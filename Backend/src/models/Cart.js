const mongoose = require('mongoose');

// A. Item Price Breakdown Schema
const ItemPriceBreakdownSchema = new mongoose.Schema(
    {
        materialBase: { type: mongoose.Schema.Types.Decimal128 },
        materialDiscount: { type: mongoose.Schema.Types.Decimal128, default: 0 },
        materialNet: { type: mongoose.Schema.Types.Decimal128 },
        
        size: { type: mongoose.Schema.Types.Decimal128, default: 0 },
        finishes: { type: mongoose.Schema.Types.Decimal128, default: 0 },
        packaging: { type: mongoose.Schema.Types.Decimal128, default: 0 },
        
        totalItemDiscount: { type: mongoose.Schema.Types.Decimal128, default: 0 } 
    },
    { _id: false }
);

// B. Cart Item Schema (Revised and Consolidated)
const CartItemSchema = new mongoose.Schema(
    {
        // CORE PRODUCT INFO (Snapshot)
        productID: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        productName: { type: String, required: true },
        productCode: { type: String, required: true },
        
        // SELECTED MATERIAL (Snapshot with Discount Detail)
        selectedMaterial: {
            materialID: { type: mongoose.Schema.Types.ObjectId, ref: 'MaterialMaster' },
            name: { type: String, required: true },
            basePrice: { type: mongoose.Schema.Types.Decimal128, required: true }, 
            materialDiscount: { type: mongoose.Schema.Types.Decimal128, default: 0 },
            netBasePrice: { type: mongoose.Schema.Types.Decimal128, required: true }, 
        },

        // SELECTED SIZE (Snapshot)
        selectedSize: {
             sizeID: { type: mongoose.Schema.Types.ObjectId, ref: 'Size' }, 
             name: { type: String },
             sizeMM: { type: Number },
             sizeCost: { type: mongoose.Schema.Types.Decimal128, default: 0 },
        },
        
        // SELECTED FINISH (Snapshot)
        selectedFinish: {
            finishID: { type: mongoose.Schema.Types.ObjectId, ref: 'Finish' },
            name: { type: String },
            // This field represents the cost component for the finish
            priceAdjustment: { type: mongoose.Schema.Types.Decimal128, default: 0 },
        },
        // **REMOVED:** finishCost (since it's redundant)
        
        // OTHER COSTS & QUANTITY
        packagingPrice: { type: mongoose.Schema.Types.Decimal128, default: 0 },
        quantity: { type: Number, default: 1, min: 1 },
        
        // PRICE BREAKDOWN (References the detailed breakdown)
        priceBreakdown: ItemPriceBreakdownSchema,
        
        // FINAL CALCULATED PRICES
        unitPrice: { type: mongoose.Schema.Types.Decimal128, required: true },
        totalPrice: { type: mongoose.Schema.Types.Decimal128, required: true },
    },
    { _id: true }
);

const CartSchema = new mongoose.Schema(
    {
        sessionID: { type: String, required: true, unique: true },
        userID: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User',
            index: true // Index for fast lookup by user
        }, 
        
        items: [CartItemSchema],
        
        // --- PRICING ---
        subtotal: { type: mongoose.Schema.Types.Decimal128, default: 0 },
        discountCode: { type: String },
        discountAmount: { type: mongoose.Schema.Types.Decimal128, default: 0 },
        offerID: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' },
        total: { type: mongoose.Schema.Types.Decimal128, default: 0 },
        
        // --- STATUS & TRACKING ---
        status: { 
            type: String, 
            enum: ['active', 'checkout', 'completed', 'abandoned'], 
            default: 'active' 
        },
        
        // AUTO-APPLY TRACKING (From your original robust design)
        isAutoApplied: {
            type: Boolean,
            default: false
        },
        discountApplicationMethod: {
            type: String,
            enum: ['manual', 'auto', 'none'],
            default: 'none'
        },
        eligibleAutoOffers: [{
            offerID: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Offer'
            },
            calculatedDiscount: { type: mongoose.Schema.Types.Decimal128 },
            priority: { type: Number }
        }],
        manualCodeLocked: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

// Calculate subtotal and total before saving
CartSchema.pre('save', function (next) {
    // 1. Calculate Subtotal (Sum of item total prices)
    const subtotal = this.items.reduce((sum, item) => {
        // Use toString() and parseFloat to safely handle Decimal128 during aggregation in JS
        const itemTotal = parseFloat(item.totalPrice?.toString() || 0);
        return sum + itemTotal;
    }, 0);
    this.subtotal = subtotal;
    
    // 2. Calculate Total (Subtotal minus cart-level discount)
    const discount = parseFloat(this.discountAmount?.toString() || 0);
    this.total = Math.max(0, subtotal - discount);
    
    next();
});

// TTL Index for Cart Cleanup
CartSchema.index({ "updatedAt": 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }); // Carts expire after 90 days of inactivity

// Export the Model - delete existing model if it exists to prevent schema conflicts
if (mongoose.models.Cart) {
    delete mongoose.models.Cart;
}
if (mongoose.connection.models.Cart) {
    delete mongoose.connection.models.Cart;
}
module.exports = mongoose.model('Cart', CartSchema);
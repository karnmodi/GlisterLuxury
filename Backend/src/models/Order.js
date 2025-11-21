const mongoose = require('mongoose');
const { Schema } = mongoose;

// A. Item Price Breakdown Schema (Must match the one used in Cart)
const ItemPriceBreakdownSchema = new Schema(
    {
        materialBase: { type: Schema.Types.Decimal128 },
        materialDiscount: { type: Schema.Types.Decimal128, default: 0 },
        materialNet: { type: Schema.Types.Decimal128 },
        
        size: { type: Schema.Types.Decimal128, default: 0 },
        finishes: { type: Schema.Types.Decimal128, default: 0 },
        packaging: { type: Schema.Types.Decimal128, default: 0 },
        
        totalItemDiscount: { type: Schema.Types.Decimal128, default: 0 } 
    },
    { _id: false }
);

// B. Order Item Schema (Aligned with the final CartItemSchema)
const OrderItemSchema = new Schema(
    {
        // CORE PRODUCT INFO (Snapshot)
        productID: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        productName: { type: String, required: true },
        productCode: { type: String, required: true },
        
        // SELECTED MATERIAL (Snapshot with Discount Detail)
        selectedMaterial: {
            materialID: { type: Schema.Types.ObjectId, ref: 'MaterialMaster' },
            name: { type: String, required: true },
            basePrice: { type: Schema.Types.Decimal128, required: true },
            materialDiscount: { type: Schema.Types.Decimal128, default: 0 },
            netBasePrice: { type: Schema.Types.Decimal128, required: true }, // The discounted base price
        },

        // SELECTED SIZE (Snapshot - Consolidated)
        selectedSize: {
             sizeID: { type: Schema.Types.ObjectId, ref: 'Size' }, 
             name: { type: String },
             sizeMM: { type: Number },
             sizeCost: { type: Schema.Types.Decimal128, default: 0 },
        },
        
        // SELECTED FINISH (Snapshot)
        selectedFinish: {
            finishID: { type: Schema.Types.ObjectId, ref: 'Finish' },
            name: { type: String },
            priceAdjustment: { type: Schema.Types.Decimal128, default: 0 },
        },
        // **REMOVED:** finishCost (since it's redundant)
        
        // OTHER COSTS & QUANTITY
        packagingPrice: { type: Schema.Types.Decimal128, default: 0 },
        quantity: { type: Number, default: 1, min: 1 },
        
        // PRICE BREAKDOWN (References the detailed breakdown)
        priceBreakdown: ItemPriceBreakdownSchema,
        
        // FINAL CALCULATED PRICES
        unitPrice: { type: Schema.Types.Decimal128, required: true },
        totalPrice: { type: Schema.Types.Decimal128, required: true },
    },
    { _id: true }
);

const AddressSchema = new Schema({
    label: { type: String },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    county: { type: String },
    postcode: { type: String, required: true },
    country: { type: String, default: 'United Kingdom' },
}, { _id: false });

const OrderSchema = new Schema(
    {
        // --- ORDER METADATA ---
        orderNumber: { type: String, required: true, unique: true },
        userID: { type: Schema.Types.ObjectId, ref: 'User', required: false, index: true },
        sessionID: { type: String },
        isGuestOrder: { type: Boolean, default: false },

        // --- ITEMS ---
        items: [OrderItemSchema],
        
        // --- CUSTOMER & ADDRESSES ---
        customerInfo: {
            name: { type: String, required: true },
            email: { type: String, required: true },
            phone: { type: String, required: true },
        },
        deliveryAddress: AddressSchema,
        billingAddress: { 
            type: AddressSchema,
            required: true // Billing address is required for invoicing
        },

        // --- SHIPPING & FULFILLMENT ---
        shippingMethod: {
            name: { type: String },
            carrierCode: { type: String },
            cost: { type: Schema.Types.Decimal128, default: 0 },
        },
        trackingNumber: { type: String },
        trackingURL: { type: String },
        orderNotes: { type: String },

        // --- DISCOUNTS ---
        discountCode: { type: String },
        discountAmount: { type: Schema.Types.Decimal128, default: 0 },
        offerID: { type: Schema.Types.ObjectId, ref: 'Offer' },
        
        // --- PRICING ---
        pricing: {
            subtotal: { type: Schema.Types.Decimal128, required: true },
            discount: { type: Schema.Types.Decimal128, default: 0 },
            shipping: { type: Schema.Types.Decimal128, default: 0 },
            // Renamed and ensured Decimal128 for historical accuracy
            totalTaxCalculated: { type: Schema.Types.Decimal128, default: 0 }, 
            total: { type: Schema.Types.Decimal128, required: true },
            vatRate: { type: Number, default: 20 }, 
        },

        // --- STATUS & HISTORY ---
        status: { /* ... (existing status enum) ... */ },
        orderStatusHistory: [ /* ... (existing history structure) ... */ ],
        paymentStatusHistory: [ /* ... (existing history structure) ... */ ],

        // --- REFUND & PAYMENT INFO ---
        refundInfo: { /* ... (existing refund structure) ... */ },
        paymentInfo: {
            method: { type: String },
            processor: { type: String }, // New: Store payment gateway
            status: { /* ... (existing payment status enum) ... */ },
            paidAt: { type: Date },
            transactionId: { type: String },
            amountPaid: { type: Schema.Types.Decimal128 } // New: Actual amount paid
        },

        adminMessages: [ /* ... (existing admin messages structure) ... */ ]
    },
    { timestamps: true }
);

// --- PRE-SAVE HOOKS (Keeping the original robust logic) ---

// Generate order number before saving
OrderSchema.pre('save', async function (next) {
    // ... (Your existing order number generation logic) ...
    if (this.isNew && !this.orderNumber) {
        // ... (Order Number Generation Logic) ...
    }
    
    // ... (Your existing status history logic) ...
    if (this.isModified('status') && !this.isNew) {
        // ... (Order Status History Logic) ...
    }
    
    // ... (Your existing payment status history logic) ...
    if (this.isModified('paymentInfo.status') && !this.isNew) {
        // ... (Payment Status History Logic) ...
    }
    
    next();
});

// Calculate total before saving
OrderSchema.pre('save', function (next) {
    const subtotal = parseFloat(this.pricing.subtotal?.toString() || 0);
    const discount = parseFloat(this.pricing.discount?.toString() || 0);
    const shipping = parseFloat(this.pricing.shipping?.toString() || 0);
    
    // Total = subtotal - discount + shipping (Assuming VAT is included in prices)
    this.pricing.total = Math.max(0, subtotal - discount + shipping);
    
    // Ensure totalTaxCalculated is set (e.g., this is where you would calculate it based on total)
    // For example:
    // const vatRate = this.pricing.vatRate / 100;
    // this.pricing.totalTaxCalculated = (this.pricing.total / (1 + vatRate)) * vatRate;

    next();
});

module.exports = mongoose.model('Order', OrderSchema);
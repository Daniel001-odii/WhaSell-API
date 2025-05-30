var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "product name is required"],
    },
    slug: {
      type: String,
      // required: [true, "product slug is required"],
      // set: value => value.split(" ").join("-")
    },
    description: {
      type: String,
      required: [true, "product description is required"],
    },
    images: [
      {
        type: String,
        required: [true, "atleast one product image is required"],
      },
    ],
    price: {
      type: Number,
      required: [true, "product price is required"],
    },
    discount: Number,
    category: {
      type: String,
      enum: [
        "Electronics & Gadgets",
        "Health & Beauty",
        "Automotive",
        "Office Supplies",
        "Arts & Crafts Supplies",
        "Fashion & Apparel",
        "Books & Media",
        "Toys & Games",
        "Pet Supplies",
        "Jewelry & Watches",
        "Home & Kitchen",
        "Sports & Outdoors",
        "Grocery & Gourmet Food",
        "Baby Products",
        "Travel & Luggages",
      ],
      required: [true, "product category is required"],
    },

    is_boosted: {
      type: Boolean,
      default: false,
    },

    status: {
      value: {
        type: String,
        enum: ["available", "sold", "delivered"],
        default: "available",
      },

      date_of_sale: Date,
      date_of_delivery: Date,
      amount_paid: Number,
    },

    condition: {
      type: String,
      enum: [
        "brand new",
        "refurbished",
        "refurbished by manufacturer",
        "fairly used",
      ],
      required: [true, "product condition is required"],
    },
    charge_for_delivery: {
      type: String,
      enum: ["yes", "no"],
      default: "no",
      required: [true, "delivery charge decision is required"],
    },
    delivery_fee: Number,
    price_negotiable: {
      type: String,
      enum: ["yes", "no"],
      default: "no",
      required: [true, "price negotiability decision is required"],
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: [true, "shop is required"],
    },
    flags: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

productSchema.pre("save", async function (next) {
  if (!this.isModified("name")) {
    return next();
  }
  // Convert name to lowercase, replace spaces with hyphens, and trim any extra whitespace
  const slug = this.name.toLowerCase().trim().split(" ").join("-");
  this.slug = slug;

  console.log(`Generated slug: ${this.slug}`); // Debugging output

  next();
});

module.exports = mongoose.model("Product", productSchema);

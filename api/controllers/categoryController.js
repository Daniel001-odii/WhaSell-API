const Category = require('../models/productCategoriesModel');
const Product = require('../models/productModel');
// Create a new category
exports.addNewCategory = async (req, res) => {
    try {
        const { name } = req.body;

        // Validate name
        if (!name) {
            return res.status(400).json({ message: "Category name is required" });
        }

        const newCategory = new Category({ name });
        await newCategory.save();
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
};


// Get all categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.json({ categories });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
};

// Update a category
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        // Validate name
        if (!name) {
            return res.status(400).json({ message: "Category name is required" });
        }

        const updatedCategory = await Category.findByIdAndUpdate(id, { name }, { new: true });

        if (!updatedCategory) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.json(updatedCategory);
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedCategory = await Category.findByIdAndDelete(id);

        if (!deletedCategory) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.json({ message: "Category deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
};


exports.getCategoriesWithImages = async (req, res) => {
    try {
        // Fetch all categories
        const categories = await Category.find().select('name -_id');

        // Aggregate products to get the first image per category
        const products = await Product.aggregate([
            {
                $match: { images: { $exists: true, $ne: [] } } // Ensure products have at least one image
            },
            {
                $group: {
                    _id: "$category", // Group by category
                    firstImage: { $first: "$images" }, // Get only the first image in the images array
                }
            }
        ]);

        // Map categories to include their first image
        const categoriesWithImages = categories.map(category => {
            const productImage = products.find(prod => prod._id === category.name)?.firstImage || null;
            return {
                category: category.name,
                firstImage: productImage,
            };
        });

        res.status(200).json({ success: true, data: categoriesWithImages });
    } catch (error) {
        console.error("Error fetching categories with single images:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};






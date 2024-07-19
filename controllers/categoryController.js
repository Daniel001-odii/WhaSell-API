const Category = require('../models/productCategoriesModel');

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

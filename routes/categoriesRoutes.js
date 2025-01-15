const express = require('express');
const router = express.Router();
const productCategoryController = require('../controllers/categoryController');

// Create a new category
router.post("/categories/new", productCategoryController.addNewCategory);

// Get all categories
router.get('/categories', productCategoryController.getCategories);

// Get all categories
router.get('/categories_image', productCategoryController.getCategoriesWithImages);


// Update a category
router.put('/categories/:id', productCategoryController.updateCategory);

// Delete a category
router.delete('/categories/:id', productCategoryController.deleteCategory);



module.exports = router;

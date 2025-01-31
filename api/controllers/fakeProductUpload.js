exports.createProduct = async (req, res) => {
    try {
      const user_id = req.user;
      const user = await User.findById(user_id).populate("shop");
  
      // Handle image upload
      productImageUpload.array('product_images', 5)(req, res, async function (err) {
        if (err) {
          return res.status(400).json({ message: 'Image upload failed', err });
        }
  
        if (!req.files || req.files.length == 0) {
          return res.status(400).send({ message: 'Please add at least one product image' });
        }
  
        const { name, description, price, category, condition, charge_for_delivery, delivery_fee, price_negotiable } = req.body;
  
        
        
  
        // Prepare image URLs
        // const images = req.files.map(file => (__dirname, file.path));
        const images = req.files.map(file => getFullUrl(req, file.path));
  
        // Create a new product
        const newProduct = new Product({
          name,
          description,
          images,
          price,
          category,
          condition,
          charge_for_delivery,
          delivery_fee,
          price_negotiable,
          shop: user.shop._id,
        });
  
        // Save the product to the database
        const savedProduct = await newProduct.save();
  
        res.status(201).json({ message: 'Product created successfully', product: savedProduct });
      });
    } catch (error) {
      console.log("Error uploading product: ", error);
      res.status(500).json({ message: "Internal server error" });
    }
};
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Paper, 
  TextField,
  Button,
  Box,
  Grid,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { toast } from 'react-toastify';

import PageContainer from '../components/Layout/PageContainer';
import { productService } from '../services/api';
import { formatCurrency, parseCurrency } from '../utils/currency';

const ProductFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    inStock: true,
    stockQuantity: '',
    sku: '',
    imageUrl: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Fetch product data if in edit mode
  useEffect(() => {
    const fetchProduct = async () => {
      if (isEditMode) {
        try {
          setLoading(true);
          const response = await productService.getProductById(id);
          setFormData(response.data.product);
        } catch (error) {
          console.error('Failed to fetch product:', error);
          setError('Failed to load product data. Please try again later.');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProduct();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!formData.price) {
      errors.price = 'Price is required';
    } else if (isNaN(formData.price) || parseFloat(formData.price) < 0) {
      errors.price = 'Price must be a positive number';
    }
    
    if (!formData.category.trim()) {
      errors.category = 'Category is required';
    }
    
    if (!formData.stockQuantity) {
      errors.stockQuantity = 'Stock quantity is required';
    } else if (isNaN(formData.stockQuantity) || parseInt(formData.stockQuantity) < 0) {
      errors.stockQuantity = 'Stock quantity must be a positive number';
    }
    
    if (!formData.sku.trim()) {
      errors.sku = 'SKU is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Convert numeric fields
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity)
      };
      
      if (isEditMode) {
        await productService.updateProduct(id, productData);
        toast.success('Product updated successfully');
      } else {
        await productService.createProduct(productData);
        toast.success('Product created successfully');
      }
      
      navigate('/products');
    } catch (error) {
      console.error('Failed to save product:', error);
      setError(
        error.response?.data?.message || 
        `Failed to ${isEditMode ? 'update' : 'create'} product. Please try again later.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link 
            color="inherit" 
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate('/products')}
          >
            Products
          </Link>
          <Typography color="text.primary">
            {isEditMode ? 'Edit Product' : 'New Product'}
          </Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" gutterBottom>
          {isEditMode ? 'Edit Product' : 'Add New Product'}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Paper sx={{ p: 3 }}>
          {loading && !isEditMode ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Product Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="SKU"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    error={!!formErrors.sku}
                    helperText={formErrors.sku}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    multiline
                    rows={4}
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    error={!!formErrors.description}
                    helperText={formErrors.description}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Price"
                    name="price"
                    type="text"
                    value={formatCurrency(formData.price)}
                    onChange={(e) => {
                      const parsedValue = parseCurrency(e.target.value);
                      if (!isNaN(parsedValue)) {
                        setFormData({ ...formData, price: parsedValue });
                      }
                    }}
                    fullWidth
                    required
                    error={!!formErrors.price}
                    helperText={formErrors.price}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    error={!!formErrors.category}
                    helperText={formErrors.category}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Stock Quantity"
                    name="stockQuantity"
                    type="number"
                    inputProps={{ min: 0 }}
                    value={formData.stockQuantity}
                    onChange={handleChange}
                    error={!!formErrors.stockQuantity}
                    helperText={formErrors.stockQuantity}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="inStock"
                        checked={formData.inStock}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="In Stock"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Image URL"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </Grid>
                
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<ArrowBack />}
                      onClick={() => navigate('/products')}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<Save />}
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Save Product'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>
      </Box>
    </PageContainer>
  );
};

export default ProductFormPage;
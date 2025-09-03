import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Product {
  _id: string;
  item_id: string;
  item_name: string;
  item_description: string;
  brand: string;
  prices: {
    full_price: number;
    sale_price: number;
  };
  categories: string[];
  user_reviews: Array<{
    rating: number;
    comment: string;
    review_date: string;
  }>;
}

interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: "", max: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<ProductsResponse['pagination'] | null>(null);

  const categories = [
    "All Categories",
    "Sofa",
    "Chair", 
    "Table",
    "Bed",
    "Desk",
    "Cabinet",
    "Dining",
    "Living Room",
    "Bedroom",
    "Office"
  ];

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12"
      });

      if (selectedCategory && selectedCategory !== "All Categories") {
        params.append("category", selectedCategory);
      }
      if (priceRange.min) params.append("minPrice", priceRange.min);
      if (priceRange.max) params.append("maxPrice", priceRange.max);

      const response = await fetch(`http://localhost:3000/api/products?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data: ProductsResponse = await response.json();
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(currentPage);
  }, [selectedCategory, priceRange, currentPage]);

  const calculateAverageRating = (reviews: Product['user_reviews']) => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchProducts(1);
  };

  if (loading && products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading our beautiful furniture collection...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => fetchProducts(currentPage)}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Our Furniture Collection</h1>
        <p className="text-lg text-muted-foreground">
          Discover premium furniture pieces for your home and office
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 p-6 border rounded-lg bg-card">
        <h3 className="text-lg font-semibold mb-4">Filter Products</h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            >
              {categories.map((category) => (
                <option key={category} value={category === "All Categories" ? "" : category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium mb-2">Price Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
              <input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
          </div>

          {/* Apply Button */}
          <div className="flex items-end">
            <Button onClick={handleApplyFilters} className="w-full">
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Results Info */}
      {pagination && (
        <div className="mb-6 flex justify-between items-center">
          <p className="text-muted-foreground">
            Showing {products.length} of {pagination.total} products
          </p>
          <p className="text-muted-foreground">
            Page {pagination.page} of {pagination.pages}
          </p>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {products.map((product) => (
          <div key={product.item_id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
            {/* Product Image Placeholder */}
            <div className="h-48 bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">🪑</div>
                <p className="text-sm text-muted-foreground">
                  {product.categories[0] || "Furniture"}
                </p>
              </div>
            </div>

            {/* Product Info */}
            <div className="p-4">
              <div className="mb-2">
                <h3 className="font-semibold text-lg line-clamp-2">{product.item_name}</h3>
                <p className="text-sm text-muted-foreground">{product.brand}</p>
              </div>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {product.item_description}
              </p>

              {/* Rating */}
              {product.user_reviews.length > 0 && (
                <div className="flex items-center mb-3">
                  <div className="flex items-center">
                    <span className="text-yellow-500">★</span>
                    <span className="text-sm ml-1">
                      {calculateAverageRating(product.user_reviews)}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({product.user_reviews.length} reviews)
                  </span>
                </div>
              )}

              {/* Categories */}
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {product.categories.slice(0, 2).map((category, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-md"
                    >
                      {category}
                    </span>
                  ))}
                  {product.categories.length > 2 && (
                    <span className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-md">
                      +{product.categories.length - 2}
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-primary">
                    {formatPrice(product.prices.sale_price)}
                  </span>
                  {product.prices.full_price > product.prices.sale_price && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(product.prices.full_price)}
                    </span>
                  )}
                </div>
                {product.prices.full_price > product.prices.sale_price && (
                  <span className="text-sm text-green-600 font-medium">
                    Save {formatPrice(product.prices.full_price - product.prices.sale_price)}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button className="w-full" size="sm">
                  Add to Cart
                </Button>
                <Button variant="outline" className="w-full" size="sm" asChild>
                  <Link to={`/products/${product.item_id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
            const page = i + 1;
            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            );
          })}
          
          {pagination.pages > 5 && currentPage < pagination.pages - 2 && (
            <>
              <span className="px-3 py-2">...</span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(pagination.pages)}
              >
                {pagination.pages}
              </Button>
            </>
          )}
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
            disabled={currentPage === pagination.pages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Empty State */}
      {products.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2">No products found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters or browse all categories
          </p>
          <Button onClick={() => {
            setSelectedCategory("");
            setPriceRange({ min: "", max: "" });
            setCurrentPage(1);
          }}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}

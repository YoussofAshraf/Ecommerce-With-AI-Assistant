import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

export function HomePage() {
  const features = [
    {
      icon: "⚡",
      title: "Fast Performance",
      description: "Built with Vite and React for lightning-fast development and production builds."
    },
    {
      icon: "🎨",
      title: "Modern UI",
      description: "Beautiful components powered by Radix UI and styled with Tailwind CSS."
    },
    {
      icon: "🔒",
      title: "Type Safe",
      description: "Full TypeScript support for better developer experience and fewer bugs."
    },
    {
      icon: "🤖",
      title: "AI Powered",
      description: "Integrated AI chat assistant to help with product discovery and customer support."
    }
  ];

  const collections = [
    {
      title: "Living Room",
      description: "Comfortable sofas, elegant coffee tables, and stylish entertainment centers",
      image: "🛋️",
      items: "150+ items"
    },
    {
      title: "Bedroom",
      description: "Peaceful bed frames, spacious wardrobes, and cozy nightstands", 
      image: "🛏️",
      items: "120+ items"
    },
    {
      title: "Dining Room",
      description: "Elegant dining tables, comfortable chairs, and beautiful sideboards",
      image: "🍽️",
      items: "80+ items"
    },
    {
      title: "Office",
      description: "Ergonomic chairs, functional desks, and organized storage solutions",
      image: "💼",
      items: "90+ items"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Interior Designer",
      content: "The quality and design of the furniture exceeded my expectations. Perfect for modern homes!",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Homeowner",
      content: "Amazing customer service and fast delivery. The AI chat helped me find exactly what I needed.",
      rating: 5
    },
    {
      name: "Emily Davis",
      role: "Office Manager",
      content: "Great selection of office furniture. Everything arrived perfectly and looks fantastic.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5"></div>
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Transform Your Space
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Discover premium furniture pieces that blend comfort, style, and functionality. 
              Create the perfect home with our curated collection of modern and timeless designs.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link to="/products">Shop Collection</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                <Link to="/chat">Ask AI Assistant</Link>
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Premium Items</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">50K+</div>
                <div className="text-sm text-muted-foreground">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">4.9</div>
                <div className="text-sm text-muted-foreground">Star Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">AI Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collections Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Shop by Collection</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore our carefully curated collections designed for every room in your home
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {collections.map((collection, index) => (
              <Link 
                key={index}
                to="/products"
                className="group block p-6 border rounded-xl hover:shadow-lg transition-all duration-300 bg-background hover:border-primary/50"
              >
                <div className="text-center">
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {collection.image}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {collection.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3 leading-relaxed">
                    {collection.description}
                  </p>
                  <div className="text-sm font-medium text-primary">
                    {collection.items}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose Us</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We're committed to providing the best furniture shopping experience with cutting-edge technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">What Our Customers Say</h2>
            <p className="text-lg text-muted-foreground">
              Real reviews from real customers who love our furniture
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="p-6 bg-background border rounded-xl">
                <div className="flex items-center mb-4">
                  {Array.from({ length: testimonial.rating }, (_, i) => (
                    <span key={i} className="text-yellow-500 text-lg">★</span>
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Home?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Browse our complete collection of premium furniture or chat with our AI assistant 
              to find the perfect pieces for your space.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link to="/products">Browse All Products</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                <Link to="/chat">Get AI Recommendations</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

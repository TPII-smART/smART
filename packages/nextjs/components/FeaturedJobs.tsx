import { Badge } from "@/components/Badge";
import Button from "@/components/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/Card";
import { StarIcon } from "lucide-react";

const featuredJobs = [
  {
    id: 1,
    title: "I'll create a Figma perfect for your next project!",
    description: "I'll create a Figma for your next Web Application.",
    price: "0.1 ETH",
    category: "Design",
    rating: 4.8,
  },
  {
    id: 2,
    title: "Stunning 3D Art for Games & Animation",
    description: "Custom 3D models and assets for your game or animation project.",
    price: "0.2 ETH",
    category: "3D Art",
    rating: 4.9,
  },
  {
    id: 3,
    title: "Professional Photo Editing & Retouching",
    description: "Enhance your photos with expert editing and retouching services.",
    price: "0.08 ETH",
    category: "Photography",
    rating: 4.7,
  },
];

export function FeaturedJobs() {
  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-bold tracking-tight text-center mb-12">Featured Jobs</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredJobs.map(prompt => (
            <Card key={prompt.id} className="group relative overflow-hidden transition-all hover:shadow-lg">
              <CardHeader>
                <div className="flex">
                  <div>
                    <CardTitle>{prompt.title}</CardTitle>
                    <CardDescription className="mt-2">{prompt.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div className="w-fit">
                    <Badge variant="secondary">{prompt.category}</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <StarIcon className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium">{prompt.rating}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <span className="text-lg font-bold">{prompt.price}</span>
                <Button variant={"primary"}>Buy Now</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

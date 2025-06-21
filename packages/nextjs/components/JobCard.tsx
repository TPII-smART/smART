import * as React from "react";
import { Badge } from "@/components/Badge";
import Button from "@/components/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/Card";
import { cn } from "@/lib/utils";
import { StarIcon } from "lucide-react";

type Job = {
  id: number;
  title: string;
  description: string;
  price: string;
  category: string;
  rating: number;
};

interface JobCardProps extends React.HTMLAttributes<HTMLDivElement> {
  job: Job;
}

export function JobCard({ job, className, ...props }: JobCardProps) {
  return (
    <Card className={cn("group relative overflow-hidden transition-all hover:shadow-lg", className)} {...props}>
      <CardHeader>
        <CardTitle>{job.title}</CardTitle>
        <CardDescription className="mt-2">{job.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="w-fit">
          <Badge variant="secondary">{job.category}</Badge>
        </div>
        <div className="flex items-center gap-1 text-yellow-500">
          <StarIcon className="h-4 w-4 fill-current" />
          <span className="text-sm font-medium">{job.rating}</span>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-lg font-bold">{job.price}</span>
        <Button variant="primary">Buy Now</Button>
      </CardFooter>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

interface NewsCardProps {
  title: string;
  excerpt: string;
  date: string;
  category: string;
}

const NewsCard = ({ title, excerpt, date, category }: NewsCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
      <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 mb-2">
          <Badge variant="secondary" className="text-xs">
            {category}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {date}
          </div>
        </div>
        <CardTitle className="text-lg line-clamp-2">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm line-clamp-3">{excerpt}</p>
      </CardContent>
    </Card>
  );
};

export default NewsCard;

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, User } from 'lucide-react';

interface DoctorCardProps {
  name: string;
  specialty: string;
  experience?: string;
  rating?: number;
  available?: boolean;
}

const DoctorCard = ({ name, specialty, experience, rating = 4.5, available = true }: DoctorCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center flex-shrink-0">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{name}</h3>
            <p className="text-primary font-medium text-sm">{specialty}</p>
            {experience && (
              <p className="text-muted-foreground text-sm mt-1">{experience}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-medium">{rating.toFixed(1)}</span>
              </div>
              <Badge variant={available ? "default" : "secondary"} className="text-xs">
                {available ? 'Available' : 'Busy'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DoctorCard;

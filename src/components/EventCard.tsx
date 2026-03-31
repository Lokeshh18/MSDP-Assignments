import { Link } from "react-router-dom";
import { Calendar, Clock, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface EventCardProps {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string;
  location: string;
  club_name: string;
  poster_image: string | null;
}

export default function EventCard({ id, title, description, date, time, location, club_name, poster_image }: EventCardProps) {
  return (
    <Link to={`/events/${id}`}>
      <Card className="group overflow-hidden border border-border hover:border-primary/40 hover:shadow-lg transition-all duration-300">
        <div className="aspect-[16/9] overflow-hidden bg-muted">
          {poster_image ? (
            <img src={poster_image} alt={title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
              <span className="font-heading text-2xl font-bold text-primary/40">{club_name}</span>
            </div>
          )}
        </div>
        <CardContent className="p-5">
          <Badge variant="secondary" className="mb-3 text-xs font-medium">{club_name}</Badge>
          <h3 className="font-heading text-lg font-bold text-foreground mb-2 line-clamp-1">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>
          )}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(date), "MMM d, yyyy")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {time}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {location}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

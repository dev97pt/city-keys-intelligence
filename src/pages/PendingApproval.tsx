import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Clock, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PendingApproval() {
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/5">
          <Clock className="h-10 w-10 text-primary" />
        </div>
        <h1 className="mt-8 font-serif text-3xl font-semibold text-foreground">
          Application Under Review
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Your application is under review. You will receive access once approved
          by our team. We carefully vet every member to maintain the quality of
          our community.
        </p>
        <p className="mt-6 text-xs text-muted-foreground/70">
          This usually takes 24–48 hours.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={signOut}
          className="mt-8"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

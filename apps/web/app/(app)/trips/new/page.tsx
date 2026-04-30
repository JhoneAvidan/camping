import type { Metadata } from "next";

import { NewTripForm } from "@/components/trips/new-trip-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "טיול חדש" };

export default function NewTripPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">טיול חדש</h1>
        <p className="text-muted-foreground">
          תנו לטיול שם, ציינו תאריכים אם הם ידועים, וצרו אותו. אתם תהיו הבעלים
          ותוכלו להזמין חברים בהמשך.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>פרטי הטיול</CardTitle>
          <CardDescription>
            רק השם הוא שדה חובה. אפשר תמיד לערוך הכל אחר כך.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewTripForm />
        </CardContent>
      </Card>
    </div>
  );
}

import Link from "next/link";
import type { Media, StudentStory, Destination, University } from "@prisma/client";
import { Plate } from "@/components/ui/plate";
import { cn } from "@/lib/utils";

type Story = StudentStory & { photo?: Media | null; destination?: Destination | null; university?: University | null; programme?: { title: string; shortTitle: string | null } | null };

export function StoryCard({ story, className }: { story: Story; className?: string }) {
  return (
    <Link href={`/student-stories/${story.slug}`} className={cn("group flex flex-col gap-5", className)}>
      <Plate media={story.photo} slot={`Student portrait — ${story.studentName}`} aspect="3/4" sizes="(min-width:1024px) 30vw, 90vw" />
      {story.quote ? <p className="font-display text-[1.5rem] leading-[1.25] text-fg">“{story.quote}”</p> : null}
      <div className="border-t border-line pt-3 text-sm">
        <p className="font-medium text-fg">{story.studentName}</p>
        <p className="text-fg-muted">
          {story.programme?.shortTitle ?? story.programme?.title}
          {story.destination ? ` → ${story.destination.country}` : ""}
          {story.university ? `, ${story.university.name}` : ""}
        </p>
      </div>
    </Link>
  );
}

import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initialsOf } from "@/components/ml/viewer";
import { iconSize } from "@/lib/tokens";

/**
 * Another person's round photo, or their initials when there is none: the inbox rows, the chat
 * header and the photo beside their messages. Size and type size come in through className.
 */
export function PersonAvatar({
  name,
  photo,
  className,
}: {
  name: string | null | undefined;
  photo: string | null | undefined;
  className: string;
}) {
  return (
    <Avatar className={className}>
      {photo ? <AvatarImage src={photo} alt="" className="object-cover" /> : null}
      <AvatarFallback className="bg-ink/5 font-semibold text-foreground">
        {initialsOf(name ?? null) || <User size={iconSize.sm} aria-hidden />}
      </AvatarFallback>
    </Avatar>
  );
}

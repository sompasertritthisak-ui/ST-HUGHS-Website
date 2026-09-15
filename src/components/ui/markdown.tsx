import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

/** Safe markdown → React. Raw HTML is never rendered. */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("prose-shv", className)}>
      <ReactMarkdown
        skipHtml
        components={{
          a: ({ href, children: c }) => {
            const external = href && /^https?:\/\//.test(href);
            return (
              <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {c}
              </a>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

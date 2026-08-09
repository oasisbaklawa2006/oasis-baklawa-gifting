import { announcements } from "@/data/site";

export function AnnouncementBar() {
  return (
    <div className="bg-espresso text-background">
      <div className="container-oasis flex h-9 items-center justify-center gap-6 overflow-hidden">
        <ul className="flex items-center gap-6 text-[0.6875rem] uppercase tracking-[0.16em]">
          {announcements.map((item, i) => (
            <li key={item} className={i === 0 ? "" : "hidden md:flex md:items-center md:gap-6"}>
              {i === 0 ? null : (
                <span className="inline-block size-1 rounded-full bg-gold" aria-hidden="true" />
              )}
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

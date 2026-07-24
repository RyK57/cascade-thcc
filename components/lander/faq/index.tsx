import { FaqItemCard } from "./faq-item";
import { FAQ_ITEMS } from "./faq-data";

export function FaqSection() {
  return (
    <section id="faq" className="border-t border-border/60 py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            FAQ
          </p>
          <h2 className="mt-2 font-secondary text-3xl sm:text-4xl">
            Common questions
          </h2>
        </div>
        <div className="grid gap-4">
          {FAQ_ITEMS.map((item) => (
            <FaqItemCard key={item.question} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

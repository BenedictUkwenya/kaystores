import { VALUE_PROPS } from "@/lib/data/home";
import { ValueIcon } from "@/components/ui/Icons";

export function ValuePropsBar() {
  return (
    <section className="bg-kay-surface px-6 py-10 lg:px-10 lg:py-12">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-6">
        {VALUE_PROPS.map((prop) => (
          <div key={prop.title} className="flex flex-col items-center text-center lg:flex-row lg:items-start lg:text-left lg:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center text-kay-fg">
              <ValueIcon name={prop.icon} />
            </div>
            <div className="mt-3 lg:mt-0">
              <p className="text-[13px] font-semibold text-kay-fg">{prop.title}</p>
              <p className="mt-0.5 text-[12px] text-kay-muted">{prop.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

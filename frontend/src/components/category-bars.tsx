import type { CategoryBar } from '@/lib/poll/categories'

export function CategoryBars({ categories, empty }: { categories: CategoryBar[]; empty: string }) {
  return (
    <div className="flex flex-col gap-3">
      {categories.length ? (
        categories.map((category) => (
          <div key={category.name} className="flex flex-col gap-1.5">
            <div className="flex justify-between gap-2 text-[13px]">
              <span className="inline-flex items-center gap-2 font-semibold">
                <category.icon className="size-3.5" style={{ color: category.color }} />
                {category.name}
              </span>
              <span className="font-mono text-muted-foreground">{category.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full" style={{ width: `${category.percent}%`, background: category.color }} />
            </div>
          </div>
        ))
      ) : (
        <p className="m-0 text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  )
}

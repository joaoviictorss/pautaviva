import { Reveal } from '@/components/reveal'
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from '@/components/ui/avatar'
import { Check } from 'lucide-react'

import type { RolesLayoutProps } from '../data'

export function Roles({ roles }: RolesLayoutProps) {
  return (
    <section className="w-full px-3.5 py-12 sm:px-10 md:py-16">
      <Reveal>
        <h2 className="text-center text-[13px] font-semibold tracking-[.06em] text-muted-foreground uppercase">
          Cada um no seu papel
        </h2>
      </Reveal>

      <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Reveal
            key={role.title}
            delay={role.delay}
            className="flex flex-col gap-4.5 rounded-[31px] bg-card p-6 shadow-[0_0_0_1px_rgba(0,0,0,.1)]"
          >
            <div className="flex items-center justify-between">
              <span className="flex size-11 items-center justify-center rounded-[14px] bg-accent">
                <role.icon className="size-5.5 text-accent-foreground" />
              </span>
              <AvatarGroup>
                {role.people.map((person) => (
                  <Avatar key={person.name} className="size-[30px]">
                    <AvatarImage src={person.src} alt="" />
                    <AvatarFallback style={{ background: person.bg, color: person.fg }}>
                      {person.initials}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </AvatarGroup>
            </div>

            <div>
              <h3 className="text-[19px] leading-snug font-bold tracking-[-0.015em]">
                {role.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {role.description}
              </p>
            </div>

            <ul className="mt-2 flex flex-col gap-2.5 border-t border-border pt-4">
              {role.items.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-tight">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { bootScript } from '@/lib/boot-script'
import { BootLoader } from '@/components/boot-loader'
import { CurtainProvider } from '@/components/curtain'
import { NavLink } from '@/components/nav-link'
import { RouteFocus } from '@/components/route-focus'
import { DemoPanel } from '@/components/demo-panel'

export const metadata: Metadata = {
  title: { default: 'Home · Page transitions demo', template: '%s · Page transitions demo' },
  description: 'A small demo of a smart loader and three page transition styles.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: the boot script sets attributes on <html> before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        {/* Without JS nothing can reveal the page, so never hide it. */}
        <noscript>
          <style>{`html[data-boot] #app{visibility:visible!important} #boot-loader{display:none!important} [data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <BootLoader />
        <CurtainProvider>
          <div id="app">
            <header className="site-header">
              <NavLink href="/" className="brand">
                Studio
              </NavLink>
              <nav aria-label="Primary">
                <NavLink href="/">Work</NavLink>
                <NavLink href="/about">About</NavLink>
                <NavLink href="/journal">Journal</NavLink>
              </nav>
            </header>
            <main id="main">{children}</main>
          </div>
          <RouteFocus />
        </CurtainProvider>
        <DemoPanel />
      </body>
    </html>
  )
}

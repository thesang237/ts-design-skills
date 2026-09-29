import type { NextConfig } from 'next'

// No `experimental.viewTransition` flag: on Next 16.3 the App Router already
// ships a React build that includes <ViewTransition> and Link `transitionTypes`.
const nextConfig: NextConfig = {}

export default nextConfig

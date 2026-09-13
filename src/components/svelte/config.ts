export const compilerConfig = {
    compilerOptions: {
        css: 'external' as const,
        experimental: {
            customRenderer: 'uno-ui/svelte/renderer',
        },
    },
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  server: {
    socket: '/dev/shm/otmc.portal.nuxt.socket'
  }
})

// npm run dev -–unix-socket=/dev/shm/otmc.portal.nuxt.socket

import { Router } from 'itty-router'

/**
 * ROUTER
 */
const router = Router()

/**
 * FUNCTIONS
 */
async function refreshData() {
    let data = await KV.get('asnData')
    if (data !== null) {
        return JSON.parse(data)
    }
    
    data = await fetch("https://asndb.network/get/latest/asn.json", {
        cf: {
            cacheTtl: 86400,
            cacheEverything: true
        }
    })
    data = await data.json();

    // Now to save it
    await KV.put('asnData', JSON.stringify(data), {expirationTtl: 86400})
    return data
}

/**
 * ROUTES
 */
router.get("/", async (request) => {
    let asndb = await refreshData();
    let output = {
        'asn': request.cf.asn,
        'name': asndb[request.cf.asn] || 'UNKNOWN'
    };
    return new Response(JSON.stringify(output), {
        headers: {
            'Content-Type': 'application/json'
        }
    });
})

/**
 * 404
 */
router.all("*", () => new Response("404, not found!", { status: 404 }))

/**
 * EVENT LISTENERS
 */
addEventListener('fetch', (e) => {
  e.respondWith(router.handle(e.request))
})

addEventListener("scheduled", event => {
    event.waitUntil(refreshData())
})

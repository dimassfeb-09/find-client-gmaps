import puppeteer from 'puppeteer'
import { createLogger } from '../server/logger.js'

const log = createLogger('scraper')

export async function scrapePlaces(keyword, location, options = {}) {
  const { mode = 'sequential', concurrency = 3, onProgress } = options
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const results = []

  try {
    onProgress?.({ type: 'status', message: 'Searching Google Maps...' })

    // Step 1: Get all listing URLs (same for both modes)
    const listings = await getListings(browser, keyword, location)
    const total = Math.min(listings.length, 20)
    log.info({ total: listings.length }, `Found ${listings.length} results, processing up to ${total}`)
    onProgress?.({ type: 'listings', total })

    if (mode === 'concurrent' && total > 0) {
      await scrapeConcurrent(browser, listings, total, concurrency, keyword, location, results, onProgress)
    } else {
      await scrapeSequential(browser, listings, total, keyword, location, results, onProgress)
    }

    // Step 3: Verify WhatsApp numbers automatically
    await verifyWhatsAppNumbers(browser, results, onProgress)

    log.info({ saved: results.length }, `Completed: ${results.length}/${Math.min(listings.length, 20)} places saved`)
    onProgress?.({ type: 'done', count: results.length })
  } catch (err) {
    onProgress?.({ type: 'error', message: err.message })
    throw err
  } finally {
    await browser.close()
  }
  return results
}

// --- Verify WhatsApp numbers via wa.me ---
async function verifyWhatsAppNumbers(browser, results, onProgress) {
  const toCheck = results.filter((r) => r.phone)
  if (toCheck.length === 0) return

  onProgress?.({ type: 'status', message: `Checking ${toCheck.length} WhatsApp numbers...` })

  const poolSize = Math.min(3, toCheck.length)
  const pages = []
  for (let p = 0; p < poolSize; p++) {
    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    )
    pages.push(page)
  }

  let completed = 0

  for (let start = 0; start < toCheck.length; start += poolSize) {
    const batch = toCheck.slice(start, start + poolSize)

    const tasks = batch.map(async (result, idx) => {
      const page = pages[idx]
      try {
        const hasWA = await checkWhatsAppNumber(page, result.phone)
        result.whatsappVerified = hasWA ? 1 : 0
      } catch {
        result.whatsappVerified = 0
      }
    })

    await Promise.allSettled(tasks)
    completed += batch.length
    onProgress?.({ type: 'wa_progress', current: completed, total: toCheck.length })
  }

  for (const page of pages) {
    await page.close().catch(() => {})
  }
}

async function checkWhatsAppNumber(page, phone) {
  if (!phone) return false

  // Normalize to international format
  const digits = phone.replace(/\D/g, '')
  let wa = digits
  if (wa.startsWith('0')) wa = '62' + wa.slice(1)
  else if (wa.startsWith('628') || wa.startsWith('62')) wa = wa
  else return false

  if (wa.length < 10) return false

  try {
    await page.goto(`https://wa.me/${wa}`, { waitUntil: 'networkidle2', timeout: 15000 })
    await new Promise((r) => setTimeout(r, 1500))

    const text = await page.evaluate(() => document.body.innerText.toLowerCase())

    // wa.me shows error text when number is not on WhatsApp
    const notFoundPatterns = ['not found', 'tidak ditemukan', 'invalid number', 'phone number']
    if (notFoundPatterns.some((p) => text.includes(p))) {
      return false
    }

    return true
  } catch {
    return false
  }
}

// --- Standalone: check a single phone number, opens/closes its own browser ---
export async function verifySingleWhatsApp(phone) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  try {
    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    )
    return await checkWhatsAppNumber(page, phone)
  } finally {
    await browser.close()
  }
}

// --- Standalone: check multiple phone numbers with a shared browser ---
export async function verifyBatchWhatsApp(phones, onProgress) {
  if (phones.length === 0) return []
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const results = []
  try {
    const poolSize = Math.min(3, phones.length)
    const pages = []
    for (let p = 0; p < poolSize; p++) {
      const page = await browser.newPage()
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      )
      pages.push(page)
    }
    let completed = 0
    for (let start = 0; start < phones.length; start += poolSize) {
      const batch = phones.slice(start, start + poolSize)
      const tasks = batch.map(async (phone, idx) => {
        try {
          return await checkWhatsAppNumber(pages[idx], phone)
        } catch {
          return false
        }
      })
      const batchResults = await Promise.allSettled(tasks)
      for (let i = 0; i < batch.length; i++) {
        results.push({
          phone: batch[i],
          hasWhatsApp: batchResults[i].status === 'fulfilled' ? batchResults[i].value : false,
        })
      }
      completed += batch.length
      onProgress?.({ current: completed, total: phones.length })
    }
    for (const page of pages) {
      await page.close().catch(() => {})
    }
  } finally {
    await browser.close()
  }
  return results
}

// --- Step 1: Get all listing URLs from search results ---
async function getListings(browser, keyword, location) {
  const page = await browser.newPage()
  await page.setViewport({ width: 1400, height: 900 })
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  )

  const searchQuery = encodeURIComponent(`${keyword} ${location}`)
  await page.goto(`https://www.google.com/maps/search/${searchQuery}/`, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  })
  await page.waitForSelector('div[role="feed"]', { timeout: 15000 }).catch(() => {})
  await autoScroll(page, 'div[role="feed"]')

  const listings = await page.evaluate(() => {
    const cards = document.querySelectorAll('a.hfpxzc')
    return Array.from(cards).map((card) => ({
      name: card.getAttribute('aria-label') || '',
      href: card.getAttribute('href') || '',
    }))
  })

  await page.close()
  return listings
}

// --- Sequential: one by one (default) ---
async function scrapeSequential(browser, listings, total, keyword, location, results, onProgress) {
  for (let i = 0; i < total; i++) {
    const listing = listings[i]
    if (!listing.name) continue
    log.info({ progress: `${i + 1}/${total}`, name: listing.name }, `[${i + 1}/${total}] ${listing.name}`)
    onProgress?.({ type: 'progress', current: i + 1, total, name: listing.name })

    try {
      await processListing(browser, listing, keyword, location, results, onProgress)
    } catch (err) {
      log.warn({ err }, `[${i + 1}/${total}] ${listing.name} error`)
      onProgress?.({ type: 'error', message: err.message?.slice(0, 80) || 'unknown' })
    }
  }
}

// --- Concurrent: process N listings in parallel with a pool of pages ---
async function scrapeConcurrent(browser, listings, total, concurrencyLimit, keyword, location, results, onProgress) {
  const poolSize = Math.min(concurrencyLimit, total)

  const pages = []
  for (let p = 0; p < poolSize; p++) {
    const page = await browser.newPage()
    await page.setViewport({ width: 1400, height: 900 })
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    )
    pages.push(page)
  }

  let completed = 0

  for (let start = 0; start < total; start += poolSize) {
    const batch = listings.slice(start, start + poolSize)
    const batchIndexes = batch.map((_, i) => start + i)

    const tasks = batch.map((listing, idx) => {
      const globalIdx = start + idx
      const page = pages[idx]
      return (async () => {
        if (!listing.name) return
        log.info({ progress: `${globalIdx + 1}/${total}`, name: listing.name }, `[${globalIdx + 1}/${total}] ${listing.name}`)
        onProgress?.({ type: 'progress', current: globalIdx + 1, total, name: listing.name })
        try {
          await processListingOnPage(page, listing, keyword, location, results, onProgress, globalIdx + 1, total)
        } catch (err) {
          log.warn({ err }, `[${globalIdx + 1}/${total}] ${listing.name} error`)
          onProgress?.({ type: 'error', message: err.message?.slice(0, 80) || 'unknown' })
        }
      })()
    })

    await Promise.allSettled(tasks)
    completed += batch.length
  }

  for (const page of pages) {
    await page.close().catch(() => {})
  }
}

// --- Extract data from a single listing (uses new page each time) ---
async function processListing(browser, listing, keyword, location, results, onProgress, current, total) {
  const page = await browser.newPage()
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  )

  try {
    await processListingOnPage(page, listing, keyword, location, results, onProgress, current, total)
  } finally {
    await page.close().catch(() => {})
  }
}

// --- Extract data from a single listing (using provided page) ---
async function processListingOnPage(page, listing, keyword, location, results, onProgress, current, total) {
  await page.goto(listing.href, { waitUntil: 'networkidle2', timeout: 20000 })
  await new Promise((r) => setTimeout(r, 2000))

  const details = await page.evaluate(() => {
    const addressEl =
      document.querySelector('[data-item-id="address"]') ||
      document.querySelector('[data-tooltip="Salin alamat"]') ||
      document.querySelector('[data-tooltip="Copy address"]')
    const address = addressEl
      ? addressEl.getAttribute('aria-label')?.replace(/^Alamat:\s*/i, '') ||
        addressEl.textContent?.trim()
      : null

    const websiteEl =
      document.querySelector('[data-item-id="authority"]') ||
      document.querySelector('a[data-tooltip="Buka situs"]') ||
      document.querySelector('a[aria-label*="Situs Web"i]') ||
      document.querySelector('a[aria-label*="Website"i]')
    const website = websiteEl ? websiteEl.href || null : null

    const phoneEl =
      document.querySelector('[data-item-id^="phone:tel:"]') ||
      document.querySelector('[data-tooltip="Salin nomor telepon"]') ||
      document.querySelector('[data-tooltip="Copy phone number"]')
    let phone = null
    if (phoneEl) {
      const ariaLabel = phoneEl.getAttribute('aria-label') || ''
      phone =
        ariaLabel.replace(/^Telepon:\s*/i, '').trim() ||
        phoneEl.textContent?.trim().replace(/^[^\d+]+/, '') ||
        null
    }

    const emailEl = document.querySelector('a[href*="mailto:"]')
    const email = emailEl ? emailEl.href.replace('mailto:', '') : null

    const url = window.location.href
    const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    const latitude = coordMatch ? parseFloat(coordMatch[1]) : null
    const longitude = coordMatch ? parseFloat(coordMatch[2]) : null

    return { address, website, phone, email, latitude, longitude }
  })

  const address = details.address || listing.name
  const addressParts = address ? address.split(',').map((s) => s.trim()) : []
  let city = location
  if (addressParts.length >= 2) {
    city = addressParts[addressParts.length - 2] || location
  }

  results.push({
    name: listing.name,
    address,
    latitude: details.latitude,
    longitude: details.longitude,
    city,
    phone: details.phone,
    email: details.email,
    website: details.website,
    hasWebsite: details.website ? 1 : 0,
    whatsappVerified: 0,
    searchKeyword: `${keyword} ${location}`,
  })

  log.debug({ hasPhone: !!details.phone, hasWebsite: !!details.website }, `${listing.name} details`)
  onProgress?.({
    type: 'detail',
    current: current ?? results.length,
    total: total ?? 0,
    name: listing.name,
    phone: !!details.phone,
    website: !!details.website,
  })
}

// --- Auto-scroll the results panel ---
async function autoScroll(page, containerSelector) {
  await page.evaluate(async (selector) => {
    const container = document.querySelector(selector)
    if (!container) return

    let prevHeight = -1
    let unchanged = 0

    while (unchanged < 5) {
      container.scrollTop = container.scrollHeight
      await new Promise((r) => setTimeout(r, 1500))
      const newHeight = container.scrollHeight
      if (newHeight === prevHeight) {
        unchanged++
      } else {
        unchanged = 0
      }
      prevHeight = newHeight
    }
  }, containerSelector)
}

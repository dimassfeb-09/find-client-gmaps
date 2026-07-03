import puppeteer from 'puppeteer'

export async function scrapePlaces(keyword, location, options = {}) {
  const { mode = 'sequential', concurrency = 3 } = options
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const results = []

  try {
    // Step 1: Get all listing URLs (same for both modes)
    const listings = await getListings(browser, keyword, location)
    const total = Math.min(listings.length, 20)
    console.log(`  Found ${listings.length} results, processing up to ${total}`)

    if (mode === 'concurrent' && total > 0) {
      await scrapeConcurrent(browser, listings, total, concurrency, keyword, location, results)
    } else {
      await scrapeSequential(browser, listings, total, keyword, location, results)
    }
  } finally {
    await browser.close()
  }

  console.log(`  Completed: ${results.length}/${Math.min(listings.length, 20)} places saved`)
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
async function scrapeSequential(browser, listings, total, keyword, location, results) {
  for (let i = 0; i < total; i++) {
    const listing = listings[i]
    if (!listing.name) continue
    console.log(`  [${i + 1}/${total}] ${listing.name}...`)

    try {
      await processListing(browser, listing, keyword, location, results)
    } catch (err) {
      console.log(`    ✗ error: ${err.message?.slice(0, 80) || 'unknown'}`)
    }
  }
}

// --- Concurrent: process N listings in parallel with a pool of pages ---
async function scrapeConcurrent(browser, listings, total, concurrencyLimit, keyword, location, results) {
  const poolSize = Math.min(concurrencyLimit, total)

  // Create a pool of pages
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

  // Process in batches
  for (let start = 0; start < total; start += poolSize) {
    const batch = listings.slice(start, start + poolSize)
    const batchIndexes = batch.map((_, i) => start + i)

    const tasks = batch.map((listing, idx) => {
      const globalIdx = start + idx
      const page = pages[idx]
      return (async () => {
        if (!listing.name) return
        console.log(`  [${globalIdx + 1}/${total}] ${listing.name}...`)
        try {
          await processListingOnPage(page, listing, keyword, location, results)
        } catch (err) {
          console.log(`    [${globalIdx + 1}/${total}] ✗ ${err.message?.slice(0, 80) || 'unknown'}`)
        }
      })()
    })

    await Promise.allSettled(tasks)
    completed += batch.length
  }

  // Close pool pages
  for (const page of pages) {
    await page.close().catch(() => {})
  }
}

// --- Extract data from a single listing (uses new page each time) ---
async function processListing(browser, listing, keyword, location, results) {
  const page = await browser.newPage()
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  )

  try {
    await processListingOnPage(page, listing, keyword, location, results)
  } finally {
    await page.close().catch(() => {})
  }
}

// --- Extract data from a single listing (using provided page) ---
async function processListingOnPage(page, listing, keyword, location, results) {
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
    searchKeyword: `${keyword} ${location}`,
  })

  console.log(`    ✓ phone: ${details.phone ? 'yes' : 'no'}, website: ${details.website ? 'yes' : 'no'}`)
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

const puppeteer = require('puppeteer')
const url = require('url')
const express = require('express')
const app = express()

const HOST = process.argv[2]
const TIMEOUT = 30000

if (!HOST) {
  console.error("💥 Missing host name, exiting.")
  process.exit(1)
}

app.get('/', async (req, res) => {
  const path = req.query.path
  const selector = req.query.selector

  if (!path || !selector) {
    res.status(422)
    res.end()
  }

  const target = url.resolve(HOST, path)

  console.log(`📸 ${target} => ${selector}`)

  const screenshot = await takeScreenshot(target, selector)

  res.type('image/png')
  res.send(screenshot)
})

app.listen(5000, () => console.log('Hotshot listening on port 5000.'))

async function takeScreenshot (url, selector, padding = 0) {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  const page = await browser.newPage()

  page.setDefaultNavigationTimeout(TIMEOUT)
  page.setViewport({ width: 1000, height: 600, deviceScaleFactor: 2 })

  await page.goto(url, { waitUntil: 'networkidle2' })

  const rect = await page.evaluate(selector => {
    const element = document.querySelector(selector)
    const { x, y, width, height } = element.getBoundingClientRect()
    return { left: x, top: y, width, height, id: element.id }
  }, selector)

  const screenshot = await page.screenshot({
    // path: 'element.png',
    clip: {
      x: rect.left - padding,
      y: rect.top - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2
    }
  })

  await browser.close()

  return screenshot
}

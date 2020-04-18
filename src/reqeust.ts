import http from 'http'
import https from 'https'
import zlib from 'zlib'
import cheerio from 'cheerio'
import child_process from 'child_process'
import path from 'path'
import fs from 'fs'
import mime from 'mime'
import { 
  MAX_THREADS, 
  DOWN_FILE_DIR_PATH, 
  REQ_CONTEXT, 
  SELECTOR, 
  LIMITATION, 
  ENABLE_DEBUG,
  RequestContext
} from './config'

let useHttps = false

export function run (): void {
  const reqContext = getRequestContext(REQ_CONTEXT)
  const reqMethod = useHttps ? https.get : http.get

  reqMethod(reqContext, (res) => {
    console.log(`状态码: ${res.statusCode}`)
    console.log(`响应头: ${JSON.stringify(res.headers)}`)
  
    const encoding = res.headers['content-encoding'] || ''
    const isChunked = res.headers['transfer-encoding'] === 'chunked'
  
    if (isChunked) {
      const chunks: Array<Buffer> = []
      let totalLength = 0
  
      res.on('data', (chunk) => {
        chunks.push(chunk)
        totalLength += chunk.length
      })
  
      res.on('end', () => {
        let newBuf = Buffer.concat(chunks, totalLength)
        if (/gzip/.test(encoding)) {
          zlib.gunzip(newBuf, (err, result) => {
            if (err) {
              console.error(err)
              return 
            }
            findImgsInContent(result.toString('utf8'))
          })
        } else {
          findImgsInContent(newBuf.toString('utf8'))
        }
      })
    } else {
      res.on('data', (chunk) => {
        findImgsInContent(chunk.toString('utf8'))
      })
    }
  })
}

function getRequestContext (options: RequestContext): RequestContext {
  const context = { ...options }

  const mr = options.url.match(/^(https?):\/\/([^\/]+)(\S+)$/)
  if (mr) {
    let [ protocol, hostname, path ] = mr.slice(1)
    
    if (!/^https?$/.test(protocol)) {
      throw new Error('只支持http(s)协议的请求')
    }

    context.hostname = hostname
    context.path = path
    useHttps = protocol === 'https'
    context.port = options.port || (useHttps ? 443 : 80)
  }

  if (ENABLE_DEBUG) {
    console.log(context)
  }

  return context
}

function findImgsInContent (html: string): void {
  let $ = cheerio.load(html)
  let imgs = $(SELECTOR)
  let sources: Array<ImageContext> = []

  Object.keys(imgs).forEach(id => {
    let img = imgs[+id]
    let url = $(img).attr('data-src') || $(img).attr('src') || ''
    
    let sourceType = mime.getType(url)
    if (!sourceType || !sourceType.startsWith('image/')) return

    if (url.startsWith('//')) {
      url = `http${useHttps ? 's' : ''}:${url}`
    }

    if (url) {
      sources.push({ url, id })
    }
  })

  if (LIMITATION > 0) {
    sources = sources.slice(0, LIMITATION)
  }

  if (sources.length) {
    checkAndCreateDir(DOWN_FILE_DIR_PATH)
    if (ENABLE_DEBUG) {
      console.log('sources: ', sources)
    }
    downAllSources(sources)
  }
}

function checkAndCreateDir (path: string): void {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true })
  }
}

function downAllSources (sources: ImageContext[]) {
  const threads = sources.length < MAX_THREADS ? sources.length : MAX_THREADS
  const _s = sources.slice()

  for (let i = 0; i < threads; i++) {
    let child = child_process.fork(path.join(__dirname, 'down-file'))

    child.on('message', () => {
      if (_s.length) {
        let fileSource = _s.shift() as ImageContext
        let filename = fileSource.id + path.extname(fileSource.url)
        child.send(fileSource.url + '|' + filename)
      } else {
        child.disconnect()
      }
    })

    child.on('exit', (code) => {
      console.log('child process exit with code ' + code)
    })
  
    if (_s.length) {
      let fileSource = _s.shift() as ImageContext
      let filename = fileSource.id + path.extname(fileSource.url)
      child.send({ fileUrl: fileSource.url, filename, https: useHttps })
    }
  }
}
